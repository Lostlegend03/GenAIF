import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

interface Entry {
  id?: number;
  name: string;
  number: string;
  email: string;
  amountToPay: number;
  amountPaid: number;
}

const API_URL = 'http://localhost:4000/api/customers';

function App() {
  const [form, setForm] = useState({
    name: '',
    number: '',
    email: '',
    amountToPay: '',
    amountPaid: '',
  });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Entry | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const response = await res.json();
      // Extract the data array from the API response
      if (response.success && Array.isArray(response.data)) {
        setEntries(response.data);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      setError('Failed to fetch customers. Please check if the server is running.');
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    // Ensure entries is an array
    if (!Array.isArray(entries)) {
      return [];
    }
    if (!searchTerm) return entries;
    return entries.filter(entry => {
      // Ensure entry has required properties
      if (!entry || typeof entry.name !== 'string' || typeof entry.email !== 'string' || typeof entry.number !== 'string') {
        return false;
      }
      return (
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.number.includes(searchTerm)
      );
    });
  }, [entries, searchTerm]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    // Ensure entries is an array and has valid data
    if (!Array.isArray(entries) || entries.length === 0) {
      return {
        totalAmountToPay: 0,
        totalAmountPaid: 0,
        totalPending: 0,
        customersCount: 0,
        fullyPaidCount: 0,
        pendingCount: 0
      };
    }
    
    const totalAmountToPay = entries.reduce((sum, entry) => {
      return sum + (typeof entry.amountToPay === 'number' ? entry.amountToPay : 0);
    }, 0);
    const totalAmountPaid = entries.reduce((sum, entry) => {
      return sum + (typeof entry.amountPaid === 'number' ? entry.amountPaid : 0);
    }, 0);
    const totalPending = totalAmountToPay - totalAmountPaid;
    const customersCount = entries.length;
    const fullyPaidCount = entries.filter(entry => 
      typeof entry.amountToPay === 'number' && 
      typeof entry.amountPaid === 'number' && 
      entry.amountToPay <= entry.amountPaid
    ).length;
    const pendingCount = entries.filter(entry => 
      typeof entry.amountToPay === 'number' && 
      typeof entry.amountPaid === 'number' && 
      entry.amountToPay > entry.amountPaid
    ).length;
    
    return {
      totalAmountToPay,
      totalAmountPaid,
      totalPending,
      customersCount,
      fullyPaidCount,
      pendingCount
    };
  }, [entries]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Enhanced client-side validation
    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }
    
    if (!form.number.trim()) {
      setError('Phone number is required');
      return;
    }
    
    if (!form.email.trim()) {
      setError('Email address is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (parseFloat(form.amountToPay) < 0 || parseFloat(form.amountPaid) < 0) {
      setError('Amounts cannot be negative');
      return;
    }
    
    if (isNaN(parseFloat(form.amountToPay))) {
      setError('Amount to pay must be a valid number');
      return;
    }
    
    try {
      const payload = {
        name: form.name.trim(),
        number: form.number.trim(),
        email: form.email.trim(),
        amountToPay: parseFloat(form.amountToPay) || 0,
        amountPaid: parseFloat(form.amountPaid) || 0,
      };
      
      // Use appropriate HTTP method and endpoint based on operation
      const url = isEditMode && editingEntry?.id ? `${API_URL}/${editingEntry.id}` : API_URL;
      const method = isEditMode ? 'PUT' : 'POST';
      
      console.log('Form submission details:', {
        isEditMode,
        editingEntryId: editingEntry?.id,
        method,
        url,
        payload
      });
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('API Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error! status: ${res.status}`;
        } catch {
          // If response is not JSON (HTML error page), handle it
          errorMessage = `Server error (${res.status}). Please check if the backend server is running correctly.`;
        }
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await res.json();
      } catch {
        // Handle non-JSON responses
        result = { message: isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!' };
      }
      
      clearForm();
      setSuccessMessage(result.message || (isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!'));
      setIsFormVisible(false);
      fetchEntries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save customer: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Submit error:', err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!editingEntry?.id) {
      setError('Invalid customer selected for payment');
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }
    
    const remainingAmount = editingEntry.amountToPay - editingEntry.amountPaid;
    if (amount > remainingAmount) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingAmount)}`);
      return;
    }
    
    try {
      const url = `${API_URL}/${editingEntry.id}/payment`;
      const payload = {
        paymentAmount: amount,
        paymentType: 'add'
      };
      
      console.log('Payment submission:', {
        customerId: editingEntry.id,
        currentPaid: editingEntry.amountPaid,
        paymentAmount: amount,
        newTotal: editingEntry.amountPaid + amount
      });
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error! status: ${res.status}`;
        } catch {
          errorMessage = `Server error (${res.status}). Please check if the backend server is running correctly.`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      setSuccessMessage(`Payment of ${formatCurrency(amount)} recorded successfully!`);
      setPaymentAmount('');
      setIsPaymentMode(false);
      setIsFormVisible(false);
      setEditingEntry(null);
      fetchEntries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to process payment: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Payment error:', err);
    }
  };

  const clearForm = () => {
    setForm({ name: '', number: '', email: '', amountToPay: '', amountPaid: '' });
    setError('');
    setSuccessMessage('');
    setEditingEntry(null);
    setIsEditMode(false);
    setIsPaymentMode(false);
    setPaymentAmount('');
  };

  const handlePaymentClick = (entry: Entry) => {
    console.log('Payment clicked for customer:', entry);
    
    // Validate entry has ID before allowing payment
    if (!entry.id) {
      setError('Cannot process payment: Missing customer ID');
      return;
    }
    
    // Check if customer has any pending amount
    const remainingAmount = entry.amountToPay - entry.amountPaid;
    if (remainingAmount <= 0) {
      setError('This customer has no pending payment. Payment is already complete!');
      return;
    }
    
    setEditingEntry(entry);
    setIsPaymentMode(true);
    setIsFormVisible(true);
    setPaymentAmount('');
    setError('');
    setSuccessMessage('');
    
    console.log('Payment mode activated for customer ID:', entry.id, 'Remaining amount:', remainingAmount);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setIsEditMode(false);
    setIsPaymentMode(false);
    clearForm();
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    if (isEditMode || isPaymentMode) {
      cancelEdit();
    }
    setIsFormVisible(!isFormVisible);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (amountToPay: number, amountPaid: number) => {
    const pending = amountToPay - amountPaid;
    if (pending <= 0) {
      return <span className="status-badge paid">Paid</span>;
    } else if (amountPaid > 0) {
      return <span className="status-badge partial">Partial</span>;
    } else {
      return <span className="status-badge pending">Pending</span>;
    }
  };

  const handleDeleteClick = (entry: Entry) => {
    setCustomerToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete || !customerToDelete.id) {
      setError('Invalid customer selected for deletion');
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${customerToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error! status: ${res.status}`;
        } catch {
          errorMessage = `Server error (${res.status}). Please check if the backend server is running correctly.`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      setSuccessMessage(result.message || 'Customer deleted successfully!');
      fetchEntries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete customer: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Delete error:', err);
    }

    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>💼 DueDesk Dashboard</h1>
          <p>Manage customer payments with ease</p>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="summary-card">
            <h3>📊 Summary</h3>
            <div className="summary-item">
              <span className="summary-label">Total Customers:</span>
              <span className="summary-value">{summary.customersCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Fully Paid:</span>
              <span className="summary-value paid">{summary.fullyPaidCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pending:</span>
              <span className="summary-value pending">{summary.pendingCount}</span>
            </div>
            <hr className="summary-divider" />
            <div className="summary-item total">
              <span className="summary-label">Total to Collect:</span>
              <span className="summary-value">{formatCurrency(summary.totalAmountToPay)}</span>
            </div>
            <div className="summary-item total">
              <span className="summary-label">Total Collected:</span>
              <span className="summary-value">{formatCurrency(summary.totalAmountPaid)}</span>
            </div>
            <div className="summary-item highlight">
              <span className="summary-label">💰 Amount Pending:</span>
              <span className="summary-value pending-amount">{formatCurrency(summary.totalPending)}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search by name, email, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              onClick={handleAddNew}
              className="add-customer-btn"
            >
              {isFormVisible ? (isPaymentMode ? '❌ Cancel Payment' : isEditMode ? '❌ Cancel Edit' : '❌ Cancel') : '➕ Add Customer'}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="message error-message">
              ⚠️ {error}
              <button onClick={() => setError('')} className="close-message">✕</button>
            </div>
          )}
          
          {successMessage && (
            <div className="message success-message">
              ✅ {successMessage}
              <button onClick={() => setSuccessMessage('')} className="close-message">✕</button>
            </div>
          )}

          {/* Add Customer Form / Payment Form */}
          {isFormVisible && (
            <div className="form-container">
              <h3>{isPaymentMode ? `💳 Make Payment: ${editingEntry?.name}` : isEditMode ? `✏️ Edit Customer: ${editingEntry?.name}` : 'Add New Customer'}</h3>
              {isPaymentMode ? (
                // Payment Form
                <form className="payment-form" onSubmit={handlePayment}>
                  <div className="payment-info">
                    <div className="customer-summary">
                      <h4>🧾 Payment Summary</h4>
                      <div className="payment-details">
                        <div className="payment-row">
                          <span>💰 Total Amount:</span>
                          <span className="amount-value">{formatCurrency(editingEntry?.amountToPay || 0)}</span>
                        </div>
                        <div className="payment-row">
                          <span>💳 Already Paid:</span>
                          <span className="amount-value">{formatCurrency(editingEntry?.amountPaid || 0)}</span>
                        </div>
                        <div className="payment-row highlight">
                          <span>⏳ Amount Remaining:</span>
                          <span className="amount-value pending-amount">
                            {formatCurrency((editingEntry?.amountToPay || 0) - (editingEntry?.amountPaid || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="payment-input-section">
                      <div className="form-group">
                        <label>💸 Payment Amount *</label>
                        <input
                          type="number"
                          placeholder="Enter payment amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min="0.01"
                          max={(editingEntry?.amountToPay || 0) - (editingEntry?.amountPaid || 0)}
                          step="0.01"
                          required
                          className="payment-input"
                        />
                        <small className="input-hint">
                          Maximum: {formatCurrency((editingEntry?.amountToPay || 0) - (editingEntry?.amountPaid || 0))}
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="payment-btn">💳 Process Payment</button>
                    <button type="button" onClick={cancelEdit} className="cancel-btn">❌ Cancel</button>
                  </div>
                </form>
              ) : (
                // Regular Customer Form
                <form className="customer-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>👤 Customer Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>📞 Phone Number *</label>
                    <input
                      type="tel"
                      name="number"
                      placeholder="Enter phone number"
                      value={form.number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>📧 Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>💰 Amount to Pay *</label>
                    <input
                      type="number"
                      name="amountToPay"
                      placeholder="0.00"
                      value={form.amountToPay}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>💳 Amount Paid</label>
                    <input
                      type="number"
                      name="amountPaid"
                      placeholder="0.00"
                      value={form.amountPaid}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn">💾 Save Customer</button>
                  <button type="button" onClick={clearForm} className="clear-btn">🗑️ Clear Form</button>
                </div>
                </form>
              )}
            </div>
          )}

          {/* Customer Table */}
          <div className="table-container">
            <div className="table-header">
              <h3>Customer Records</h3>
              <span className="record-count">
                {filteredEntries.length} of {entries.length} customers
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </span>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading customers...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? (
                  <>
                    <p>🔍 No customers found matching "{searchTerm}"</p>
                    <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <p>📋 No customers added yet</p>
                    <button onClick={() => setIsFormVisible(true)} className="add-first-btn">
                      Add Your First Customer
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th>Customer Info</th>
                      <th>Contact</th>
                      <th>Amount to Pay</th>
                      <th>Amount Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const pending = entry.amountToPay - entry.amountPaid;
                      return (
                        <tr key={entry.id || entry.email} className={pending <= 0 ? 'paid-row' : 'pending-row'}>
                          <td>
                            <div className="customer-info">
                              <strong>{entry.name}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="contact-info">
                              <div>📞 {entry.number}</div>
                              <div>📧 {entry.email}</div>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(entry.amountToPay)}</td>
                          <td className="amount-cell">{formatCurrency(entry.amountPaid)}</td>
                          <td className={`amount-cell ${pending > 0 ? 'pending-amount' : 'paid-amount'}`}>
                            {formatCurrency(pending)}
                          </td>
                          <td>{getStatusBadge(entry.amountToPay, entry.amountPaid)}</td>
                          <td>
                            <div className="action-buttons">
                              {pending > 0 ? (
                                <button 
                                  onClick={() => handlePaymentClick(entry)}
                                  className="payment-btn-small"
                                  title="Make payment"
                                >
                                  💳 Pay
                                </button>
                              ) : (
                                <span className="paid-indicator" title="Payment completed">
                                  ✅ Paid
                                </span>
                              )}
                              <button 
                                onClick={() => handleDeleteClick(entry)}
                                className="delete-btn"
                                title="Delete customer"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && customerToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🗑️ Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this customer?</p>
              <div className="customer-to-delete">
                <strong>👤 {customerToDelete?.name}</strong>
                <div>📧 {customerToDelete?.email}</div>
                <div>📞 {customerToDelete?.number}</div>
                <div className="amount-info">
                  <span>💰 Amount to Pay: {formatCurrency(customerToDelete?.amountToPay || 0)}</span>
                  <span>💳 Amount Paid: {formatCurrency(customerToDelete?.amountPaid || 0)}</span>
                </div>
              </div>
              <p className="warning-text">⚠️ This action cannot be undone!</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleDeleteCancel}
                className="cancel-btn"
              >
                ❌ Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="confirm-delete-btn"
              >
                🗑️ Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
