const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./customers.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create table with improved structure
db.run(`CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  amountToPay REAL NOT NULL DEFAULT 0,
  amountPaid REAL NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Helper function to calculate remaining amount and payment status
function calculateCustomerDetails(customer) {
  const amountRemaining = Math.max(0, customer.amountToPay - customer.amountPaid);
  const overpayment = Math.max(0, customer.amountPaid - customer.amountToPay);
  
  let paymentStatus;
  if (customer.amountPaid === 0) {
    paymentStatus = 'Not Paid';
  } else if (customer.amountPaid >= customer.amountToPay) {
    paymentStatus = customer.amountPaid > customer.amountToPay ? 'Overpaid' : 'Paid';
  } else {
    paymentStatus = 'Partially Paid';
  }
  
  return {
    ...customer,
    amountRemaining,
    overpayment,
    paymentStatus,
    paymentPercentage: customer.amountToPay > 0 ? Math.min(100, (customer.amountPaid / customer.amountToPay) * 100) : 0
  };
}

// Add new customer
app.post('/api/customers', (req, res) => {
  const { name, number, email, amountToPay = 0, amountPaid = 0 } = req.body;
  
  // Basic input validation
  if (!name || !number || !email) {
    return res.status(400).json({ 
      success: false,
      error: 'Name, number, and email are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Please provide a valid email address' 
    });
  }
  
  if (typeof amountToPay !== 'number' || typeof amountPaid !== 'number') {
    return res.status(400).json({ 
      success: false,
      error: 'Amounts must be numbers' 
    });
  }
  
  if (amountToPay < 0 || amountPaid < 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Amounts cannot be negative' 
    });
  }

  // Check if email already exists
  db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    if (row) {
      // Email already exists, return error
      return res.status(409).json({ 
        success: false,
        error: 'Customer with this email already exists' 
      });
    }
    
    // Insert new customer
    db.run(
      'INSERT INTO customers (name, number, email, amountToPay, amountPaid) VALUES (?, ?, ?, ?, ?)',
      [name, number, email, amountToPay, amountPaid],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ 
              success: false,
              error: 'Customer with this email already exists' 
            });
          }
          return res.status(500).json({ 
            success: false,
            error: err.message 
          });
        }
        
        // Get the created customer with calculated details
        db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, newCustomer) => {
          if (err) return res.status(500).json({ 
            success: false,
            error: err.message 
          });
          
          const customerWithDetails = calculateCustomerDetails(newCustomer);
          
          res.status(201).json({ 
            success: true,
            data: customerWithDetails,
            message: 'Customer created successfully'
          });
        });
      }
    );
  });
});

// Update existing customer by ID
app.put('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  const { name, number, email, amountToPay, amountPaid } = req.body;
  
  // Basic input validation
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid customer ID is required' 
    });
  }
  
  if (!name || !number || !email) {
    return res.status(400).json({ 
      success: false,
      error: 'Name, number, and email are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Please provide a valid email address' 
    });
  }
  
  if (typeof amountToPay !== 'number' || typeof amountPaid !== 'number') {
    return res.status(400).json({ 
      success: false,
      error: 'Amounts must be numbers' 
    });
  }
  
  if (amountToPay < 0 || amountPaid < 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Amounts cannot be negative' 
    });
  }

  // Check if customer exists
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, row) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }

    // Check if email is being changed and if it conflicts with another customer
    if (row.email !== email) {
      db.get('SELECT * FROM customers WHERE email = ? AND id != ?', [email, customerId], (err, conflictRow) => {
        if (err) return res.status(500).json({ 
          success: false,
          error: err.message 
        });
        
        if (conflictRow) {
          return res.status(409).json({ 
            success: false,
            error: 'Email already exists for another customer' 
          });
        }
        
        // Update the customer
        updateCustomer();
      });
    } else {
      // Email hasn't changed, safe to update
      updateCustomer();
    }
    
    function updateCustomer() {
      db.run(
        'UPDATE customers SET name=?, number=?, email=?, amountToPay=?, amountPaid=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
        [name, number, email, amountToPay, amountPaid, customerId],
        function (err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              return res.status(409).json({ 
                success: false,
                error: 'Email already exists for another customer' 
              });
            }
            return res.status(500).json({ 
              success: false,
              error: err.message 
            });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ 
              success: false,
              error: 'Customer not found' 
            });
          }
          
          // Get the updated customer with calculated details
          db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, updatedCustomer) => {
            if (err) return res.status(500).json({ 
              success: false,
              error: err.message 
            });
            
            const customerWithDetails = calculateCustomerDetails(updatedCustomer);
            
            res.json({ 
              success: true,
              data: customerWithDetails,
              message: 'Customer updated successfully'
            });
          });
        }
      );
    }
  });
});

// Get all customers with enhanced details and filtering options
app.get('/api/customers', (req, res) => {
  const { status, sortBy = 'name', order = 'ASC', limit, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM customers';
  let params = [];
  
  // Add filtering by payment status if requested
  if (status) {
    // We'll filter on the client side since SQLite doesn't have direct status calculation
  }
  
  // Add sorting
  const validSortFields = ['name', 'email', 'amountToPay', 'amountPaid', 'createdAt', 'updatedAt'];
  const validOrder = ['ASC', 'DESC'];
  
  if (validSortFields.includes(sortBy) && validOrder.includes(order.toUpperCase())) {
    query += ` ORDER BY ${sortBy} ${order.toUpperCase()}`;
  }
  
  // Add pagination
  if (limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    // Calculate enhanced details for each customer
    let customersWithDetails = rows.map(customer => calculateCustomerDetails(customer));
    
    // Apply status filtering if requested
    if (status) {
      const validStatuses = ['Not Paid', 'Partially Paid', 'Paid', 'Overpaid'];
      if (validStatuses.includes(status)) {
        customersWithDetails = customersWithDetails.filter(customer => customer.paymentStatus === status);
      }
    }
    
    // Calculate summary statistics
    const totalCustomers = customersWithDetails.length;
    const totalAmountToPay = customersWithDetails.reduce((sum, c) => sum + c.amountToPay, 0);
    const totalAmountPaid = customersWithDetails.reduce((sum, c) => sum + c.amountPaid, 0);
    const totalAmountRemaining = customersWithDetails.reduce((sum, c) => sum + c.amountRemaining, 0);
    const totalOverpayment = customersWithDetails.reduce((sum, c) => sum + c.overpayment, 0);
    
    const statusCounts = {
      'Not Paid': customersWithDetails.filter(c => c.paymentStatus === 'Not Paid').length,
      'Partially Paid': customersWithDetails.filter(c => c.paymentStatus === 'Partially Paid').length,
      'Paid': customersWithDetails.filter(c => c.paymentStatus === 'Paid').length,
      'Overpaid': customersWithDetails.filter(c => c.paymentStatus === 'Overpaid').length
    };
    
    res.json({
      success: true,
      data: customersWithDetails,
      summary: {
        totalCustomers,
        totalAmountToPay: Math.round(totalAmountToPay * 100) / 100,
        totalAmountPaid: Math.round(totalAmountPaid * 100) / 100,
        totalAmountRemaining: Math.round(totalAmountRemaining * 100) / 100,
        totalOverpayment: Math.round(totalOverpayment * 100) / 100,
        statusCounts
      },
      pagination: {
        offset: parseInt(offset),
        limit: limit ? parseInt(limit) : totalCustomers,
        total: totalCustomers
      }
    });
  });
});

// Get a specific customer by ID
app.get('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid customer ID is required' 
    });
  }
  
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, row) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    const customerWithDetails = calculateCustomerDetails(row);
    
    res.json({
      success: true,
      data: customerWithDetails
    });
  });
});

// Update payment for a customer (partial payment endpoint)
app.patch('/api/customers/:id/payment', (req, res) => {
  const customerId = parseInt(req.params.id);
  const { paymentAmount, paymentType = 'add' } = req.body; // 'add' or 'set'
  
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid customer ID is required' 
    });
  }
  
  if (typeof paymentAmount !== 'number' || paymentAmount < 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Payment amount must be a positive number' 
    });
  }
  
  // Get current customer data
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    let newAmountPaid;
    if (paymentType === 'set') {
      newAmountPaid = paymentAmount;
    } else { // 'add'
      newAmountPaid = customer.amountPaid + paymentAmount;
    }
    
    // Update the payment
    db.run(
      'UPDATE customers SET amountPaid = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newAmountPaid, customerId],
      function (err) {
        if (err) return res.status(500).json({ 
          success: false,
          error: err.message 
        });
        
        // Get updated customer data
        db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, updatedCustomer) => {
          if (err) return res.status(500).json({ 
            success: false,
            error: err.message 
          });
          
          const customerWithDetails = calculateCustomerDetails(updatedCustomer);
          
          res.json({
            success: true,
            data: customerWithDetails,
            message: `Payment ${paymentType === 'add' ? 'added' : 'updated'} successfully`
          });
        });
      }
    );
  });
});

// Delete a customer
app.delete('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  
  if (!customerId || isNaN(customerId)) {
    return res.status(400).json({ 
      success: false,
      error: 'Valid customer ID is required' 
    });
  }
  
  // Check if customer exists first
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    // Delete the customer
    db.run('DELETE FROM customers WHERE id = ?', [customerId], function (err) {
      if (err) return res.status(500).json({ 
        success: false,
        error: err.message 
      });
      
      res.json({
        success: true,
        message: 'Customer deleted successfully',
        deletedCustomer: calculateCustomerDetails(customer)
      });
    });
  });
});

// Get dashboard summary
app.get('/api/dashboard/summary', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) return res.status(500).json({ 
      success: false,
      error: err.message 
    });
    
    const customersWithDetails = rows.map(customer => calculateCustomerDetails(customer));
    
    const summary = {
      totalCustomers: customersWithDetails.length,
      totalAmountToPay: customersWithDetails.reduce((sum, c) => sum + c.amountToPay, 0),
      totalAmountPaid: customersWithDetails.reduce((sum, c) => sum + c.amountPaid, 0),
      totalAmountRemaining: customersWithDetails.reduce((sum, c) => sum + c.amountRemaining, 0),
      totalOverpayment: customersWithDetails.reduce((sum, c) => sum + c.overpayment, 0),
      statusCounts: {
        'Not Paid': customersWithDetails.filter(c => c.paymentStatus === 'Not Paid').length,
        'Partially Paid': customersWithDetails.filter(c => c.paymentStatus === 'Partially Paid').length,
        'Paid': customersWithDetails.filter(c => c.paymentStatus === 'Paid').length,
        'Overpaid': customersWithDetails.filter(c => c.paymentStatus === 'Overpaid').length
      },
      recentCustomers: customersWithDetails
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
      overdueCustomers: customersWithDetails.filter(c => c.paymentStatus === 'Not Paid' && c.amountToPay > 0),
      collectionEfficiency: customersWithDetails.length > 0 ? 
        (customersWithDetails.reduce((sum, c) => sum + c.paymentPercentage, 0) / customersWithDetails.length) : 0
    };
    
    // Round monetary values
    ['totalAmountToPay', 'totalAmountPaid', 'totalAmountRemaining', 'totalOverpayment'].forEach(key => {
      summary[key] = Math.round(summary[key] * 100) / 100;
    });
    summary.collectionEfficiency = Math.round(summary.collectionEfficiency * 100) / 100;
    
    res.json({
      success: true,
      data: summary
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DueDesk API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`- GET /api/health - Health check`);
  console.log(`- GET /api/customers - Get all customers with enhanced details`);
  console.log(`- GET /api/customers/:id - Get specific customer`);
  console.log(`- POST /api/customers - Create new customer`);
  console.log(`- PUT /api/customers/:id - Update customer`);
  console.log(`- PATCH /api/customers/:id/payment - Update payment`);
  console.log(`- DELETE /api/customers/:id - Delete customer`);
  console.log(`- GET /api/dashboard/summary - Get dashboard summary`);
});
