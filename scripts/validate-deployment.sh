#!/bin/bash

# MC Archive Lens - Deployment Validation Script
# This script validates that the system is ready for production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MC Archive Lens Deployment Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    elif [ "$result" = "fail" ]; then
        echo -e "${RED}✗${NC} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${RED}Error: $message${NC}"
        fi
        ((FAILED++))
    elif [ "$result" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${YELLOW}Warning: $message${NC}"
        fi
        ((WARNINGS++))
    fi
}

# Test 1: Node.js version
echo -e "${BLUE}[1/15]${NC} Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_result "Node.js version $(node --version)" "pass"
    else
        print_result "Node.js version $(node --version)" "fail" "Requires Node.js 18 or higher"
    fi
else
    print_result "Node.js installation" "fail" "Node.js not found"
fi

# Test 2: npm availability
echo -e "${BLUE}[2/15]${NC} Checking npm..."
if command -v npm &> /dev/null; then
    print_result "npm $(npm --version)" "pass"
else
    print_result "npm installation" "fail" "npm not found"
fi

# Test 3: Git availability
echo -e "${BLUE}[3/15]${NC} Checking Git..."
if command -v git &> /dev/null; then
    print_result "Git $(git --version | cut -d' ' -f3)" "pass"
else
    print_result "Git installation" "warn" "Git not found (optional)"
fi

# Test 4: Dependencies installed
echo -e "${BLUE}[4/15]${NC} Checking dependencies..."
if [ -d "node_modules" ]; then
    print_result "Dependencies installed" "pass"
else
    print_result "Dependencies" "fail" "Run 'npm install' first"
fi

# Test 5: Build directory
echo -e "${BLUE}[5/15]${NC} Checking build..."
if [ -d "dist" ]; then
    print_result "Build directory exists" "pass"
else
    print_result "Build directory" "warn" "Run 'npm run build' to create production build"
fi

# Test 6: Required directories
echo -e "${BLUE}[6/15]${NC} Checking directory structure..."
REQUIRED_DIRS=("data" "backups" "logs" "public/photos" "public/publications")
ALL_DIRS_EXIST=true

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        ALL_DIRS_EXIST=false
        break
    fi
done

if [ "$ALL_DIRS_EXIST" = true ]; then
    print_result "Required directories" "pass"
else
    print_result "Required directories" "warn" "Some directories missing (will be created during deployment)"
fi

# Test 7: Database file
echo -e "${BLUE}[7/15]${NC} Checking database..."
if [ -f "data/kiosk.db" ]; then
    print_result "Database file exists" "pass"
else
    print_result "Database file" "warn" "Will be created during deployment"
fi

# Test 8: Deployment scripts
echo -e "${BLUE}[8/15]${NC} Checking deployment scripts..."
if [ -f "scripts/deploy.sh" ] && [ -x "scripts/deploy.sh" ]; then
    print_result "Deployment script (Linux/macOS)" "pass"
elif [ -f "scripts/deploy.sh" ]; then
    print_result "Deployment script" "warn" "Script exists but not executable (run: chmod +x scripts/deploy.sh)"
else
    print_result "Deployment script" "fail" "scripts/deploy.sh not found"
fi

if [ -f "scripts/deploy.bat" ]; then
    print_result "Deployment script (Windows)" "pass"
else
    print_result "Deployment script (Windows)" "warn" "scripts/deploy.bat not found"
fi

# Test 9: Configuration files
echo -e "${BLUE}[9/15]${NC} Checking configuration..."
if [ -f "package.json" ]; then
    print_result "package.json" "pass"
else
    print_result "package.json" "fail" "package.json not found"
fi

if [ -f "tsconfig.json" ]; then
    print_result "tsconfig.json" "pass"
else
    print_result "tsconfig.json" "warn" "tsconfig.json not found"
fi

# Test 10: Spec completion
echo -e "${BLUE}[10/15]${NC} Checking spec completion..."
SPEC_COMPLETE_FILES=(
    ".kiro/specs/sqlite-fts5-search/SPEC_COMPLETE.md"
    ".kiro/specs/3d-clue-board-kiosk/SPEC_COMPLETE.md"
    ".kiro/specs/touchscreen-keyboard/KEYBOARD_COMPLETE.md"
)

ALL_SPECS_COMPLETE=true
for spec_file in "${SPEC_COMPLETE_FILES[@]}"; do
    if [ ! -f "$spec_file" ]; then
        ALL_SPECS_COMPLETE=false
        break
    fi
done

if [ "$ALL_SPECS_COMPLETE" = true ]; then
    print_result "All specs completed" "pass"
else
    print_result "Spec completion" "warn" "Some specs may not be complete"
fi

# Test 11: Core components
echo -e "${BLUE}[11/15]${NC} Checking core components..."
CORE_COMPONENTS=(
    "src/lib/database/manager.ts"
    "src/lib/database/search-manager.ts"
    "src/components/search/SearchInterface.tsx"
    "src/pages/HomePage.tsx"
)

ALL_COMPONENTS_EXIST=true
for component in "${CORE_COMPONENTS[@]}"; do
    if [ ! -f "$component" ]; then
        ALL_COMPONENTS_EXIST=false
        break
    fi
done

if [ "$ALL_COMPONENTS_EXIST" = true ]; then
    print_result "Core components" "pass"
else
    print_result "Core components" "fail" "Some core components missing"
fi

# Test 12: Documentation
echo -e "${BLUE}[12/15]${NC} Checking documentation..."
DOC_FILES=("README.md" "DEPLOYMENT_GUIDE.md" "PRODUCTION_DEPLOYMENT_GUIDE.md")
DOCS_EXIST=0

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        ((DOCS_EXIST++))
    fi
done

if [ $DOCS_EXIST -ge 2 ]; then
    print_result "Documentation files" "pass"
else
    print_result "Documentation" "warn" "Some documentation files missing"
fi

# Test 13: Disk space
echo -e "${BLUE}[13/15]${NC} Checking disk space..."
AVAILABLE_SPACE=$(df -BM . | tail -1 | awk '{print $4}' | sed 's/M//')
if [ "$AVAILABLE_SPACE" -gt 500 ]; then
    print_result "Disk space (${AVAILABLE_SPACE}MB available)" "pass"
elif [ "$AVAILABLE_SPACE" -gt 200 ]; then
    print_result "Disk space (${AVAILABLE_SPACE}MB available)" "warn" "Low disk space"
else
    print_result "Disk space (${AVAILABLE_SPACE}MB available)" "fail" "Insufficient disk space"
fi

# Test 14: Memory
echo -e "${BLUE}[14/15]${NC} Checking system memory..."
if command -v free &> /dev/null; then
    AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
    if [ "$AVAILABLE_MEM" -gt 500 ]; then
        print_result "Available memory (${AVAILABLE_MEM}MB)" "pass"
    elif [ "$AVAILABLE_MEM" -gt 200 ]; then
        print_result "Available memory (${AVAILABLE_MEM}MB)" "warn" "Low memory"
    else
        print_result "Available memory (${AVAILABLE_MEM}MB)" "fail" "Insufficient memory"
    fi
else
    print_result "Memory check" "warn" "Unable to check memory (free command not available)"
fi

# Test 15: SQLite with FTS5
echo -e "${BLUE}[15/15]${NC} Checking SQLite FTS5 support..."
if command -v sqlite3 &> /dev/null; then
    FTS5_SUPPORT=$(sqlite3 :memory: "SELECT * FROM pragma_compile_options WHERE compile_options LIKE '%FTS5%';" 2>/dev/null)
    if [ -n "$FTS5_SUPPORT" ]; then
        print_result "SQLite with FTS5 support" "pass"
    else
        print_result "SQLite FTS5 support" "warn" "FTS5 extension may not be available"
    fi
else
    print_result "SQLite" "warn" "sqlite3 command not found (will use better-sqlite3 from npm)"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

# Overall status
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ System is ready for production deployment!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Run: ./scripts/deploy.sh"
        echo "  2. Follow the deployment guide: PRODUCTION_DEPLOYMENT_GUIDE.md"
        exit 0
    else
        echo -e "${YELLOW}⚠ System is mostly ready, but has some warnings.${NC}"
        echo ""
        echo "Review warnings above and address if needed."
        echo "You can proceed with deployment, but some features may not work optimally."
        echo ""
        echo "To deploy anyway, run: ./scripts/deploy.sh"
        exit 0
    fi
else
    echo -e "${RED}✗ System is NOT ready for deployment.${NC}"
    echo ""
    echo "Please fix the failed checks above before deploying."
    echo "Refer to PRODUCTION_DEPLOYMENT_GUIDE.md for help."
    exit 1
fi
