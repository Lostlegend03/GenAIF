# DueDesk Application Launcher
# This script starts both the backend API server and the React frontend

Write-Host "Starting DueDesk Application..." -ForegroundColor Green
Write-Host "Current directory: $PWD" -ForegroundColor Yellow

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    }
    catch {
        return $true
    }
}

# Check if backend port (4000) is already in use
if (Test-Port 4000) {
    Write-Host "WARNING: Port 4000 is already in use. Backend might already be running." -ForegroundColor Yellow
    Write-Host "         You can check by visiting: http://localhost:4000/api/health" -ForegroundColor Cyan
} else {
    Write-Host "Port 4000 is available for backend" -ForegroundColor Green
}

# Check if frontend port (3000) is already in use
if (Test-Port 3000) {
    Write-Host "WARNING: Port 3000 is already in use. Frontend might already be running." -ForegroundColor Yellow
    Write-Host "         You can check by visiting: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "Port 3000 is available for frontend" -ForegroundColor Green
}

Write-Host "`nStarting Backend Server (Port 4000)..." -ForegroundColor Blue

# Start backend server in a new PowerShell window
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'E:\GenAI\Userstory\duedesk-backend'; Write-Host 'Starting DueDesk Backend...' -ForegroundColor Green; npm start" -PassThru

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host "Starting Frontend Dashboard (Port 3000)..." -ForegroundColor Blue

# Start frontend in a new PowerShell window
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'E:\GenAI\Userstory\duedesk-dashboard'; Write-Host 'Starting DueDesk Dashboard...' -ForegroundColor Green; npm start" -PassThru

# Wait a moment for everything to initialize
Start-Sleep -Seconds 5

Write-Host "`nDueDesk Application is starting up!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Health Check: http://localhost:4000/api/health" -ForegroundColor Cyan

Write-Host "`nApplication Info:" -ForegroundColor White
Write-Host "  Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "  Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
Write-Host "  Both servers are running in separate windows" -ForegroundColor Gray
Write-Host "  Close those windows to stop the servers" -ForegroundColor Gray

Write-Host "`nThe dashboard should automatically open in your browser shortly..." -ForegroundColor Green
Write-Host "Press any key to exit this launcher (servers will continue running)..." -ForegroundColor Yellow

# Wait for user input
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nLauncher closing. Your DueDesk application is still running!" -ForegroundColor Green
