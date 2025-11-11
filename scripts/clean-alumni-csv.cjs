#!/usr/bin/env node

/**
 * Alumni CSV Cleaner and Formatter
 * 
 * This script transforms raw alumni CSV data into the format expected by the system.
 * 
 * Input format:
 *   grad_year,First_Name,Middle_Name,Last_Name,class_role,grad_year,photo_file
 * 
 * Output format:
 *   first_name,middle_name,last_name,class_role,grad_year,grad_date,photo_file
 * 
 * Usage:
 *   node scripts/clean-alumni-csv.cjs input.csv output.csv
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node clean-alumni-csv.cjs <input.csv> <output.csv>');
  console.error('Example: node clean-alumni-csv.cjs raw-alumni.csv public/sample-alumni.csv');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file "${inputFile}" not found`);
  process.exit(1);
}

console.log('🔄 Processing alumni CSV...');
console.log(`📥 Input: ${inputFile}`);
console.log(`📤 Output: ${outputFile}`);

// Read the input file
const inputData = fs.readFileSync(inputFile, 'utf-8');
const lines = inputData.split('\n').filter(line => line.trim());

if (lines.length === 0) {
  console.error('Error: Input file is empty');
  process.exit(1);
}

// Parse header
const header = lines[0];
console.log(`\n📋 Original header: ${header}`);

// Statistics
let stats = {
  total: 0,
  processed: 0,
  skipped: 0,
  errors: [],
  warnings: []
};

// Process rows
const outputRows = [];
const outputHeader = 'first_name,middle_name,last_name,class_role,grad_year,grad_date,photo_file';
outputRows.push(outputHeader);

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  stats.total++;
  
  try {
    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line);
    
    // Map fields based on input format
    // grad_year,First_Name,Middle_Name,Last_Name,class_role,grad_year,photo_file
    let [gradYear1, firstName, middleName, lastName, classRole, gradYear2, photoFile] = fields;
    
    // Use the second grad_year if first is empty, otherwise use first
    const gradYear = gradYear2 || gradYear1;
    
    // Validate required fields
    if (!firstName || !lastName || !gradYear) {
      stats.warnings.push(`Line ${i + 1}: Missing required fields (first_name, last_name, or grad_year)`);
      stats.skipped++;
      continue;
    }
    
    // Clean and normalize data
    firstName = cleanField(firstName);
    middleName = cleanField(middleName);
    lastName = cleanField(lastName);
    classRole = cleanField(classRole);
    photoFile = cleanField(photoFile);
    
    // Validate grad_year is a number
    const yearNum = parseInt(gradYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      stats.warnings.push(`Line ${i + 1}: Invalid grad_year "${gradYear}"`);
      stats.skipped++;
      continue;
    }
    
    // Generate grad_date from grad_year (assume May 15th)
    const gradDate = `${yearNum}-05-15`;
    
    // Build output row
    const outputRow = [
      escapeCSVField(firstName),
      escapeCSVField(middleName),
      escapeCSVField(lastName),
      escapeCSVField(classRole),
      yearNum,
      gradDate,
      escapeCSVField(photoFile)
    ].join(',');
    
    outputRows.push(outputRow);
    stats.processed++;
    
  } catch (error) {
    stats.errors.push(`Line ${i + 1}: ${error.message}`);
    stats.skipped++;
  }
}

// Write output file
const outputData = outputRows.join('\n') + '\n';
fs.writeFileSync(outputFile, outputData, 'utf-8');

// Print statistics
console.log('\n✅ Processing complete!');
console.log(`\n📊 Statistics:`);
console.log(`   Total rows: ${stats.total}`);
console.log(`   Processed: ${stats.processed}`);
console.log(`   Skipped: ${stats.skipped}`);

if (stats.warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${stats.warnings.length}):`);
  stats.warnings.slice(0, 10).forEach(w => console.log(`   ${w}`));
  if (stats.warnings.length > 10) {
    console.log(`   ... and ${stats.warnings.length - 10} more`);
  }
}

if (stats.errors.length > 0) {
  console.log(`\n❌ Errors (${stats.errors.length}):`);
  stats.errors.slice(0, 10).forEach(e => console.log(`   ${e}`));
  if (stats.errors.length > 10) {
    console.log(`   ... and ${stats.errors.length - 10} more`);
  }
}

console.log(`\n✨ Output written to: ${outputFile}`);
console.log(`\n📝 Output format: ${outputHeader}`);

// Helper functions

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Clean and normalize a field
 */
function cleanField(value) {
  if (!value) return '';
  
  // Remove quotes and trim
  value = value.replace(/^["']|["']$/g, '').trim();
  
  // Remove extra whitespace
  value = value.replace(/\s+/g, ' ');
  
  return value;
}

/**
 * Escape a field for CSV output
 */
function escapeCSVField(value) {
  if (!value) return '';
  
  // If field contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }
  
  return value;
}
