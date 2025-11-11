@echo off
REM Script to install the kiosk as a Windows startup application
REM Run this script as Administrator

echo Installing 3D Clue Board Kiosk to Windows Startup...

REM Get the startup folder path
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Copy the startup script to the startup folder
copy "%~dp0windows-startup.bat" "%STARTUP_FOLDER%\3D-Clue-Board-Kiosk-Startup.bat"

if %ERRORLEVEL% EQU 0 (
    echo Successfully installed to startup folder
    echo The kiosk will now start automatically when Windows boots
) else (
    echo Failed to install to startup folder
    echo Please run this script as Administrator
)

pause
