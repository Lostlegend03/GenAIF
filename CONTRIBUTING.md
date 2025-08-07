# Contributing to DueDesk

Welcome to the DueDesk team! This guide will help you get started with contributing to our payment management system.

## 🚀 Quick Setup for New Team Members

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd DueDesk
```

### 2. Install Dependencies
```bash
# Backend
cd duedesk-backend
npm install

# Frontend  
cd ../duedesk-dashboard
npm install
cd ..
```

### 3. Run the Application
Choose one of these methods:

**Option A: Automatic (Windows)**
```powershell
.\start-duedesk.ps1
```

**Option B: Manual (Separate Terminals)**
```bash
# Terminal 1 - Backend
cd duedesk-backend
npm start

# Terminal 2 - Frontend  
cd duedesk-dashboard
npm start
```

## 🔧 Development Workflow

### Branch Naming Convention
- `feature/payment-validation` - New features
- `bugfix/customer-deletion-issue` - Bug fixes
- `hotfix/security-patch` - Critical fixes
- `docs/update-readme` - Documentation updates

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Backend changes: Edit files in `duedesk-backend/`
   - Frontend changes: Edit files in `duedesk-dashboard/src/`

3. **Test your changes**:
   - Ensure both backend and frontend start without errors
   - Test the functionality you modified
   - Check for console errors

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```

5. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 📁 Project Structure

```
DueDesk/
├── duedesk-backend/           # Node.js Express API
│   ├── index.js              # Main server file
│   ├── customers.db          # SQLite database
│   └── package.json          # Backend dependencies
│
├── duedesk-dashboard/        # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Main app component
│   │   ├── App.css          # App styles
│   │   └── index.tsx        # React entry point
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
│
├── Launch DueDesk.bat       # Windows launcher
├── start-duedesk.ps1        # PowerShell launcher
└── README.md                # Project documentation
```

## 🛠️ Common Development Tasks

### Adding New API Endpoints
1. Edit `duedesk-backend/index.js`
2. Add your route handler
3. Test with Postman or frontend

### Adding New Frontend Features
1. Create/edit components in `duedesk-dashboard/src/`
2. Update CSS in respective `.css` files
3. Test in browser at `http://localhost:3000`

### Database Changes
- The SQLite database (`customers.db`) contains sample data
- Be careful when modifying database structure
- Always backup before major changes

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 4000 or 3000
netstat -ano | findstr :4000
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

### NPM Install Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Git Issues
```bash
# Sync with latest changes
git checkout main
git pull

# Resolve merge conflicts
git mergetool
```

## 📋 Code Style Guidelines

### Backend (JavaScript)
- Use `const` for constants, `let` for variables
- Use arrow functions for callbacks
- Add error handling for all API endpoints
- Use meaningful variable names

### Frontend (TypeScript/React)
- Use functional components with hooks
- Type all props and state
- Use CSS modules or styled-components
- Keep components small and focused

## 🔍 Testing

### Manual Testing Checklist
- [ ] Backend starts without errors
- [ ] Frontend loads correctly
- [ ] Customer list displays
- [ ] Add new customer works
- [ ] Payment processing works
- [ ] Delete customer works
- [ ] No console errors

### API Testing
Use tools like Postman to test endpoints:
- `GET http://localhost:4000/api/customers`
- `POST http://localhost:4000/api/customers`
- `PATCH http://localhost:4000/api/customers/:id/payment`
- `DELETE http://localhost:4000/api/customers/:id`

## 📞 Getting Help

- Check existing issues on GitHub
- Ask questions in team chat
- Review documentation in README.md
- Test your changes thoroughly before submitting PR

## 🎯 Pull Request Guidelines

### Before Submitting
- [ ] Code builds without errors
- [ ] Features work as expected
- [ ] No breaking changes to existing functionality
- [ ] Added/updated documentation if needed

### PR Description Template
```markdown
## What does this PR do?
Brief description of changes

## How to test
1. Steps to test the changes
2. Expected behavior

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Tested locally
- [ ] No console errors
- [ ] Documentation updated
```

---

Happy coding! 🚀 Together we'll make DueDesk the best payment management system!
