# Command Line Execution Guide

This document provides platform-agnostic command line instructions for the Eventide project, with specific syntax for different shells and operating systems.

## Usage Pattern

Reference this guide when executing commands:
```
@command-line-guide.md -[platform] "command description"
```

---

## 🖥️ Platform Detection & Shell Selection

### Identify Your Environment

**Windows:**
- **PowerShell** (Recommended): `pwsh` or `powershell`
- **Command Prompt**: `cmd`
- **Git Bash**: Unix-like syntax on Windows
- **WSL**: Linux subsystem on Windows

**macOS/Linux:**
- **Bash**: Default on most systems
- **Zsh**: Default on newer macOS
- **Fish**: Alternative shell

**Verify Your Shell:**
```bash
# Universal check
echo $0        # Unix-like shells
$PSVersionTable # PowerShell
```

---

## 🔧 Command Syntax Guide

### Path Handling

**PowerShell:**
```powershell
# Use quotes for paths with spaces
cd "C:\Users\username\OneDrive\Desktop\PRO\Eventide"
cd ".\frontend"
cd "..\backend"

# Path separators
Set-Location "C:\Path\To\Directory"
```

**Unix-like (Bash/Zsh/macOS):**
```bash
# Forward slashes, quotes for spaces
cd "/Users/username/Desktop/PRO/Eventide"
cd "./frontend"  
cd "../backend"
```

**Command Prompt (Windows):**
```cmd
cd "C:\Users\username\OneDrive\Desktop\PRO\Eventide"
cd frontend
cd ..\backend
```

### Command Chaining

**PowerShell:**
```powershell
# Use semicolon for command separation
cd ".\backend"; npm install; npm run build

# Use && for conditional execution (PowerShell 7+)
npm test && npm run build

# Use -and for older PowerShell
if (npm test) { npm run build }
```

**Unix-like (Bash/Zsh):**
```bash
# Use && for conditional execution
cd ./backend && npm install && npm run build

# Use ; for sequential execution
cd ./backend; npm install; npm run build

# Use || for fallback
npm test || echo "Tests failed"
```

**Command Prompt:**
```cmd
cd backend && npm install && npm run build
```

### Environment Variables

**PowerShell:**
```powershell
# Set environment variable
$env:NODE_ENV = "development"
$env:PORT = "3000"

# Use in command
npx cross-env PORT=3001 npm run start:dev
```

**Unix-like:**
```bash
# Set environment variable
export NODE_ENV=development
export PORT=3000

# Use in command
PORT=3001 npm run start:dev
```

---

## 📋 Eventide Project Commands

### Navigation Commands

**PowerShell:**
```powershell
# Navigate to project root
cd "C:\Users\shuga\OneDrive\Desktop\PRO\Eventide"

# Navigate to backend
cd ".\backend"

# Navigate to frontend  
cd ".\frontend"

# Return to project root
cd ".."
```

**Unix-like:**
```bash
# Navigate to project root
cd "/path/to/PRO/Eventide"

# Navigate to backend
cd ./backend

# Navigate to frontend
cd ./frontend

# Return to project root
cd ..
```

### Installation Commands

**PowerShell:**
```powershell
# Backend setup
cd ".\backend"; npm install

# Frontend setup
cd ".\frontend"; npm install

# Both in sequence
cd ".\backend"; npm install; cd "..\frontend"; npm install
```

**Unix-like:**
```bash
# Backend setup
cd ./backend && npm install

# Frontend setup  
cd ./frontend && npm install

# Both in sequence
cd ./backend && npm install && cd ../frontend && npm install
```

### Development Commands

**PowerShell:**
```powershell
# Start backend development server
cd ".\backend"; npx cross-env PORT=3000 npm run start:dev

# Start frontend development server
cd ".\frontend"; npm start

# Run both (use separate terminals)
# Terminal 1:
cd ".\backend"; npm run start:dev

# Terminal 2:  
cd ".\frontend"; npm start
```

**Unix-like:**
```bash
# Start backend development server
cd ./backend && PORT=3000 npm run start:dev

# Start frontend development server
cd ./frontend && npm start

# Run both in background (Linux/macOS)
cd ./backend && npm run start:dev &
cd ./frontend && npm start &
```

### Testing Commands

**PowerShell:**
```powershell
# Run backend tests
cd ".\backend"; npm test

# Run frontend tests
cd ".\frontend"; npm test

# Run tests with coverage
cd ".\backend"; npm run test:cov; cd "..\frontend"; npm run test:cov
```

**Unix-like:**
```bash
# Run backend tests
cd ./backend && npm test

# Run frontend tests
cd ./frontend && npm test

# Run tests with coverage
cd ./backend && npm run test:cov && cd ../frontend && npm run test:cov
```

### Build Commands

**PowerShell:**
```powershell
# Build backend
cd ".\backend"; npm run build

# Build frontend
cd ".\frontend"; npm run build

# Build both
cd ".\backend"; npm run build; cd "..\frontend"; npm run build
```

**Unix-like:**
```bash
# Build backend
cd ./backend && npm run build

# Build frontend  
cd ./frontend && npm run build

# Build both
cd ./backend && npm run build && cd ../frontend && npm run build
```

---

## 🚀 Advanced Command Patterns

### Parallel Execution

**PowerShell:**
```powershell
# Using Start-Job for parallel execution
Start-Job -ScriptBlock { cd ".\backend"; npm test }
Start-Job -ScriptBlock { cd ".\frontend"; npm test }

# Wait for jobs to complete
Get-Job | Wait-Job
Get-Job | Receive-Job
```

**Unix-like with GNU Parallel:**
```bash
# Install parallel first: apt-get install parallel
parallel ::: "cd ./backend && npm test" "cd ./frontend && npm test"

# Using background processes
(cd ./backend && npm test) & (cd ./frontend && npm test) & wait
```

### Conditional Execution

**PowerShell:**
```powershell
# If-then execution
if (Test-Path ".\backend\package.json") {
    cd ".\backend"; npm install
}

# Try-catch for error handling
try {
    cd ".\backend"; npm test
} catch {
    Write-Host "Backend tests failed"
}
```

**Unix-like:**
```bash
# Conditional execution
[ -f ./backend/package.json ] && cd ./backend && npm install

# Error handling
if ! cd ./backend && npm test; then
    echo "Backend tests failed"
fi
```

### Environment Setup

**PowerShell:**
```powershell
# Set multiple environment variables
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:MONGO_URI = "mongodb://localhost:27017/eventide"

# Load from .env file (requires dotenv-cli)
npx dotenv -e ".env.development" npm run start:dev
```

**Unix-like:**
```bash
# Set multiple environment variables
export NODE_ENV=development
export PORT=3000
export MONGO_URI=mongodb://localhost:27017/eventide

# Load from .env file
source .env.development && npm run start:dev
```

---

## 🛠️ Shell-Specific Features

### PowerShell Advantages

```powershell
# Object-oriented commands
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Rich error information
$Error[0] | Format-List *

# Tab completion for paths
cd "C:\Users\[TAB]"

# Execution policies
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Unix-like Advantages

```bash
# Powerful pipe operations
ps aux | grep node | awk '{print $2}' | xargs kill

# History expansion
!npm  # Repeat last npm command
!!    # Repeat last command

# Process substitution
diff <(cd ./backend && npm list) <(cd ./frontend && npm list)
```

---

## 📚 Common Command Patterns

### Quick Setup (Any Shell)

**PowerShell:**
```powershell
# Complete project setup
cd "C:\Users\shuga\OneDrive\Desktop\PRO\Eventide"; 
cd ".\backend"; npm install; 
cd "..\frontend"; npm install;
cd ".."
```

**Unix-like:**
```bash
# Complete project setup  
cd ~/Desktop/PRO/Eventide && 
cd ./backend && npm install && 
cd ../frontend && npm install && 
cd ..
```

### Testing Workflow

**PowerShell:**
```powershell
# Full testing workflow
cd ".\backend"; npm run lint; npm test; 
cd "..\frontend"; npm run lint; npm test
```

**Unix-like:**
```bash
# Full testing workflow
cd ./backend && npm run lint && npm test && 
cd ../frontend && npm run lint && npm test
```

### Deployment Preparation

**PowerShell:**
```powershell
# Prepare for deployment
cd ".\backend"; npm run build; npm run test:e2e;
cd "..\frontend"; npm run build; npm run test
```

**Unix-like:**
```bash
# Prepare for deployment
cd ./backend && npm run build && npm run test:e2e &&
cd ../frontend && npm run build && npm run test
```

---

## 🚨 Platform-Specific Troubleshooting

### PowerShell Issues

```powershell
# Execution policy issues
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Path length issues
# Use shorter paths or enable long path support
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Node/npm not found
# Add to PATH or use full paths
& "C:\Program Files\nodejs\npm.cmd" install
```

### Unix-like Issues

```bash
# Permission issues
sudo chown -R $USER:$USER ~/.npm
chmod +x node_modules/.bin/*

# Node version issues  
nvm use node
nvm install --lts

# Path issues
which node
export PATH=$PATH:/usr/local/bin
```

### Cross-Platform Solutions

```bash
# Use cross-env for environment variables
npx cross-env NODE_ENV=development npm start

# Use cross-platform paths
npx cross-var "echo $npm_package_name"

# Platform detection
node -p "process.platform"
```

---

## 📖 Quick Reference

### Essential Commands by Platform

**PowerShell Users:**
```powershell
cd "C:\Users\shuga\OneDrive\Desktop\PRO\Eventide"
cd ".\backend"; npm install; npm run start:dev
# New terminal: 
cd ".\frontend"; npm start
```

**Unix-like Users:**
```bash
cd ~/Desktop/PRO/Eventide  # or your path
cd ./backend && npm install && npm run start:dev
# New terminal:
cd ./frontend && npm start
```

**Command Prompt Users:**
```cmd
cd "C:\Users\shuga\OneDrive\Desktop\PRO\Eventide"
cd backend && npm install && npm run start:dev
```

This guide ensures consistent command execution across all platforms while respecting shell-specific syntax and best practices.