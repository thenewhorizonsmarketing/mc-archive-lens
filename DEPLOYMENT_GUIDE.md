# Deployment Guide - MC Museum Kiosk

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Your CSV data files ready
- Photos and PDFs organized

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mc-archive-lens-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your data**
   - Place CSV files in `public/data/`
   - Place photos in `public/photos/YEAR/`
   - Place PDFs in `public/publications/`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Data Structure

### CSV Files Location
```
public/data/
├── alumni.csv          # Alumni records
├── publications.csv    # Publications metadata
├── photos.csv          # Photo metadata
└── faculty.csv         # Faculty information
```

### Photos Location
```
public/photos/
├── 1980/
│   ├── 1-Carmen_Castilla_-_Law_Review_Editor_In_Chief.jpg
│   └── ...
├── 1981/
└── ...
```

### Publications Location
```
public/publications/
├── amicus/
│   ├── 2020-fall.pdf
│   └── ...
├── legal-eye/
└── law-review/
```

## 🔄 Updating Data (Annual Updates)

### For Emily (Content Manager):

1. **Open the Admin Panel**
   - Navigate to `/admin` in the app
   - Or click "Admin" button

2. **Upload New CSV Files**
   - Click "Upload CSV"
   - Select your updated CSV file
   - System will validate and import
   - Automatic backup created

3. **Add New Photos**
   - Place new photos in appropriate year folder
   - Follow naming convention: `#-Name-Role.jpg`

4. **Verify Changes**
   - Search for new entries
   - Check photos load correctly
   - Test on kiosk hardware

## 🔧 Git Workflow

### Committing Code Changes
```bash
# Check what changed
git status

# Add changes
git add src/

# Commit with message
git commit -m "Description of changes"

# Push to remote
git push origin main
```

### Committing Data (Small Datasets)
```bash
# Add data files
git add public/data/*.csv

# Commit
git commit -m "Update dataset for 2024"

# Push
git push origin main
```

### For Large Files (Photos/PDFs)

**Option 1: Git LFS**
```bash
# One-time setup
git lfs install
git lfs track "*.jpg" "*.jpeg" "*.png" "*.pdf"
git add .gitattributes

# Then add files normally
git add public/photos/
git commit -m "Add photos"
git push origin main
```

**Option 2: External Storage**
- Upload to cloud storage (AWS S3, Azure Blob, etc.)
- Update paths in CSV files
- Only commit CSV metadata

## 🖥️ Production Deployment

### Build the Application
```bash
npm run build
```

This creates a `dist/` folder with optimized files.

### Deploy Options

**Option A: Static Hosting (Netlify, Vercel)**
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

**Option B: Self-Hosted Server**
1. Copy `dist/` folder to server
2. Copy `public/` folder to server
3. Serve with nginx or Apache
4. Configure for SPA routing

**Option C: Electron App (Kiosk Mode)**
1. Package as Electron app
2. Include all data in app bundle
3. Deploy to kiosk hardware
4. Configure auto-start on boot

## 🔒 Security Checklist

- [ ] Remove console.log statements
- [ ] Set proper file permissions
- [ ] Configure CORS if needed
- [ ] Enable HTTPS in production
- [ ] Backup data before updates
- [ ] Test on actual kiosk hardware

## 📊 Data Backup

### Automatic Backups
- Admin panel creates backups before imports
- Located in `backups/` folder
- Timestamped for easy recovery

### Manual Backup
```bash
# Backup data folder
cp -r public/data/ backups/data-$(date +%Y%m%d)/

# Backup photos
cp -r public/photos/ backups/photos-$(date +%Y%m%d)/
```

## 🐛 Troubleshooting

### Photos Not Loading
- Check file paths in CSV match actual files
- Verify photos are in correct year folder
- Check file permissions

### Search Not Working
- Verify CSV files are in `public/data/`
- Check browser console for errors
- Clear browser cache

### Keyboard Not Showing
- Ensure `showKeyboard={true}` in search components
- Check touch events are enabled
- Test on actual touchscreen

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Review error messages
3. Check CSV file format
4. Verify file paths

## 🎉 Features Included

- ✅ Touchscreen keyboard
- ✅ Instant search (1-character minimum)
- ✅ Autocomplete suggestions
- ✅ Recent searches
- ✅ Photo/PDF loading from search
- ✅ Touch-optimized interface
- ✅ Admin panel for data management
- ✅ Automatic backups
- ✅ Error recovery

## 📝 Version History

- **v2.0** - Touchscreen keyboard + instant search
- **v1.0** - Initial kiosk application

---

**Last Updated:** November 2025
**Maintained By:** Development Team
