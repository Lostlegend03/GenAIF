# DueDesk - Payment Management System

A modern payment management dashboard built with React and Node.js for tracking customer payments and managing debt collection.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git (for collaboration)

### 📥 Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd DueDesk

# Install backend dependencies
cd duedesk-backend
npm install

# Install frontend dependencies
cd ../duedesk-dashboard
npm install
cd ..
```

### 🏃‍♂️ Running the Application

#### Option 1: Manual Start (Separate Terminals)

**Terminal 1 - Backend Server:**
```bash
cd duedesk-backend
npm start
```
↗️ Server: http://localhost:4000

**Terminal 2 - Frontend Dashboard:**
```bash
cd duedesk-dashboard
npm start
```
↗️ Dashboard: http://localhost:3000

#### Option 2: Quick Launch (Windows)
Double-click `Launch DueDesk.bat` or run:
```powershell
.\start-duedesk.ps1
```

## 👥 Collaboration Guide

### Git Workflow for Team Members

1. **Clone the repo**:
   ```bash
   git clone <your-repo-url>
   cd DueDesk
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

4. **Push changes to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** from your branch to the main branch

6. **Merge** after review and approval

### Keeping Your Branch Updated

```bash
git checkout main
git pull
git checkout your-feature-branch
git merge main
```

## Features

- 💳 **Payment Processing**: Make payments against customer balances
- 📊 **Dashboard**: Real-time payment statistics and summaries  
- 👥 **Customer Management**: Add, view, and delete customers
- 🔍 **Search & Filter**: Find customers quickly
- 📱 **Responsive**: Works on desktop and mobile

## Technology Stack

- **Frontend**: React, TypeScript, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Payment API**: RESTful endpoints with validation

## API Endpoints

- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer  
- `DELETE /api/customers/:id` - Delete customer
- `PATCH /api/customers/:id/payment` - Process payment

## Project Structure

```
duedesk/
├── duedesk-backend/     # Node.js API server
├── duedesk-dashboard/   # React frontend
├── Launch DueDesk.bat   # Windows quick launcher
└── start-duedesk.ps1    # PowerShell launcher
```

---

**DueDesk** - Simple. Fast. Reliable payment management.
