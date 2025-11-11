# 3D Clue Board Kiosk - Deployment Quick Start

## For Developers

### Build Production Version

```bash
# 1. Optimize all assets
npm run optimize:all

# 2. Build and package for Windows
npm run package:win

# Output: release/3D Clue Board Kiosk-Setup-1.0.0.exe
```

### Build Portable Version

```bash
npm run package:win:portable

# Output: release/3D Clue Board Kiosk-Portable-1.0.0.exe
```

---

## For Installers

### Quick Installation (5 Steps)

1. **Run installer as Administrator**
   - Right-click `3D Clue Board Kiosk-Setup-1.0.0.exe`
   - Select "Run as administrator"
   - Follow wizard, accept defaults

2. **Run kiosk setup**
   ```batch
   cd "C:\Program Files\3D Clue Board Kiosk"
   scripts\install-kiosk-mode.bat
   ```

3. **Change admin PIN**
   - Edit `public\config\config.json`
   - Change `"pin": "1234"` to your PIN

4. **Test installation**
   - Double-click desktop shortcut
   - Test touch input
   - Open admin overlay (3-second hold upper-left)

5. **Enable lockdown (optional)**
   ```batch
   scripts\enable-lockdown.bat
   ```

### Quick Uninstall

```batch
cd "C:\Program Files\3D Clue Board Kiosk"
scripts\uninstall-kiosk-mode.bat
```

Then uninstall via Windows Settings > Apps

---

## For Operators

### Daily Operation

**Start**: Turn on computer (auto-starts)  
**Stop**: Admin overlay > Exit Application  
**Restart**: Admin overlay > Restart Application

### Admin Access

1. Tap and hold upper-left corner for 3 seconds
2. Enter PIN (default: 1234)
3. Access settings and diagnostics

### Emergency Exit

- If lockdown disabled: Alt+F4
- If lockdown enabled: Run `scripts\disable-lockdown.bat`

---

## Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Won't start | Update graphics drivers |
| Low FPS | Set motion tier to "lite" in admin overlay |
| Touch not working | Calibrate touchscreen in Windows Settings |
| Can't access admin | Check PIN in config.json, default is 1234 |

**Full Documentation**: See `docs/` folder

---

## Asset Optimization

### Quick Optimization

```bash
npm run optimize:all
```

### Individual Steps

```bash
npm run optimize:geometry:draco    # Compress 3D models
npm run optimize:textures:ktx2     # Compress textures
npm run validate:assets            # Check budgets
```

---

## Performance Targets

- **Boot Time**: ≤ 5 seconds
- **FPS**: ≥ 55 (target 60)
- **Draw Calls**: ≤ 120
- **Total Assets**: ≤ 3.5 MB

---

## Support

**Documentation**:
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `docs/KIOSK_SETUP.md` - Step-by-step setup
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide
- `docs/ASSET_OPTIMIZATION.md` - Asset optimization

**Scripts**:
- `scripts/install-kiosk-mode.bat` - Setup kiosk mode
- `scripts/enable-lockdown.bat` - Enable security
- `scripts/disable-lockdown.bat` - Disable security
- `scripts/uninstall-kiosk-mode.bat` - Uninstall

---

**Version**: 1.0.0  
**Last Updated**: November 2025
