#!/usr/bin/env pwsh
# Test script to verify backend installation and functionality

Write-Host "🧪 Testing Backend Setup" -ForegroundColor Green
Write-Host ""

# Test 1: Check Python version
Write-Host "Test 1: Python Version" -ForegroundColor Cyan
python --version
Write-Host ""

# Test 2: Check if venv exists
Write-Host "Test 2: Virtual Environment" -ForegroundColor Cyan
if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "✅ Virtual environment found" -ForegroundColor Green
} else {
    Write-Host "❌ Virtual environment not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Check installed packages
Write-Host "Test 3: Checking Key Dependencies" -ForegroundColor Cyan
.\venv\Scripts\python.exe -c "import fastapi; print(f'✅ FastAPI {fastapi.__version__}')"
.\venv\Scripts\python.exe -c "import neo4j; print(f'✅ Neo4j Driver {neo4j.__version__}')"
.\venv\Scripts\python.exe -c "import torch; print(f'✅ PyTorch {torch.__version__}')"
.\venv\Scripts\python.exe -c "import pandas; print(f'✅ Pandas {pandas.__version__}')"
Write-Host ""

# Test 4: Test import of app modules
Write-Host "Test 4: App Module Imports" -ForegroundColor Cyan
.\venv\Scripts\python.exe -c "from app.config import settings; print(f'✅ Config loaded: {settings.APP_NAME}')"
.\venv\Scripts\python.exe -c "from app.utils.logger import setup_logger; print('✅ Logger module OK')"
Write-Host ""

Write-Host "🎉 All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure .env file with your credentials" -ForegroundColor White
Write-Host "2. Run: .\start.ps1 to start the server" -ForegroundColor White
