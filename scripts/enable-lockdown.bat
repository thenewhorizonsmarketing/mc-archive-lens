@echo off
REM Enable Windows lockdown for kiosk security
REM Run this script as Administrator to enable strict kiosk mode

echo ========================================
echo 3D Clue Board Kiosk - Enable Lockdown
echo ========================================
echo.
echo WARNING: This will disable Task Manager and other Windows features
echo Press Ctrl+C to cancel, or
pause

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    pause
    exit /b 1
)

echo.
echo Enabling lockdown mode...

REM Disable Task Manager
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f

REM Disable Windows key
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoWinKeys /t REG_DWORD /d 1 /f

REM Disable Alt+Tab
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoWindowsHotKeys /t REG_DWORD /d 1 /f

REM Disable Ctrl+Alt+Del
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableCAD /t REG_DWORD /d 1 /f

echo.
echo Lockdown mode enabled successfully!
echo.
echo To disable lockdown mode, run: scripts\disable-lockdown.bat
echo.
pause
