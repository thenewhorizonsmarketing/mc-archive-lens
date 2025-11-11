# Troubleshooting Guide

## Common Issues and Solutions

This guide provides detailed troubleshooting steps for common issues with the 3D Clue Board Kiosk.

---

## Table of Contents

1. [Startup Issues](#startup-issues)
2. [Performance Issues](#performance-issues)
3. [Touch Input Issues](#touch-input-issues)
4. [Display Issues](#display-issues)
5. [Navigation Issues](#navigation-issues)
6. [Admin Overlay Issues](#admin-overlay-issues)
7. [Asset Loading Issues](#asset-loading-issues)
8. [Memory Issues](#memory-issues)
9. [Network Issues](#network-issues)
10. [Windows Kiosk Mode Issues](#windows-kiosk-mode-issues)

---

## Startup Issues

### Application Won't Start

**Symptoms**:
- Application crashes immediately
- Black screen on launch
- Error message on startup

**Diagnostic Steps**:

1. **Check logs**:
   ```
   C:\Program Files\3D Clue Board Kiosk\logs\error.log
   C:\Program Files\3D Clue Board Kiosk\logs\startup.log
   ```

2. **Verify WebGL support**:
   - Open Chrome browser
   - Navigate to `chrome://gpu`
   - Check "WebGL" and "WebGL2" status
   - Should show "Hardware accelerated"

3. **Check graphics drivers**:
   - Open Device Manager
   - Expand "Display adapters"
   - Check for yellow warning icons
   - Update drivers if needed

**Solutions**:

1. **Update graphics drivers**:
   - Visit GPU manufacturer website (NVIDIA/AMD/Intel)
   - Download latest drivers for your GPU
   - Install and restart

2. **Reinstall Visual C++ Redistributable**:
   - Download from Microsoft website
   - Install both x86 and x64 versions
   - Restart computer

3. **Run in compatibility mode**:
   - Right-click application shortcut
   - Properties > Compatibility
   - Check "Run this program in compatibility mode"
   - Select "Windows 8"
   - Apply and test

4. **Check Windows Event Viewer**:
   - Open Event Viewer
   - Windows Logs > Application
   - Look for errors from "3D Clue Board Kiosk"
   - Note error codes and messages

### Application Starts But Shows Black Screen

**Symptoms**:
- Window opens but remains black
- No error messages
- Application appears running in Task Manager

**Solutions**:

1. **Force WebGL fallback**:
   - Edit `public\config\config.json`
   - Set `"forceFallback": true`
   - Restart application

2. **Check display settings**:
   - Verify display scaling is 100%
   - Verify resolution is correct
   - Try different display port/cable

3. **Clear application cache**:
   ```batch
   rd /s /q "%LOCALAPPDATA%\3d-clue-board-kiosk"
   ```
   - Restart application

### Auto-Start Not Working

**Symptoms**:
- Application doesn't start on Windows boot
- Must manually launch application

**Diagnostic Steps**:

1. **Check startup folder**:
   ```
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
   ```
   - Verify `3D-Clue-Board-Kiosk.bat` exists

2. **Test startup script manually**:
   ```batch
   cd "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
   3D-Clue-Board-Kiosk.bat
   ```
   - Note any errors

**Solutions**:

1. **Re-run kiosk setup**:
   ```batch
   cd "C:\Program Files\3D Clue Board Kiosk"
   scripts\install-kiosk-mode.bat
   ```

2. **Check Task Scheduler**:
   - Open Task Scheduler
   - Create new task: "Launch Kiosk"
   - Trigger: At log on
   - Action: Start program
   - Program: `C:\Program Files\3D Clue Board Kiosk\3D Clue Board Kiosk.exe`
   - Arguments: `--kiosk`

3. **Verify user permissions**:
   - Ensure kiosk user has execute permissions
   - Check file ownership

---

## Performance Issues

### Low Frame Rate (FPS < 55)

**Symptoms**:
- Stuttering animations
- Laggy touch response
- FPS counter shows < 55

**Diagnostic Steps**:

1. **Check performance metrics**:
   - Open admin overlay (3-second hold upper-left)
   - Enter PIN
   - View FPS, draw calls, memory usage

2. **Check GPU usage**:
   - Open Task Manager
   - Performance tab > GPU
   - Should show 50-80% usage during operation

**Solutions**:

1. **Update graphics drivers** (most common fix)

2. **Reduce motion tier**:
   - Open admin overlay
   - Set motion tier to "lite" or "static"
   - Test performance

3. **Close background applications**:
   - Open Task Manager
   - End unnecessary processes
   - Disable startup programs

4. **Check thermal throttling**:
   - Monitor GPU temperature
   - Ensure adequate cooling
   - Clean dust from vents

5. **Optimize Windows**:
   - Disable Windows visual effects
   - Disable Windows Search indexing
   - Disable Windows Defender real-time scanning (if safe)

### High Draw Calls (> 120)

**Symptoms**:
- Performance degradation
- Draw call counter > 120

**Solutions**:

1. **Check asset optimization**:
   ```batch
   npm run validate:assets
   ```

2. **Re-optimize assets**:
   ```batch
   npm run optimize:assets
   ```

3. **Verify single glTF file**:
   - Check `public\assets\models`
   - Should be one combined model file

### Memory Usage Increasing Over Time

**Symptoms**:
- Memory usage grows continuously
- Application becomes sluggish after hours
- Eventually crashes

**Solutions**:

1. **Schedule daily restart**:
   - Create Task Scheduler task
   - Trigger: Daily at 3:00 AM
   - Action: Restart application

2. **Check for memory leaks**:
   - Run 24-hour soak test
   - Monitor memory in Task Manager
   - Check logs for disposal errors

3. **Update to latest version**:
   - Memory leaks may be fixed in updates

---

## Touch Input Issues

### Touch Not Responding

**Symptoms**:
- Touch input not recognized
- Must use mouse instead

**Solutions**:

1. **Calibrate touchscreen**:
   - Settings > Devices > Pen & Windows Ink
   - Calibrate display for pen or touch input
   - Follow calibration wizard

2. **Update touchscreen drivers**:
   - Device Manager > Human Interface Devices
   - Find touchscreen device
   - Update driver

3. **Test touch in Windows**:
   - Open Paint
   - Try drawing with finger
   - If works in Paint, issue is with application

4. **Check USB connection**:
   - Verify touchscreen USB cable connected
   - Try different USB port
   - Check for loose connections

### Touch Inaccurate or Offset

**Symptoms**:
- Touch registers in wrong location
- Offset from actual touch point

**Solutions**:

1. **Recalibrate touchscreen** (see above)

2. **Check display scaling**:
   - Must be set to 100%
   - Settings > Display > Scale and layout

3. **Verify resolution**:
   - Should match native resolution (3840x2160 for 4K)

### Gestures Not Working

**Symptoms**:
- Two-finger tap doesn't work
- Admin gesture (3-second hold) doesn't work

**Solutions**:

1. **Check gesture configuration**:
   - Edit `public\config\config.json`
   - Verify gesture settings enabled

2. **Test gesture detection**:
   - Check logs for gesture events
   - Verify touch points detected

3. **Increase gesture timeout**:
   - In config.json, increase hold duration
   - Default is 3000ms, try 4000ms

---

## Display Issues

### Wrong Resolution

**Symptoms**:
- Display appears stretched or compressed
- UI elements too large or small

**Solutions**:

1. **Set correct resolution**:
   - Right-click desktop > Display settings
   - Set to 3840x2160 (4K)
   - Apply changes

2. **Set scaling to 100%**:
   - Display settings > Scale and layout
   - Set to 100%
   - Sign out and back in

### Display Goes to Sleep

**Symptoms**:
- Display turns off after inactivity
- Must touch to wake

**Solutions**:

1. **Configure power settings**:
   ```batch
   powercfg /change monitor-timeout-ac 0
   powercfg /change monitor-timeout-dc 0
   ```

2. **Disable screen saver**:
   ```batch
   reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f
   ```

3. **Re-run kiosk setup**:
   ```batch
   scripts\install-kiosk-mode.bat
   ```

### Colors Look Wrong

**Symptoms**:
- Colors appear washed out or oversaturated
- Incorrect color temperature

**Solutions**:

1. **Calibrate display**:
   - Settings > Display > Calibrate display color
   - Follow calibration wizard

2. **Check GPU color settings**:
   - NVIDIA Control Panel or AMD Radeon Settings
   - Adjust color settings
   - Reset to defaults if needed

---

## Navigation Issues

### Transitions Too Slow

**Symptoms**:
- Camera transitions take > 700ms
- Feels sluggish

**Solutions**:

1. **Check performance** (see Performance Issues)

2. **Adjust transition duration**:
   - Edit `public\config\config.json`
   - Reduce transition duration
   - Default: 500-700ms

### Transitions Jerky or Stuttering

**Symptoms**:
- Transitions not smooth
- Visible frame drops during animation

**Solutions**:

1. **Reduce motion tier** (see Performance Issues)

2. **Check for background processes**

3. **Update graphics drivers**

### Can't Navigate Back to Home

**Symptoms**:
- Two-finger tap doesn't work
- Stuck in room view

**Solutions**:

1. **Use keyboard shortcut**:
   - Press Escape key
   - Or Home key

2. **Wait for auto-reset**:
   - Leave idle for 120 seconds
   - Should auto-reset to home

3. **Restart application**

---

## Admin Overlay Issues

### Can't Open Admin Overlay

**Symptoms**:
- 3-second hold doesn't open overlay
- No response to admin gesture

**Solutions**:

1. **Verify gesture location**:
   - Must be in upper-left corner
   - Within 100px of corner

2. **Check hold duration**:
   - Must hold for full 3 seconds
   - Don't move finger during hold

3. **Try keyboard shortcut**:
   - Press Ctrl+Shift+A (if enabled)

4. **Check configuration**:
   - Verify admin overlay enabled in config.json

### Wrong PIN / Forgot PIN

**Symptoms**:
- PIN entry fails
- Don't remember PIN

**Solutions**:

1. **Check default PIN**:
   - Default is "1234"
   - Try this first

2. **Reset PIN**:
   - Exit application
   - Edit `public\config\config.json`
   - Change `"pin"` value
   - Restart application

3. **Disable PIN temporarily**:
   - In config.json, set `"requirePin": false`

---

## Asset Loading Issues

### Assets Not Loading

**Symptoms**:
- Missing textures (pink/purple surfaces)
- Missing models (invisible tiles)
- Blank room tiles

**Solutions**:

1. **Verify assets exist**:
   ```
   C:\Program Files\3D Clue Board Kiosk\resources\assets
   ```
   - Check for model files (.gltf, .glb)
   - Check for texture files (.ktx2, .png)

2. **Check asset manifest**:
   - Open `public\assets\manifest.json`
   - Verify all assets listed
   - Check file paths are correct

3. **Validate assets**:
   ```batch
   npm run validate:assets
   ```

4. **Re-optimize assets**:
   ```batch
   npm run optimize:assets
   ```

5. **Reinstall application**

### Slow Asset Loading

**Symptoms**:
- Long loading screen (> 5 seconds)
- Assets load one by one

**Solutions**:

1. **Check disk speed**:
   - Use SSD instead of HDD
   - Check disk health

2. **Optimize assets**:
   ```batch
   npm run optimize:assets
   ```

3. **Reduce asset sizes**:
   - Lower texture resolution
   - Increase compression

---

## Memory Issues

### Out of Memory Errors

**Symptoms**:
- Application crashes with memory error
- Windows shows low memory warning

**Solutions**:

1. **Increase system RAM**:
   - Minimum 8 GB
   - Recommended 16 GB

2. **Close background applications**

3. **Reduce asset quality**:
   - Use 1k textures instead of 2k
   - Set motion tier to "lite"

4. **Check for memory leaks** (see Performance Issues)

---

## Network Issues

### Network Error Messages

**Symptoms**:
- Error messages about network
- Despite offline operation

**Solutions**:

1. **Verify offline mode**:
   - Check `electron/main.ts`
   - Ensure network requests blocked

2. **Check Content Security Policy**:
   - Verify CSP in index.html
   - Should block external resources

3. **Review logs**:
   - Check for network request attempts
   - Identify source of requests

---

## Windows Kiosk Mode Issues

### Can't Exit Kiosk Mode

**Symptoms**:
- Windows key disabled
- Task Manager disabled
- Can't access Windows

**Solutions**:

1. **Use disable lockdown script**:
   - If accessible, run:
     ```batch
     scripts\disable-lockdown.bat
     ```

2. **Restart in Safe Mode**:
   - Hold Shift while clicking Restart
   - Troubleshoot > Advanced > Startup Settings
   - Restart and press F4 for Safe Mode
   - Run disable-lockdown.bat

3. **Manual registry edit**:
   - In Safe Mode, open Registry Editor
   - Delete these keys:
     ```
     HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System\DisableTaskMgr
     HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\NoWinKeys
     ```

### Kiosk Mode Too Restrictive

**Symptoms**:
- Can't perform maintenance
- Need to access Windows features

**Solutions**:

1. **Temporarily disable lockdown**:
   ```batch
   scripts\disable-lockdown.bat
   ```

2. **Perform maintenance**

3. **Re-enable lockdown**:
   ```batch
   scripts\enable-lockdown.bat
   ```

---

## Getting Help

If issues persist after trying these solutions:

1. **Collect diagnostic information**:
   - Copy all log files from `logs\` directory
   - Take screenshots of error messages
   - Note exact steps to reproduce issue
   - Record system specifications

2. **Check documentation**:
   - Review `docs\DEPLOYMENT.md`
   - Review `docs\KIOSK_SETUP.md`

3. **Contact support**:
   - Provide diagnostic information
   - Include application version
   - Include Windows version

---

## Diagnostic Commands

Useful commands for troubleshooting:

```batch
REM Check application version
"C:\Program Files\3D Clue Board Kiosk\3D Clue Board Kiosk.exe" --version

REM View logs
type "C:\Program Files\3D Clue Board Kiosk\logs\error.log"

REM Check graphics info
dxdiag

REM Check system info
systeminfo

REM Check running processes
tasklist | findstr "3D Clue Board"

REM Check disk space
wmic logicaldisk get size,freespace,caption

REM Check memory usage
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize
```

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025
