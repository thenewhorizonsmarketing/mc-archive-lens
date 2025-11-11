@echo off
REM Installation script for Windows Kiosk Mode
REM Run this script as Administrator after installing the application

echo ========================================
echo 3D Clue Board Kiosk - Kiosk Mode Setup
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Setting up auto-start...
REM Copy startup script to Startup folder
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy "%~dp0windows-startup.bat" "%STARTUP_FOLDER%\3D-Clue-Board-Kiosk.bat"
if %errorLevel% equ 0 (
    echo     Auto-start configured successfully
) else (
    echo     WARNING: Failed to configure auto-start
)

echo.
echo [2/5] Configuring Windows settings for kiosk mode...
REM Disable screen saver
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f >nul 2>&1

REM Disable sleep mode
powercfg /change monitor-timeout-ac 0
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0

echo     Power settings configured

echo.
echo [3/5] Configuring display settings...
REM Set display to never turn off
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0

echo     Display settings configured

echo.
echo [4/5] Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
set TARGET=%LOCALAPPDATA%\Programs\3d-clue-board-kiosk\3D Clue Board Kiosk.exe
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%DESKTOP%\3D Clue Board Kiosk.lnk');$s.TargetPath='%TARGET%';$s.Arguments='--kiosk';$s.Save()"

echo     Desktop shortcut created

echo.
echo [5/5] Creating logs directory...
if not exist "%LOCALAPPDATA%\Programs\3d-clue-board-kiosk\logs" (
    mkdir "%LOCALAPPDATA%\Programs\3d-clue-board-kiosk\logs"
)
echo     Logs directory created

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo The kiosk will automatically start when Windows boots.
echo.
echo OPTIONAL SECURITY SETTINGS:
echo To disable Task Manager and Windows key, run:
echo   scripts\enable-lockdown.bat
echo.
echo To test the kiosk now, run:
echo   "%TARGET%" --kiosk
echo.
pause
