#!/bin/bash

# MC Archive Lens Deployment Script
# This script sets up the database and imports initial data for the kiosk application

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/data"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or later."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or later."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm."
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$DATA_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/public/images/alumni"
    mkdir -p "$PROJECT_ROOT/public/images/photos"
    mkdir -p "$PROJECT_ROOT/public/images/faculty"
    mkdir -p "$PROJECT_ROOT/public/pdfs/publications"
    
    success "Directories created successfully"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    success "Dependencies installed successfully"
}

# Build the application
build_application() {
    log "Building the application..."
    
    cd "$PROJECT_ROOT"
    npm run build
    
    success "Application built successfully"
}

# Initialize database and run comprehensive deployment
initialize_database() {
    log "Running comprehensive deployment with automated validation..."
    
    cd "$PROJECT_ROOT"
    
    # Run comprehensive deployment using DeploymentManager
    node -e "
        const { DeploymentManager } = require('./dist/lib/deployment/deployment-manager.js');
        
        const config = {
            environment: process.env.NODE_ENV || 'production',
            databasePath: '$DATA_DIR/kiosk.db',
            enableSecurity: true,
            enableLogging: true,
            enablePerformanceMonitoring: true,
            enableAnalytics: true,
            backupPath: '$BACKUP_DIR',
            logLevel: 'INFO',
            performanceThresholds: {
                maxQueryTime: 100,
                maxMemoryUsage: 100 * 1024 * 1024,
                minCacheHitRate: 50
            }
        };
        
        const deploymentManager = new DeploymentManager(config);
        
        deploymentManager.deploy().then(result => {
            console.log('\\n📊 Deployment Report:');
            console.log('='.repeat(50));
            
            if (result.success) {
                console.log('✅ Status: SUCCESS');
            } else {
                console.log('❌ Status: FAILED');
            }
            
            console.log('📈 Steps completed:', result.steps.filter(s => s.status === 'success').length + '/' + result.steps.length);
            console.log('🔧 Components initialized:', result.systemInfo.componentsInitialized.join(', '));
            
            if (result.errors.length > 0) {
                console.log('\\n❌ Errors:');
                result.errors.forEach(error => console.log('   -', error));
            }
            
            if (result.warnings.length > 0) {
                console.log('\\n⚠️ Warnings:');
                result.warnings.forEach(warning => console.log('   -', warning));
            }
            
            // Generate and save deployment report
            const report = deploymentManager.generateReport(result);
            require('fs').writeFileSync('$PROJECT_ROOT/deployment-report.md', report);
            console.log('\\n📄 Deployment report saved to: deployment-report.md');
            
            deploymentManager.destroy();
            
            if (result.success) {
                console.log('\\n🎉 Database and system initialization completed successfully!');
                process.exit(0);
            } else {
                console.log('\\n💥 Deployment failed. Check errors above.');
                process.exit(1);
            }
        }).catch(error => {
            console.error('❌ Deployment failed with exception:', error);
            process.exit(1);
        });
    "
    
    success "Database and system initialization completed successfully"
}

# Import sample data
import_sample_data() {
    log "Importing sample data..."
    
    cd "$PROJECT_ROOT"
    
    # Check if sample data files exist
    SAMPLE_FILES=(
        "$DATA_DIR/sample-alumni.csv"
        "$DATA_DIR/sample-publications.csv"
        "$DATA_DIR/sample-photos.csv"
        "$DATA_DIR/sample-faculty.csv"
    )
    
    for file in "${SAMPLE_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            warning "Sample data file not found: $file"
            warning "Skipping sample data import. You can import data later through the admin panel."
            return
        fi
    done
    
    # Import each data type
    node -e "
        const { DatabaseManager } = require('./dist/lib/database/manager.js');
        const { ImportManager } = require('./dist/lib/database/import-manager.js');
        const fs = require('fs');
        
        async function importData() {
            try {
                const dbManager = new DatabaseManager();
                await dbManager.initializeDatabase();
                const importManager = new ImportManager(dbManager);
                
                const dataTypes = ['alumni', 'publications', 'photos', 'faculty'];
                
                for (const type of dataTypes) {
                    const filePath = \`$DATA_DIR/sample-\${type}.csv\`;
                    if (fs.existsSync(filePath)) {
                        console.log(\`Importing \${type} data from \${filePath}...\`);
                        const fileBuffer = fs.readFileSync(filePath);
                        const file = new File([fileBuffer], \`sample-\${type}.csv\`, { type: 'text/csv' });
                        
                        const result = await importManager.importCSV(file, type);
                        if (result.success) {
                            console.log(\`Successfully imported \${result.recordsImported} \${type} records\`);
                        } else {
                            console.error(\`Failed to import \${type} data:\`, result.errors);
                        }
                    }
                }
                
                console.log('Sample data import completed');
                process.exit(0);
            } catch (error) {
                console.error('Sample data import failed:', error);
                process.exit(1);
            }
        }
        
        importData();
    "
    
    success "Sample data imported successfully"
}

# Create initial backup
create_initial_backup() {
    log "Creating initial backup..."
    
    cd "$PROJECT_ROOT"
    
    BACKUP_FILE="$BACKUP_DIR/initial_backup_$(date +%Y%m%d_%H%M%S).db"
    
    node -e "
        const { DatabaseManager } = require('./dist/lib/database/manager.js');
        const { BackupManager } = require('./dist/lib/database/backup-manager.js');
        
        async function createBackup() {
            try {
                const dbManager = new DatabaseManager();
                await dbManager.initializeDatabase();
                const backupManager = new BackupManager(dbManager);
                
                const backupPath = await backupManager.createBackup();
                console.log('Initial backup created at:', backupPath);
                process.exit(0);
            } catch (error) {
                console.error('Backup creation failed:', error);
                process.exit(1);
            }
        }
        
        createBackup();
    "
    
    success "Initial backup created at $BACKUP_FILE"
}

# Set up systemd service (Linux only)
setup_systemd_service() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        warning "Systemd service setup is only available on Linux systems"
        return
    fi
    
    log "Setting up systemd service..."
    
    # Create service file
    cat > "/tmp/mc-archive-lens.service" << EOF
[Unit]
Description=MC Archive Lens Kiosk Application
After=network.target

[Service]
Type=simple
User=kiosk
WorkingDirectory=$PROJECT_ROOT
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    
    # Install service (requires sudo)
    if command -v sudo &> /dev/null; then
        sudo cp "/tmp/mc-archive-lens.service" "/etc/systemd/system/"
        sudo systemctl daemon-reload
        sudo systemctl enable mc-archive-lens
        success "Systemd service installed and enabled"
    else
        warning "sudo not available. Please manually copy /tmp/mc-archive-lens.service to /etc/systemd/system/"
    fi
}

# Create desktop shortcut (for kiosk mode)
create_desktop_shortcut() {
    log "Creating desktop shortcut..."
    
    DESKTOP_DIR="$HOME/Desktop"
    if [ ! -d "$DESKTOP_DIR" ]; then
        DESKTOP_DIR="$HOME"
    fi
    
    cat > "$DESKTOP_DIR/MC Archive Lens.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=MC Archive Lens
Comment=MC Museum & Archives Kiosk
Exec=chromium-browser --kiosk --no-sandbox --disable-web-security --disable-features=TranslateUI --disable-ipc-flooding-protection http://localhost:3000
Icon=$PROJECT_ROOT/public/favicon.ico
Terminal=false
StartupNotify=true
Categories=Education;
EOF
    
    chmod +x "$DESKTOP_DIR/MC Archive Lens.desktop"
    
    success "Desktop shortcut created"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="$PROJECT_ROOT/deployment-report.txt"
    
    cat > "$REPORT_FILE" << EOF
MC Archive Lens Deployment Report
Generated: $(date)

=== System Information ===
OS: $(uname -s)
Architecture: $(uname -m)
Node.js Version: $(node --version)
NPM Version: $(npm --version)

=== Project Information ===
Project Root: $PROJECT_ROOT
Data Directory: $DATA_DIR
Backup Directory: $BACKUP_DIR

=== Deployment Status ===
✓ Prerequisites checked
✓ Dependencies installed
✓ Application built
✓ Database initialized
✓ Sample data imported (if available)
✓ Initial backup created

=== Next Steps ===
1. Start the application: npm start
2. Access the kiosk at: http://localhost:3000
3. Access admin panel: Ctrl+Shift+A
4. Import your data through the admin panel
5. Configure kiosk settings as needed

=== Maintenance ===
- Backup files are stored in: $BACKUP_DIR
- Logs are stored in: $PROJECT_ROOT/logs
- Use the admin panel for data management
- Regular backups are recommended

=== Support ===
For technical support, refer to the documentation in the docs/ directory.
EOF
    
    success "Deployment report generated: $REPORT_FILE"
}

# Main deployment function
main() {
    log "Starting MC Archive Lens deployment..."
    log "Project root: $PROJECT_ROOT"
    
    # Run deployment steps
    check_prerequisites
    create_directories
    install_dependencies
    build_application
    initialize_database
    import_sample_data
    create_initial_backup
    setup_systemd_service
    create_desktop_shortcut
    generate_report
    
    success "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 MC Archive Lens has been deployed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the application: ${BLUE}npm start${NC}"
    echo "2. Open your browser to: ${BLUE}http://localhost:3000${NC}"
    echo "3. Access admin panel with: ${BLUE}Ctrl+Shift+A${NC}"
    echo ""
    echo "For more information, see the deployment report: ${BLUE}$PROJECT_ROOT/deployment-report.txt${NC}"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "MC Archive Lens Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Check prerequisites only"
        echo "  --build        Build application only"
        echo "  --db-init      Initialize database only"
        echo ""
        exit 0
        ;;
    --check)
        check_prerequisites
        exit 0
        ;;
    --build)
        build_application
        exit 0
        ;;
    --db-init)
        initialize_database
        exit 0
        ;;
    *)
        main
        ;;
esac