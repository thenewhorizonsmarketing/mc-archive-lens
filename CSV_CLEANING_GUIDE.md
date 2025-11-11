# Alumni CSV Cleaning Guide

## Quick Start

### Step 1: Place Your CSV File
Put your raw CSV file in the project directory. For example:
```
raw-alumni-data.csv
```

### Step 2: Run the Cleaning Script
```bash
node scripts/clean-alumni-csv.js raw-alumni-data.csv public/sample-alumni.csv
```

### Step 3: Check the Output
The script will:
- ✅ Convert column names to lowercase (First_Name → first_name)
- ✅ Remove duplicate grad_year column
- ✅ Generate grad_date from grad_year (assumes May 15th)
- ✅ Clean and normalize all fields
- ✅ Validate data and report issues
- ✅ Create properly formatted output CSV

## Your CSV Format

**Input columns:**
```
grad_year,First_Name,Middle_Name,Last_Name,class_role,grad_year,photo_file
```

**Output columns:**
```
first_name,middle_name,last_name,class_role,grad_year,grad_date,photo_file
```

## What the Script Does

### Data Cleaning
- Removes extra whitespace
- Handles quoted fields properly
- Normalizes column names
- Removes duplicate columns

### Data Validation
- Checks for required fields (first_name, last_name, grad_year)
- Validates grad_year is a valid 4-digit year (1900-2100)
- Reports warnings for skipped rows
- Reports errors for problematic data

### Data Generation
- Creates `grad_date` in YYYY-MM-DD format from grad_year
- Assumes graduation date is May 15th of the grad_year
- Properly escapes CSV fields with commas or quotes

## Example

**Input row:**
```csv
1980,Carmen,,Castilla,Editor-In-Chief Law Review,1980,/photos/1981/1-Carmen_Castilla.jpg
```

**Output row:**
```csv
Carmen,,Castilla,Editor-In-Chief Law Review,1980,1980-05-15,/photos/1981/1-Carmen_Castilla.jpg
```

## Statistics Report

After processing, you'll see:
```
✅ Processing complete!

📊 Statistics:
   Total rows: 5294
   Processed: 5280
   Skipped: 14

⚠️  Warnings (14):
   Line 42: Missing required fields (first_name, last_name, or grad_year)
   Line 156: Invalid grad_year "N/A"
   ...
```

## Troubleshooting

### "Input file not found"
Make sure your CSV file path is correct relative to the project directory.

### "Missing required fields"
Some rows are missing first_name, last_name, or grad_year. These rows will be skipped.

### "Invalid grad_year"
The grad_year must be a 4-digit number between 1900 and 2100.

## After Cleaning

Once you have the cleaned CSV:

1. **Replace the default data:**
   ```bash
   cp public/sample-alumni.csv public/sample-alumni-backup.csv
   cp cleaned-alumni.csv public/sample-alumni.csv
   ```

2. **Or upload via Admin Panel:**
   - Press `Ctrl+Shift+A` to open Admin Panel
   - Go to "Upload" tab
   - Upload your cleaned CSV

3. **Verify the data:**
   - Navigate to Alumni Room
   - Check that records display correctly
   - Test search functionality

## Need Help?

If you encounter issues:
1. Check the warnings/errors in the script output
2. Share a few sample rows that are causing problems
3. I can adjust the script to handle your specific data format
