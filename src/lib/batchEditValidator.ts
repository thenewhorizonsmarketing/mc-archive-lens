import { AlumniRecord } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAlumniEdit(
  field: keyof AlumniRecord, 
  value: any, 
  record: AlumniRecord
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  switch (field) {
    case 'grad_year':
      const year = parseInt(value);
      if (isNaN(year)) {
        result.isValid = false;
        result.errors.push('Year must be a number');
      } else if (year < 1900 || year > 2030) {
        result.warnings.push('Unusual year - please verify');
      }
      break;
      
    case 'grad_date':
      if (value && !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
        result.isValid = false;
        result.errors.push('Date must be in M/D/YYYY format');
      }
      break;
      
    case 'first_name':
    case 'last_name':
      if (!value || value.trim().length === 0) {
        result.isValid = false;
        result.errors.push('Name cannot be empty');
      }
      break;
      
    case 'tags':
      if (Array.isArray(value) && value.length > 10) {
        result.warnings.push('More than 10 tags - consider consolidating');
      }
      break;
  }
  
  return result;
}

export function validateBulkChanges(
  changes: Map<string, Partial<AlumniRecord>>,
  originalData: AlumniRecord[]
): { valid: boolean; issues: Array<{ id: string; field: string; message: string }> } {
  const issues: Array<{ id: string; field: string; message: string }> = [];
  
  changes.forEach((updates, id) => {
    const original = originalData.find(a => a.id === id);
    if (!original) return;
    
    Object.entries(updates).forEach(([field, value]) => {
      const validation = validateAlumniEdit(field as keyof AlumniRecord, value, original);
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          issues.push({ id, field, message: error });
        });
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}
