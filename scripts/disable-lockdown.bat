@echo off
REM Disable Windows lockdown for kiosk maintenance
REM Run this script as Administrator to restore normal Windows functionality

echo ========================================
echo 3D Clue Board Kiosk - Disable Lockdown
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    pause
    exit /b 1
)

echo Disabling lockdown mode...

REM Enable Task Manager
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /f >nul 2>&1

REM Enable Windows key
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoWinKeys /f >nul 2>&1

REM Enable Alt+Tab
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoWindowsHotKeys /f >nul 2>&1

REM Enable Ctrl+Alt+Del
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableCAD /f >nul 2>&1

echo.
echo Lockdown mode disabled successfully!
echo Normal Windows functionality restored.
echo.
pause
