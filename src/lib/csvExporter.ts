import Papa from 'papaparse';
import { AlumniRecord } from "@/types";

export function exportAlumniToCSV(alumni: AlumniRecord[], filename: string = 'alumni-updated.csv') {
  // Convert records to CSV format
  const csvData = alumni.map(a => ({
    first_name: a.first_name,
    middle_name: a.middle_name || '',
    last_name: a.last_name,
    class_role: a.class_role || '',
    grad_year: a.grad_year,
    grad_date: a.grad_date,
    photo_file: a.photo_file || '',
    composite_image_path: a.composite_image_path,
    portrait_path: a.portrait_path || '',
    tags: a.tags.join(','),
  }));
  
  const csv = Papa.unparse(csvData);
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportChangesOnly(
  originalData: AlumniRecord[], 
  editedRecords: Map<string, Partial<AlumniRecord>>
) {
  const changes = Array.from(editedRecords.entries()).map(([id, changes]) => {
    const original = originalData.find(a => a.id === id);
    return {
      id,
      name: original?.full_name,
      ...changes
    };
  });
  
  const csv = Papa.unparse(changes);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'alumni-changes.csv';
  link.click();
}
