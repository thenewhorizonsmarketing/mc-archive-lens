# Kiosk Setup Guide

## Quick Start for Kiosk Deployment

This guide provides step-by-step instructions for setting up the 3D Clue Board Kiosk in a museum or public environment.

---

## Prerequisites

- Windows 10 Pro (64-bit) installed and updated
- 55" 4K touchscreen display connected and working
- Administrator access to Windows
- Application installer file

---

## Step-by-Step Setup

### Step 1: Prepare Windows

1. **Create Kiosk User Account**
   ```
   Settings > Accounts > Family & other users > Add someone else to this PC
   Username: KioskUser
   Password: [Set secure password]
   Account type: Standard user
   ```

2. **Configure Display Settings**
   - Right-click desktop > Display settings
   - Set resolution to 3840x2160 (4K)
   - Set scaling to 100%
   - Set orientation to Landscape
   - Make this the primary display

3. **Update Graphics Drivers**
   - Open Device Manager
   - Expand "Display adapters"
   - Right-click GPU > Update driver
   - Search automatically for drivers

### Step 2: Install Application

1. **Run Installer as Administrator**
   - Right-click `3D Clue Board Kiosk-Setup-1.0.0.exe`
   - Select "Run as administrator"
   - Follow installation wizard
   - Accept all defaults

2. **Verify Installation**
   - Check installation directory exists:
     ```
     C:\Program Files\3D Clue Board Kiosk
     ```
   - Verify desktop shortcut created

### Step 3: Configure Kiosk Mode

1. **Run Kiosk Setup Script**
   - Open Command Prompt as Administrator
   - Navigate to installation directory:
     ```batch
     cd "C:\Program Files\3D Clue Board Kiosk"
     ```
   - Run setup script:
     ```batch
     scripts\install-kiosk-mode.bat
     ```
   - Wait for completion

2. **Verify Auto-Start**
   - Check startup folder:
     ```
     %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
     ```
   - Verify `3D-Clue-Board-Kiosk.bat` exists

### Step 4: Configure Application

1. **Edit Configuration File**
   - Open: `C:\Program Files\3D Clue Board Kiosk\public\config\config.json`
   - Set admin PIN (change from default):
     ```json
     {
       "admin": {
         "pin": "YOUR_SECURE_PIN"
       }
     }
     ```

2. **Configure Room Definitions**
   - Edit: `public\config\rooms.json`
   - Customize room titles and descriptions
   - Verify all 8 rooms are defined

3. **Set Idle Timers**
   - In `config.json`:
     ```json
     {
       "idle": {
         "attractTimeout": 45000,
         "resetTimeout": 120000
       }
     }
     ```

### Step 5: Test Installation

1. **Manual Launch Test**
   - Double-click desktop shortcut
   - Verify application launches in fullscreen
   - Check for errors

2. **Touch Test**
   - Tap each room tile
   - Verify touch response
   - Test two-finger tap (back gesture)

3. **Admin Access Test**
   - Tap and hold upper-left corner for 3 seconds
   - Enter PIN
   - Verify admin overlay opens

4. **Idle Test**
   - Leave kiosk idle for 45 seconds
   - Verify attract loop starts
   - Leave idle for 120 seconds
   - Verify auto-reset to home

### Step 6: Enable Security (Optional)

For public deployment, enable lockdown mode:

1. **Run Lockdown Script**
   ```batch
   cd "C:\Program Files\3D Clue Board Kiosk"
   scripts\enable-lockdown.bat
   ```

2. **Test Lockdown**
   - Try pressing Windows key (should be disabled)
   - Try Ctrl+Alt+Del (should be disabled)
   - Try Alt+Tab (should be disabled)

3. **Document Exit Method**
   - To exit for maintenance:
     ```batch
     scripts\disable-lockdown.bat
     ```

### Step 7: Configure Auto-Login (Optional)

For unattended operation:

1. **Enable Auto-Login**
   - Press Win+R
   - Type: `netplwiz`
   - Uncheck "Users must enter a username and password"
   - Select KioskUser
   - Click OK
   - Enter password twice

2. **Test Auto-Login**
   - Restart computer
   - Verify automatic login
   - Verify application auto-starts

### Step 8: Final Testing

1. **Reboot Test**
   - Restart Windows
   - Time boot to application ready
   - Target: ≤ 5 seconds after login

2. **Performance Test**
   - Open admin overlay
   - Check FPS (should be ≥ 55)
   - Check draw calls (should be ≤ 120)

3. **24-Hour Soak Test**
   - Leave running for 24 hours
   - Monitor memory usage
   - Check for crashes or errors

---

## Daily Operation

### Starting the Kiosk

**Automatic** (if auto-login enabled):
- Turn on computer
- Application starts automatically

**Manual**:
- Log in to Windows
- Application starts automatically
- Or double-click desktop shortcut

### Stopping the Kiosk

**From Admin Overlay**:
1. Open admin overlay (3-second hold in upper-left)
2. Enter PIN
3. Click "Exit Application"

**Emergency Exit**:
1. If lockdown disabled: Alt+F4
2. If lockdown enabled: Ctrl+Shift+Q (if configured)

### Restarting the Kiosk

**From Admin Overlay**:
1. Open admin overlay
2. Click "Restart Application"

**Manual**:
1. Exit application
2. Double-click desktop shortcut

---

## Maintenance Mode

### Entering Maintenance Mode

1. **Disable Lockdown** (if enabled)
   ```batch
   cd "C:\Program Files\3D Clue Board Kiosk"
   scripts\disable-lockdown.bat
   ```

2. **Exit Application**
   - Use admin overlay
   - Or Alt+F4

3. **Perform Maintenance**
   - Update content
   - Check logs
   - Update configuration

4. **Re-enable Lockdown**
   ```batch
   scripts\enable-lockdown.bat
   ```

5. **Restart Application**

### Updating Content

1. **Backup Current Configuration**
   ```batch
   xcopy "C:\Program Files\3D Clue Board Kiosk\public\config" "C:\Backup\config" /E /I
   ```

2. **Update Files**
   - Replace assets in `public\assets`
   - Update `rooms.json` if needed
   - Update `config.json` if needed

3. **Test Changes**
   - Launch application
   - Verify all content loads
   - Test navigation

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Won't start on boot | Re-run `install-kiosk-mode.bat` |
| Touch not working | Calibrate touchscreen in Windows Settings |
| Low FPS | Update graphics drivers, check motion tier |
| Can't access admin | Verify PIN in config.json, try default: 1234 |
| Black screen | Check WebGL support, update graphics drivers |
| Memory leak | Restart application, schedule daily restart |

---

## Emergency Procedures

### Application Crash

1. Check logs: `C:\Program Files\3D Clue Board Kiosk\logs\error.log`
2. Restart application from desktop shortcut
3. If persistent, restart Windows

### System Freeze

1. If lockdown enabled, use power button (hold 5 seconds)
2. Restart Windows
3. Check Event Viewer for errors

### Lost Admin PIN

1. Exit application
2. Edit `public\config\config.json`
3. Change PIN to known value
4. Restart application

### Locked Out (Lockdown Mode)

1. Restart Windows in Safe Mode
2. Run `scripts\disable-lockdown.bat`
3. Restart normally

---

## Contact Information

**Technical Support**: [Your contact info]  
**Emergency Contact**: [Emergency contact]  
**Documentation**: See `docs\DEPLOYMENT.md` for detailed information

---

## Checklist

Use this checklist for new installations:

- [ ] Windows 10 Pro installed and updated
- [ ] Display configured (4K, 100% scaling)
- [ ] Graphics drivers updated
- [ ] Application installed
- [ ] Kiosk mode configured (`install-kiosk-mode.bat`)
- [ ] Admin PIN changed from default
- [ ] Room configuration customized
- [ ] Touch calibrated and tested
- [ ] Auto-start verified
- [ ] Performance tested (FPS ≥ 55)
- [ ] Idle behavior tested (45s attract, 120s reset)
- [ ] Admin overlay access tested
- [ ] Lockdown enabled (if required)
- [ ] Auto-login configured (if required)
- [ ] 24-hour soak test completed
- [ ] Documentation provided to staff
- [ ] Emergency procedures documented

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025
