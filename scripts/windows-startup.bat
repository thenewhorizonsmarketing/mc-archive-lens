@echo off
REM Windows Startup Script for 3D Clue Board Kiosk
REM This script launches the kiosk application in full-screen mode
REM Location: C:\Users\[Username]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup

REM Set environment variables for kiosk mode
set KIOSK_MODE=true
set NODE_ENV=production

REM Wait for system to fully boot (5 seconds)
timeout /t 5 /nobreak >nul

REM Navigate to the application directory
cd /d "%LOCALAPPDATA%\Programs\3d-clue-board-kiosk"

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Start the Electron application in kiosk mode
start "" "3D Clue Board Kiosk.exe" --kiosk

REM Log startup
echo Kiosk started at %date% %time% >> "logs\startup.log"

REM Optional: Disable Windows key (uncomment if needed)
REM reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableLockWorkstation /t REG_DWORD /d 1 /f

exit
