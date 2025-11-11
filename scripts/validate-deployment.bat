@echo off
REM MC Archive Lens - Deployment Validation Script for Windows
REM This script validates that the system is ready for production deployment

setlocal enabledelayedexpansion

set PASSED=0
set FAILED=0
set WARNINGS=0

echo ========================================
echo   MC Archive Lens Deployment Validator
echo ========================================
echo.

REM Test 1: Node.js version
echo [1/15] Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1 delims=." %%a in ('node --version') do set NODE_MAJOR=%%a
    set NODE_MAJOR=!NODE_MAJOR:v=!
    if !NODE_MAJOR! geq 18 (
        echo [PASS] Node.js version
        set /a PASSED+=1
    ) else (
        echo [FAIL] Node.js version - Requires Node.js 18 or higher
        set /a FAILED+=1
    )
) else (
    echo [FAIL] Node.js not found
    set /a FAILED+=1
)

REM Test 2: npm availability
echo [2/15] Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] npm installed
    set /a PASSED+=1
) else (
    echo [FAIL] npm not found
    set /a FAILED+=1
)

REM Test 3: Git availability
echo [3/15] Checking Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Git installed
    set /a PASSED+=1
) else (
    echo [WARN] Git not found (optional)
    set /a WARNINGS+=1
)

REM Test 4: Dependencies installed
echo [4/15] Checking dependencies...
if exist "node_modules\" (
    echo [PASS] Dependencies installed
    set /a PASSED+=1
) else (
    echo [FAIL] Dependencies not installed - Run 'npm install'
    set /a FAILED+=1
)

REM Test 5: Build directory
echo [5/15] Checking build...
if exist "dist\" (
    echo [PASS] Build directory exists
    set /a PASSED+=1
) else (
    echo [WARN] Build directory missing - Run 'npm run build'
    set /a WARNINGS+=1
)

REM Test 6: Required directories
echo [6/15] Checking directory structure...
set ALL_DIRS_EXIST=1
if not exist "data\" set ALL_DIRS_EXIST=0
if not exist "backups\" set ALL_DIRS_EXIST=0
if not exist "logs\" set ALL_DIRS_EXIST=0
if not exist "public\photos\" set ALL_DIRS_EXIST=0
if not exist "public\publications\" set ALL_DIRS_EXIST=0

if !ALL_DIRS_EXIST! equ 1 (
    echo [PASS] Required directories exist
    set /a PASSED+=1
) else (
    echo [WARN] Some directories missing (will be created during deployment)
    set /a WARNINGS+=1
)

REM Test 7: Database file
echo [7/15] Checking database...
if exist "data\kiosk.db" (
    echo [PASS] Database file exists
    set /a PASSED+=1
) else (
    echo [WARN] Database will be created during deployment
    set /a WARNINGS+=1
)

REM Test 8: Deployment scripts
echo [8/15] Checking deployment scripts...
if exist "scripts\deploy.bat" (
    echo [PASS] Deployment script (Windows)
    set /a PASSED+=1
) else (
    echo [FAIL] scripts\deploy.bat not found
    set /a FAILED+=1
)

if exist "scripts\deploy.sh" (
    echo [PASS] Deployment script (Linux/macOS)
    set /a PASSED+=1
) else (
    echo [WARN] scripts\deploy.sh not found
    set /a WARNINGS+=1
)

REM Test 9: Configuration files
echo [9/15] Checking configuration...
if exist "package.json" (
    echo [PASS] package.json exists
    set /a PASSED+=1
) else (
    echo [FAIL] package.json not found
    set /a FAILED+=1
)

if exist "tsconfig.json" (
    echo [PASS] tsconfig.json exists
    set /a PASSED+=1
) else (
    echo [WARN] tsconfig.json not found
    set /a WARNINGS+=1
)

REM Test 10: Spec completion
echo [10/15] Checking spec completion...
set ALL_SPECS_COMPLETE=1
if not exist ".kiro\specs\sqlite-fts5-search\SPEC_COMPLETE.md" set ALL_SPECS_COMPLETE=0
if not exist ".kiro\specs\3d-clue-board-kiosk\SPEC_COMPLETE.md" set ALL_SPECS_COMPLETE=0
if not exist ".kiro\specs\touchscreen-keyboard\KEYBOARD_COMPLETE.md" set ALL_SPECS_COMPLETE=0

if !ALL_SPECS_COMPLETE! equ 1 (
    echo [PASS] All specs completed
    set /a PASSED+=1
) else (
    echo [WARN] Some specs may not be complete
    set /a WARNINGS+=1
)

REM Test 11: Core components
echo [11/15] Checking core components...
set ALL_COMPONENTS_EXIST=1
if not exist "src\lib\database\manager.ts" set ALL_COMPONENTS_EXIST=0
if not exist "src\lib\database\search-manager.ts" set ALL_COMPONENTS_EXIST=0
if not exist "src\components\search\SearchInterface.tsx" set ALL_COMPONENTS_EXIST=0
if not exist "src\pages\HomePage.tsx" set ALL_COMPONENTS_EXIST=0

if !ALL_COMPONENTS_EXIST! equ 1 (
    echo [PASS] Core components exist
    set /a PASSED+=1
) else (
    echo [FAIL] Some core components missing
    set /a FAILED+=1
)

REM Test 12: Documentation
echo [12/15] Checking documentation...
set DOCS_EXIST=0
if exist "README.md" set /a DOCS_EXIST+=1
if exist "DEPLOYMENT_GUIDE.md" set /a DOCS_EXIST+=1
if exist "PRODUCTION_DEPLOYMENT_GUIDE.md" set /a DOCS_EXIST+=1

if !DOCS_EXIST! geq 2 (
    echo [PASS] Documentation files exist
    set /a PASSED+=1
) else (
    echo [WARN] Some documentation files missing
    set /a WARNINGS+=1
)

REM Test 13: Disk space
echo [13/15] Checking disk space...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set AVAILABLE_SPACE=%%a
set AVAILABLE_SPACE=!AVAILABLE_SPACE:,=!
set /a AVAILABLE_MB=!AVAILABLE_SPACE! / 1048576

if !AVAILABLE_MB! gtr 500 (
    echo [PASS] Disk space (!AVAILABLE_MB!MB available)
    set /a PASSED+=1
) else if !AVAILABLE_MB! gtr 200 (
    echo [WARN] Low disk space (!AVAILABLE_MB!MB available)
    set /a WARNINGS+=1
) else (
    echo [FAIL] Insufficient disk space (!AVAILABLE_MB!MB available)
    set /a FAILED+=1
)

REM Test 14: Memory
echo [14/15] Checking system memory...
for /f "skip=1" %%p in ('wmic os get freephysicalmemory') do (
    set AVAILABLE_MEM=%%p
    goto :memory_done
)
:memory_done
set /a AVAILABLE_MEM_MB=!AVAILABLE_MEM! / 1024

if !AVAILABLE_MEM_MB! gtr 500 (
    echo [PASS] Available memory (!AVAILABLE_MEM_MB!MB)
    set /a PASSED+=1
) else if !AVAILABLE_MEM_MB! gtr 200 (
    echo [WARN] Low memory (!AVAILABLE_MEM_MB!MB)
    set /a WARNINGS+=1
) else (
    echo [FAIL] Insufficient memory (!AVAILABLE_MEM_MB!MB)
    set /a FAILED+=1
)

REM Test 15: SQLite
echo [15/15] Checking SQLite...
where sqlite3 >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] SQLite available
    set /a PASSED+=1
) else (
    echo [WARN] sqlite3 not found (will use better-sqlite3 from npm)
    set /a WARNINGS+=1
)

REM Summary
echo.
echo ========================================
echo   Validation Summary
echo ========================================
echo.
echo Passed:   !PASSED!
echo Warnings: !WARNINGS!
echo Failed:   !FAILED!
echo.

REM Overall status
if !FAILED! equ 0 (
    if !WARNINGS! equ 0 (
        echo [SUCCESS] System is ready for production deployment!
        echo.
        echo Next steps:
        echo   1. Run: scripts\deploy.bat
        echo   2. Follow the deployment guide: PRODUCTION_DEPLOYMENT_GUIDE.md
        exit /b 0
    ) else (
        echo [WARNING] System is mostly ready, but has some warnings.
        echo.
        echo Review warnings above and address if needed.
        echo You can proceed with deployment, but some features may not work optimally.
        echo.
        echo To deploy anyway, run: scripts\deploy.bat
        exit /b 0
    )
) else (
    echo [FAILED] System is NOT ready for deployment.
    echo.
    echo Please fix the failed checks above before deploying.
    echo Refer to PRODUCTION_DEPLOYMENT_GUIDE.md for help.
    exit /b 1
)
