@echo off
REM Uninstall script for Windows Kiosk Mode
REM Run this script as Administrator to remove kiosk configuration

echo ========================================
echo 3D Clue Board Kiosk - Uninstall
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    pause
    exit /b 1
)

echo [1/4] Removing auto-start...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
del "%STARTUP_FOLDER%\3D-Clue-Board-Kiosk.bat" >nul 2>&1
echo     Auto-start removed

echo.
echo [2/4] Restoring Windows settings...
REM Re-enable screen saver
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 1 /f >nul 2>&1

REM Restore default power settings
powercfg /change monitor-timeout-ac 10
powercfg /change standby-timeout-ac 30

echo     Windows settings restored

echo.
echo [3/4] Removing lockdown settings...
call "%~dp0disable-lockdown.bat"

echo.
echo [4/4] Removing desktop shortcut...
del "%USERPROFILE%\Desktop\3D Clue Board Kiosk.lnk" >nul 2>&1
echo     Desktop shortcut removed

echo.
echo ========================================
echo Uninstall Complete!
echo ========================================
echo.
echo The application files remain installed.
echo To completely remove the application, use Windows Settings > Apps
echo.
pause
