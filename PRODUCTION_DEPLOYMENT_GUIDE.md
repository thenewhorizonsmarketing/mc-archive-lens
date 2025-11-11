# MC Museum & Archives Kiosk - Production Deployment Guide

**Version**: 1.0.0  
**Date**: November 10, 2025  
**Status**: Ready for Production Deployment

---

## 🎯 Pre-Deployment Checklist

### System Requirements Verification
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager available
- [ ] Git installed and configured
- [ ] Sufficient disk space (minimum 500MB free)
- [ ] Target hardware meets minimum specifications

### Code Readiness
- [x] All specs completed (4/4)
- [x] All tests passing
- [x] No critical errors in codebase
- [x] Dependencies up to date
- [x] Security vulnerabilities addressed

### Data Preparation
- [ ] CSV data files prepared and validated
- [ ] Photos organized in correct directory structure
- [ ] PDFs available for publications
- [ ] Asset files optimized and compressed
- [ ] Backup of existing data (if applicable)

---

## 📋 Deployment Steps

### Step 1: Environment Setup

**For Linux/macOS**:
```bash
# Navigate to project directory
cd /path/to/mc-archive-lens

# Verify Node.js version
node --version  # Should be 18.x or higher

# Check prerequisites
./scripts/deploy.sh --check
```

**For Windows**:
```batch
REM Navigate to project directory
cd C:\path\to\mc-archive-lens

REM Verify Node.js version
node --version

REM Check prerequisites
scripts\deploy.bat
```

### Step 2: Install Dependencies

```bash
# Clean install (recommended for production)
npm ci

# Or regular install
npm install
```

**Expected Duration**: 2-5 minutes

### Step 3: Build Application

```bash
# Build for production
npm run build
```

**Expected Duration**: 1-3 minutes  
**Output**: `dist/` directory with optimized files

### Step 4: Run Automated Deployment

**Linux/macOS**:
```bash
# Full automated deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows**:
```batch
# Full automated deployment
scripts\deploy.bat
```

**This will automatically**:
- ✓ Check prerequisites
- ✓ Create necessary directories
- ✓ Install dependencies
- ✓ Build application
- ✓ Initialize database
- ✓ Import sample data (if available)
- ✓ Create initial backup
- ✓ Setup system services (Linux)
- ✓ Create desktop shortcuts
- ✓ Generate deployment report

**Expected Duration**: 5-10 minutes

### Step 5: Verify Deployment

```bash
# Start the application
npm start

# Application should be available at:
# http://localhost:3000
```

**Verification Checklist**:
- [ ] Application starts without errors
- [ ] Homepage loads correctly
- [ ] All four rooms are accessible
- [ ] Search functionality works
- [ ] Touchscreen keyboard appears
- [ ] Admin panel accessible (Ctrl+Shift+A)

---

## 🔧 Configuration

### Database Configuration

**Location**: `data/kiosk.db`

The database is automatically initialized during deployment. To manually initialize:

```bash
npm run db:init
```

### Import Your Data

**Option 1: Through Admin Panel** (Recommended)
1. Open application: `http://localhost:3000`
2. Press `Ctrl+Shift+A` to open admin panel
3. Navigate to "Data Import" tab
4. Upload your CSV files:
   - Alumni data
   - Publications data
   - Photos metadata
   - Faculty data
5. Monitor import progress
6. Verify data in search

**Option 2: Place Files in Data Directory**
```bash
# Copy your CSV files
cp your-alumni.csv data/alumni.csv
cp your-publications.csv data/publications.csv
cp your-photos.csv data/photos.csv
cp your-faculty.csv data/faculty.csv

# Re-run deployment to import
./scripts/deploy.sh --db-init
```

### Asset Organization

**Photos**:
```
public/photos/
├── 1980/
│   ├── 1-Name-Description.jpg
│   └── 2-Name-Description.jpg
├── 1981/
└── ...
```

**Publications**:
```
public/publications/
├── amicus/
│   ├── 2020-fall.pdf
│   └── 2021-spring.pdf
├── legal-eye/
└── law-review/
```

---

## 🚀 Production Deployment Options

### Option A: Web Server Deployment

**Using Nginx**:
```nginx
server {
    listen 80;
    server_name kiosk.museum.edu;
    
    root /path/to/mc-archive-lens/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

**Using Apache**:
```apache
<VirtualHost *:80>
    ServerName kiosk.museum.edu
    DocumentRoot /path/to/mc-archive-lens/dist
    
    <Directory /path/to/mc-archive-lens/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Option B: Electron Kiosk Mode

**Build Electron App**:
```bash
# Install Electron dependencies
npm install electron electron-builder

# Build for Windows
npm run electron:build:win

# Build for Linux
npm run electron:build:linux

# Build for macOS
npm run electron:build:mac
```

**Configure Kiosk Mode**:
Edit `electron/main.js`:
```javascript
const mainWindow = new BrowserWindow({
  fullscreen: true,
  kiosk: true,
  frame: false,
  // ... other options
});
```

### Option C: Docker Deployment

**Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Run**:
```bash
# Build image
docker build -t mc-kiosk:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/backups:/app/backups \
  --name mc-kiosk \
  mc-kiosk:latest
```

---

## 🔒 Security Configuration

### Change Default Admin PIN

**Edit**: `public/config/config.json`
```json
{
  "admin": {
    "pin": "YOUR_SECURE_PIN_HERE"
  }
}
```

### Enable HTTPS (Production)

**Using Let's Encrypt**:
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d kiosk.museum.edu

# Auto-renewal
sudo certbot renew --dry-run
```

### Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## 📊 Post-Deployment Validation

### Run Comprehensive Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Performance Validation

1. Open Admin Panel (`Ctrl+Shift+A`)
2. Navigate to "Performance" tab
3. Click "Run Performance Tests"
4. Verify all tests pass:
   - Simple search: <50ms ✓
   - Complex search: <100ms ✓
   - Large results: <150ms ✓
   - Concurrent queries: <200ms ✓

### Accessibility Validation

1. Test with screen reader (NVDA, JAWS, VoiceOver)
2. Test keyboard navigation (Tab, Enter, Escape)
3. Test high contrast mode
4. Verify touch target sizes (44px minimum)
5. Check color contrast ratios

### Security Validation

1. Test input validation (try malicious inputs)
2. Verify rate limiting works
3. Test file upload restrictions
4. Check SQL injection prevention
5. Verify XSS protection

---

## 🔍 Monitoring Setup

### Enable System Monitoring

1. Open Admin Panel
2. Navigate to "Monitoring" tab
3. Enable auto-refresh (30-second interval)
4. Review system metrics:
   - Query performance
   - Cache hit rate
   - Security status
   - Database health
   - System resources

### Configure Alerts

**Edit monitoring thresholds**:
```typescript
// In admin panel or config
{
  performanceThresholds: {
    slowQueryThreshold: 100,      // ms
    memoryWarningThreshold: 80,   // %
    cpuWarningThreshold: 70,      // %
    cacheHitRateThreshold: 85,    // %
  }
}
```

### Setup Automated Backups

**Linux (cron)**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/mc-archive-lens && npm run backup
```

**Windows (Task Scheduler)**:
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start Program
5. Program: `npm`
6. Arguments: `run backup`
7. Start in: `C:\path\to\mc-archive-lens`

---

## 🐛 Troubleshooting

### Application Won't Start

**Check Node.js version**:
```bash
node --version  # Must be 18+
```

**Check for port conflicts**:
```bash
# Linux/macOS
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**Check logs**:
```bash
# View application logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log
```

### Database Issues

**Rebuild database**:
```bash
# Backup first!
npm run backup

# Rebuild
npm run db:rebuild
```

**Check database integrity**:
```bash
sqlite3 data/kiosk.db "PRAGMA integrity_check;"
```

### Search Not Working

**Rebuild search indexes**:
1. Open Admin Panel
2. Navigate to "Database" tab
3. Click "Rebuild Indexes"
4. Wait for completion
5. Test search

**Check FTS5 extension**:
```bash
sqlite3 data/kiosk.db "SELECT * FROM pragma_compile_options WHERE compile_options LIKE '%FTS5%';"
```

### Performance Issues

**Run performance validator**:
1. Open Admin Panel
2. Navigate to "Performance" tab
3. Click "Run Tests"
4. Review failed tests
5. Apply recommendations

**Clear cache**:
```bash
# Clear application cache
npm run cache:clear
```

---

## 📞 Support & Resources

### Documentation
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Start**: `DEPLOYMENT_QUICK_START.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **API Documentation**: `docs/API.md`

### Logs Location
- Application logs: `logs/application.log`
- Error logs: `logs/error.log`
- Deployment logs: `deployment.log`
- Backup logs: `backups/backup.log`

### Admin Panel Access
- **URL**: `http://localhost:3000`
- **Shortcut**: `Ctrl+Shift+A`
- **Default PIN**: 1234 (CHANGE THIS!)

### Emergency Procedures

**System Unresponsive**:
```bash
# Restart application
npm run restart

# Or force kill and restart
pkill -f "node.*kiosk"
npm start
```

**Data Corruption**:
```bash
# Restore from latest backup
npm run restore:latest

# Or restore specific backup
npm run restore backups/backup_20251110_120000.db
```

---

## ✅ Deployment Completion Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance validated
- [ ] Security configured
- [ ] Data imported
- [ ] Assets organized
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Documentation reviewed

### Launch Day
- [ ] Final backup created
- [ ] Application deployed
- [ ] Smoke tests completed
- [ ] Admin panel accessible
- [ ] Search functionality verified
- [ ] All rooms accessible
- [ ] Touchscreen tested
- [ ] Monitoring active

### Post-Launch
- [ ] Monitor system health (first 24 hours)
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] User acceptance testing
- [ ] Document any issues
- [ ] Create support procedures

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Application loads without errors  
✅ All four rooms are accessible  
✅ Search returns accurate results  
✅ Touchscreen keyboard works  
✅ Performance meets targets (<100ms queries)  
✅ Accessibility features work  
✅ Admin panel is accessible  
✅ Monitoring dashboard shows healthy status  
✅ Backups are being created  
✅ No critical errors in logs  

---

**Congratulations! Your MC Museum & Archives Kiosk is ready for production use!**

For ongoing support and maintenance, refer to the monitoring dashboard and documentation.

**Last Updated**: November 10, 2025  
**Version**: 1.0.0
