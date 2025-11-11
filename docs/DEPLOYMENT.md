# 3D Clue Board Kiosk - Deployment Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Building the Application](#building-the-application)
4. [Installation](#installation)
5. [Kiosk Mode Configuration](#kiosk-mode-configuration)
6. [Post-Installation Testing](#post-installation-testing)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## System Requirements

### Minimum Hardware Requirements

- **Operating System**: Windows 10 (64-bit) or Windows 11
- **Processor**: Intel Core i5 or AMD Ryzen 5 (4 cores)
- **RAM**: 8 GB
- **Graphics**: Dedicated GPU with WebGL 2.0 support
  - NVIDIA GTX 1050 or equivalent
  - AMD Radeon RX 560 or equivalent
- **Storage**: 2 GB free space
- **Display**: 1920x1080 minimum (4K recommended for kiosk deployment)
- **Input**: Touchscreen display (55" 4K recommended)

### Recommended Hardware (Kiosk Deployment)

- **Operating System**: Windows 10 Pro (64-bit)
- **Processor**: Intel Core i7 or AMD Ryzen 7 (6+ cores)
- **RAM**: 16 GB
- **Graphics**: NVIDIA GTX 1660 or AMD Radeon RX 5600 XT
- **Storage**: 5 GB free space (SSD recommended)
- **Display**: 55" 4K touchscreen (3840x2160)

### Software Requirements

- Windows 10/11 with latest updates
- .NET Framework 4.7.2 or higher
- Visual C++ Redistributable 2015-2022
- WebGL 2.0 compatible graphics drivers

---

## Pre-Installation Checklist

Before installing the kiosk application, complete the following:

### 1. Hardware Setup

- [ ] Install and test touchscreen display
- [ ] Verify touchscreen calibration
- [ ] Update graphics drivers to latest version
- [ ] Configure display as primary monitor
- [ ] Set display resolution to native (4K: 3840x2160)
- [ ] Disable display scaling (set to 100%)

### 2. Windows Configuration

- [ ] Install all Windows updates
- [ ] Create dedicated kiosk user account (recommended)
- [ ] Disable Windows automatic updates during kiosk hours
- [ ] Configure power settings to prevent sleep
- [ ] Disable screen saver
- [ ] Set time zone correctly

### 3. Network Configuration

- [ ] Verify internet connection (for initial setup only)
- [ ] Note: Application runs 100% offline after installation

### 4. Asset Preparation

- [ ] Optimize all 3D assets (textures, models)
- [ ] Validate asset sizes against budgets
- [ ] Prepare room configuration files
- [ ] Test assets on target hardware

---

## Building the Application

### Development Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run with Electron
npm run dev:electron
```

### Production Build

```bash
# Optimize assets first
npm run optimize:assets

# Validate asset sizes
npm run validate:assets

# Build production version
npm run build:production

# Package for Windows
npm run package:win

# Create portable version (no installer)
npm run package:win:portable
```

### Build Output

After successful build, find installers in the `release` directory:

- `3D Clue Board Kiosk-Setup-1.0.0.exe` - Full installer with NSIS
- `3D Clue Board Kiosk-Portable-1.0.0.exe` - Portable version (no installation)

---

## Installation

### Method 1: Full Installer (Recommended)

1. **Run the installer as Administrator**
   ```
   Right-click "3D Clue Board Kiosk-Setup-1.0.0.exe"
   Select "Run as administrator"
   ```

2. **Follow installation wizard**
   - Accept license agreement
   - Choose installation directory (default: `C:\Program Files\3D Clue Board Kiosk`)
   - Select components (all recommended)
   - Create desktop shortcut (optional)

3. **Complete installation**
   - Click "Install"
   - Wait for installation to complete
   - Do NOT run application yet

### Method 2: Portable Version

1. **Extract portable executable**
   - Run `3D Clue Board Kiosk-Portable-1.0.0.exe`
   - Choose extraction directory
   - Application runs without installation

2. **Manual setup required**
   - Copy to desired location
   - Run `scripts\install-kiosk-mode.bat` as Administrator

---

## Kiosk Mode Configuration

### Automatic Configuration (Recommended)

1. **Run kiosk setup script as Administrator**
   ```batch
   cd "C:\Program Files\3D Clue Board Kiosk"
   scripts\install-kiosk-mode.bat
   ```

2. **Script performs the following:**
   - Configures auto-start on Windows boot
   - Disables screen saver and sleep mode
   - Sets display to never turn off
   - Creates desktop shortcut
   - Creates logs directory

### Manual Configuration

If automatic configuration fails, follow these steps:

#### 1. Configure Auto-Start

Copy startup script to Windows Startup folder:
```batch
copy "C:\Program Files\3D Clue Board Kiosk\scripts\windows-startup.bat" ^
     "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\3D-Clue-Board-Kiosk.bat"
```

#### 2. Disable Screen Saver

```batch
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f
```

#### 3. Configure Power Settings

```batch
powercfg /change monitor-timeout-ac 0
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

#### 4. Configure Application Settings

Edit `public/config/config.json`:

```json
{
  "kiosk": {
    "fullscreen": true,
    "frameless": true,
    "autoStart": true
  },
  "idle": {
    "attractTimeout": 45000,
    "resetTimeout": 120000
  },
  "admin": {
    "pin": "1234",
    "gesture": "top-left-hold"
  },
  "performance": {
    "motionTier": "auto",
    "targetFPS": 60
  }
}
```

### Optional: Enable Security Lockdown

For public kiosk deployment, enable lockdown mode:

```batch
cd "C:\Program Files\3D Clue Board Kiosk"
scripts\enable-lockdown.bat
```

This disables:
- Task Manager (Ctrl+Shift+Esc)
- Windows key
- Alt+Tab
- Ctrl+Alt+Del

**Important**: To exit lockdown mode for maintenance, run:
```batch
scripts\disable-lockdown.bat
```

---

## Post-Installation Testing

### 1. Boot Time Test (Requirement 8.1)

1. Restart Windows
2. Time from login to application ready
3. **Target**: ≤ 5 seconds
4. Check logs: `logs\startup.log`

### 2. Performance Test (Requirements 6.2, 7.2, 7.3)

1. Open Admin Overlay (3-second tap-and-hold in upper-left)
2. Enter PIN (default: 1234)
3. Check performance metrics:
   - **FPS**: ≥ 55 (target 60)
   - **Draw Calls**: ≤ 120
   - **Memory**: Stable over time

### 3. Touch Interaction Test (Requirement 3.1)

1. Tap each room tile
2. Verify minimum 56px hit targets
3. Test two-finger tap (back gesture)
4. Test admin gesture (3-second hold)

### 4. Idle Behavior Test (Requirements 4.1, 4.2)

1. Leave kiosk idle for 45 seconds
2. Verify attract loop starts
3. Leave idle for 120 seconds total
4. Verify auto-reset to home

### 5. Navigation Test (Requirements 5.1-5.6)

1. Tap each of 8 room tiles
2. Verify smooth transitions (500-700ms)
3. Check for white flashes (should be none)
4. Verify input locked during transitions

### 6. Offline Operation Test (Requirement 8.3)

1. Disconnect network
2. Restart application
3. Verify full functionality
4. Check for network errors (should be none)

### 7. 24-Hour Soak Test (Requirement 8.4)

1. Run application continuously for 24 hours
2. Monitor memory usage
3. Check for memory leaks
4. Verify stable performance

---

## Troubleshooting

### Application Won't Start

**Symptoms**: Application crashes on launch or shows black screen

**Solutions**:
1. Check graphics drivers are up to date
2. Verify WebGL support:
   - Open Chrome
   - Navigate to `chrome://gpu`
   - Check WebGL status
3. Check logs: `logs\error.log`
4. Try running in compatibility mode
5. Reinstall Visual C++ Redistributable

### Poor Performance / Low FPS

**Symptoms**: FPS below 55, stuttering, lag

**Solutions**:
1. Update graphics drivers
2. Close background applications
3. Check motion tier in Admin Overlay
4. Manually set motion tier to "lite" or "static"
5. Verify display scaling is 100%
6. Check GPU temperature (may be thermal throttling)

### Touch Not Working

**Symptoms**: Touch input not recognized

**Solutions**:
1. Calibrate touchscreen in Windows Settings
2. Update touchscreen drivers
3. Test touch in Windows (draw in Paint)
4. Check USB connection
5. Restart Windows

### Auto-Start Not Working

**Symptoms**: Application doesn't start on boot

**Solutions**:
1. Verify startup script exists:
   ```
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\3D-Clue-Board-Kiosk.bat
   ```
2. Check script contents
3. Run script manually to test
4. Check Windows Event Viewer for errors
5. Re-run `install-kiosk-mode.bat`

### Admin Overlay Won't Open

**Symptoms**: Can't access admin settings

**Solutions**:
1. Verify gesture: 3-second tap-and-hold in upper-left corner
2. Check PIN in `public/config/config.json`
3. Try default PIN: 1234
4. Check logs for gesture detection
5. Use keyboard shortcut: Ctrl+Shift+A (if enabled)

### Memory Leak / Increasing Memory Usage

**Symptoms**: Memory usage grows over time

**Solutions**:
1. Check for memory leaks in logs
2. Restart application daily (scheduled task)
3. Update to latest version
4. Report issue with logs

### Assets Not Loading

**Symptoms**: Missing textures, models, or blank tiles

**Solutions**:
1. Verify assets exist in `resources\assets`
2. Check asset manifest: `public/assets/manifest.json`
3. Validate asset sizes: `npm run validate:assets`
4. Re-optimize assets: `npm run optimize:assets`
5. Reinstall application

### Network Errors (Offline Mode)

**Symptoms**: Network error messages despite offline operation

**Solutions**:
1. Check `electron/main.ts` for network blocking
2. Verify Content Security Policy
3. Check for external resource requests
4. Review logs for network attempts

---

## Maintenance

### Daily Tasks

- [ ] Visual inspection of display
- [ ] Test touch responsiveness
- [ ] Check application is running
- [ ] Review error logs

### Weekly Tasks

- [ ] Clean touchscreen display
- [ ] Check disk space
- [ ] Review performance metrics
- [ ] Test admin overlay access
- [ ] Backup configuration files

### Monthly Tasks

- [ ] Update content (if needed)
- [ ] Review and archive logs
- [ ] Test all navigation paths
- [ ] Verify auto-start functionality
- [ ] Check for Windows updates

### Quarterly Tasks

- [ ] Full system backup
- [ ] Update graphics drivers
- [ ] Performance benchmark
- [ ] 24-hour soak test
- [ ] Review and update documentation

### Configuration Backup

Backup these files regularly:

```
public/config/config.json
public/config/rooms.json
logs/
```

### Log Management

Logs are stored in `logs/` directory:

- `startup.log` - Boot and startup events
- `error.log` - Application errors
- `performance.log` - Performance metrics
- `admin.log` - Admin overlay access

Rotate logs monthly to prevent disk space issues.

### Updating the Application

1. **Backup current configuration**
   ```batch
   xcopy "C:\Program Files\3D Clue Board Kiosk\public\config" "C:\Backup\config" /E /I
   ```

2. **Uninstall current version**
   - Use Windows Settings > Apps
   - Or run uninstaller from Start Menu

3. **Install new version**
   - Follow installation steps above

4. **Restore configuration**
   ```batch
   xcopy "C:\Backup\config" "C:\Program Files\3D Clue Board Kiosk\public\config" /E /I /Y
   ```

5. **Test thoroughly**
   - Run all post-installation tests

---

## Support

For technical support or issues not covered in this guide:

1. Check logs in `logs/` directory
2. Review error messages
3. Consult troubleshooting section
4. Contact system administrator

---

## Appendix

### File Locations

- **Application**: `C:\Program Files\3D Clue Board Kiosk`
- **User Data**: `%LOCALAPPDATA%\3d-clue-board-kiosk`
- **Logs**: `C:\Program Files\3D Clue Board Kiosk\logs`
- **Config**: `C:\Program Files\3D Clue Board Kiosk\public\config`
- **Assets**: `C:\Program Files\3D Clue Board Kiosk\resources\assets`

### Registry Keys

- **Install Path**: `HKLM\Software\MCMuseum\3DClueBoard\InstallPath`
- **Version**: `HKLM\Software\MCMuseum\3DClueBoard\Version`
- **Kiosk Mode**: `HKLM\Software\MCMuseum\3DClueBoard\KioskMode`

### Performance Budgets

- Initial Payload: ≤ 3.5 MB
- Main Thread Blocking: ≤ 200ms
- Draw Calls: ≤ 120
- Per-Room Assets: ≤ 350 KB
- Target FPS: 60 (minimum 55)

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025  
**Application Version**: 1.0.0
