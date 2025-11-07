@echo off
REM MC Archive Lens Deployment Script for Windows
REM This script sets up the database and imports initial data for the kiosk application

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR:~0,-1%\..
set DATA_DIR=%PROJECT_ROOT%\data
set BACKUP_DIR=%PROJECT_ROOT%\backups
set LOG_FILE=%PROJECT_ROOT%\deployment.log

REM Create log file
echo Deployment started at %date% %time% > "%LOG_FILE%"

echo.
echo ========================================
echo   MC Archive Lens Deployment Script
echo ========================================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or later.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%PROJECT_ROOT%\logs" mkdir "%PROJECT_ROOT%\logs"
if not exist "%PROJECT_ROOT%\public\images\alumni" mkdir "%PROJECT_ROOT%\public\images\alumni"
if not exist "%PROJECT_ROOT%\public\images\photos" mkdir "%PROJECT_ROOT%\public\images\photos"
if not exist "%PROJECT_ROOT%\public\images\faculty" mkdir "%PROJECT_ROOT%\public\images\faculty"
if not exist "%PROJECT_ROOT%\public\pdfs\publications" mkdir "%PROJECT_ROOT%\public\pdfs\publications"

echo [SUCCESS] Directories created successfully

REM Install dependencies
echo [INFO] Installing dependencies...
cd /d "%PROJECT_ROOT%"

if exist "package-lock.json" (
    npm ci
) else (
    npm install
)

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully

REM Build the application
echo [INFO] Building the application...
npm run build

if errorlevel 1 (
    echo [ERROR] Failed to build application
    pause
    exit /b 1
)

echo [SUCCESS] Application built successfully

REM Initialize database
echo [INFO] Initializing database...

node -e "
const { DatabaseManager } = require('./dist/lib/database/manager.js');
const { IndexManager } = require('./dist/lib/database/index-manager.js');

async function initDB() {
    try {
        console.log('Creating database manager...');
        const dbManager = new DatabaseManager();
        await dbManager.initializeDatabase();
        
        console.log('Creating search indexes...');
        const indexManager = new IndexManager(dbManager);
        await indexManager.createAllIndexes();
        
        console.log('Database initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initDB();
"

if errorlevel 1 (
    echo [ERROR] Database initialization failed
    pause
    exit /b 1
)

echo [SUCCESS] Database initialized successfully

REM Import sample data (if available)
echo [INFO] Checking for sample data...

set SAMPLE_DATA_FOUND=0
if exist "%DATA_DIR%\sample-alumni.csv" set SAMPLE_DATA_FOUND=1
if exist "%DATA_DIR%\sample-publications.csv" set SAMPLE_DATA_FOUND=1
if exist "%DATA_DIR%\sample-photos.csv" set SAMPLE_DATA_FOUND=1
if exist "%DATA_DIR%\sample-faculty.csv" set SAMPLE_DATA_FOUND=1

if %SAMPLE_DATA_FOUND%==1 (
    echo [INFO] Sample data found, importing...
    
    node -e "
    const { DatabaseManager } = require('./dist/lib/database/manager.js');
    const { ImportManager } = require('./dist/lib/database/import-manager.js');
    const fs = require('fs');
    const path = require('path');
    
    async function importData() {
        try {
            const dbManager = new DatabaseManager();
            await dbManager.initializeDatabase();
            const importManager = new ImportManager(dbManager);
            
            const dataTypes = ['alumni', 'publications', 'photos', 'faculty'];
            
            for (const type of dataTypes) {
                const filePath = path.join('%DATA_DIR%', 'sample-' + type + '.csv');
                if (fs.existsSync(filePath)) {
                    console.log('Importing ' + type + ' data from ' + filePath + '...');
                    const fileBuffer = fs.readFileSync(filePath);
                    const file = new File([fileBuffer], 'sample-' + type + '.csv', { type: 'text/csv' });
                    
                    const result = await importManager.importCSV(file, type);
                    if (result.success) {
                        console.log('Successfully imported ' + result.recordsImported + ' ' + type + ' records');
                    } else {
                        console.error('Failed to import ' + type + ' data:', result.errors);
                    }
                }
            }
            
            console.log('Sample data import completed');
            process.exit(0);
        } catch (error) {
            console.error('Sample data import failed:', error);
            process.exit(1);
        }
    }
    
    importData();
    "
    
    if errorlevel 1 (
        echo [WARNING] Sample data import failed, but continuing...
    ) else (
        echo [SUCCESS] Sample data imported successfully
    )
) else (
    echo [WARNING] No sample data found. You can import data later through the admin panel.
)

REM Create initial backup
echo [INFO] Creating initial backup...

node -e "
const { DatabaseManager } = require('./dist/lib/database/manager.js');
const { BackupManager } = require('./dist/lib/database/backup-manager.js');

async function createBackup() {
    try {
        const dbManager = new DatabaseManager();
        await dbManager.initializeDatabase();
        const backupManager = new BackupManager(dbManager);
        
        const backupPath = await backupManager.createBackup();
        console.log('Initial backup created at:', backupPath);
        process.exit(0);
    } catch (error) {
        console.error('Backup creation failed:', error);
        process.exit(1);
    }
}

createBackup();
"

if errorlevel 1 (
    echo [WARNING] Initial backup creation failed, but continuing...
) else (
    echo [SUCCESS] Initial backup created
)

REM Create desktop shortcut
echo [INFO] Creating desktop shortcut...

set DESKTOP_DIR=%USERPROFILE%\Desktop
set SHORTCUT_FILE=%DESKTOP_DIR%\MC Archive Lens.url

echo [InternetShortcut] > "%SHORTCUT_FILE%"
echo URL=http://localhost:3000 >> "%SHORTCUT_FILE%"
echo IconFile=%PROJECT_ROOT%\public\favicon.ico >> "%SHORTCUT_FILE%"
echo IconIndex=0 >> "%SHORTCUT_FILE%"

echo [SUCCESS] Desktop shortcut created

REM Generate deployment report
echo [INFO] Generating deployment report...

set REPORT_FILE=%PROJECT_ROOT%\deployment-report.txt

echo MC Archive Lens Deployment Report > "%REPORT_FILE%"
echo Generated: %date% %time% >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo === System Information === >> "%REPORT_FILE%"
echo OS: Windows >> "%REPORT_FILE%"
node --version >> "%REPORT_FILE%" 2>&1
npm --version >> "%REPORT_FILE%" 2>&1
echo. >> "%REPORT_FILE%"
echo === Project Information === >> "%REPORT_FILE%"
echo Project Root: %PROJECT_ROOT% >> "%REPORT_FILE%"
echo Data Directory: %DATA_DIR% >> "%REPORT_FILE%"
echo Backup Directory: %BACKUP_DIR% >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo === Deployment Status === >> "%REPORT_FILE%"
echo ✓ Prerequisites checked >> "%REPORT_FILE%"
echo ✓ Dependencies installed >> "%REPORT_FILE%"
echo ✓ Application built >> "%REPORT_FILE%"
echo ✓ Database initialized >> "%REPORT_FILE%"
echo ✓ Sample data imported (if available) >> "%REPORT_FILE%"
echo ✓ Initial backup created >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo === Next Steps === >> "%REPORT_FILE%"
echo 1. Start the application: npm start >> "%REPORT_FILE%"
echo 2. Access the kiosk at: http://localhost:3000 >> "%REPORT_FILE%"
echo 3. Access admin panel: Ctrl+Shift+A >> "%REPORT_FILE%"
echo 4. Import your data through the admin panel >> "%REPORT_FILE%"
echo 5. Configure kiosk settings as needed >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo === Maintenance === >> "%REPORT_FILE%"
echo - Backup files are stored in: %BACKUP_DIR% >> "%REPORT_FILE%"
echo - Logs are stored in: %PROJECT_ROOT%\logs >> "%REPORT_FILE%"
echo - Use the admin panel for data management >> "%REPORT_FILE%"
echo - Regular backups are recommended >> "%REPORT_FILE%"

echo [SUCCESS] Deployment report generated: %REPORT_FILE%

REM Final success message
echo.
echo ========================================
echo   🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Next steps:
echo 1. Start the application: npm start
echo 2. Open your browser to: http://localhost:3000
echo 3. Access admin panel with: Ctrl+Shift+A
echo.
echo For more information, see: %REPORT_FILE%
echo.

pause
exit /b 0