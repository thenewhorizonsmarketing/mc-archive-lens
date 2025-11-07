import Papa from 'papaparse';
import JSZip from 'jszip';
import { AlumniRecord, PublicationRecord, PhotoRecord, FacultyRecord } from "@/types";

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

export function exportPublicationsToCSV(publications: PublicationRecord[], filename: string = 'publications.csv') {
  const csvData = publications.map(p => ({
    id: p.id,
    title: p.title,
    pub_name: p.pub_name,
    issue_date: p.issue_date,
    volume_issue: p.volume_issue || '',
    pdf_path: p.pdf_path,
    thumb_path: p.thumb_path,
    description: p.description || '',
    tags: p.tags.join(','),
    page_count: p.page_count || '',
    year: p.year,
    decade: p.decade,
  }));
  
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportPhotosToCSV(photos: PhotoRecord[], filename: string = 'photos.csv') {
  const csvData = photos.map(p => ({
    id: p.id,
    collection: p.collection,
    title: p.title,
    year_or_decade: p.year_or_decade,
    image_path: p.image_path,
    caption: p.caption,
    tags: p.tags.join(','),
    rights_note: p.rights_note || '',
  }));
  
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportFacultyToCSV(faculty: FacultyRecord[], filename: string = 'faculty.csv') {
  const csvData = faculty.map(f => ({
    id: f.id,
    full_name: f.full_name,
    title: f.title,
    department: f.department || '',
    email: f.email,
    phone: f.phone || '',
    headshot_path: f.headshot_path || '',
    bio_snippet: f.bio_snippet || '',
    sort_key: f.sort_key,
  }));
  
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export async function exportCompleteDatabase(
  alumni: AlumniRecord[],
  publications: PublicationRecord[],
  photos: PhotoRecord[],
  faculty: FacultyRecord[]
) {
  const zip = new JSZip();
  const exportDate = new Date().toISOString();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  // Generate CSVs
  const alumniCSV = Papa.unparse(alumni.map(a => ({
    id: a.id,
    first_name: a.first_name,
    middle_name: a.middle_name || '',
    last_name: a.last_name,
    full_name: a.full_name,
    class_role: a.class_role || '',
    grad_year: a.grad_year,
    grad_date: a.grad_date,
    photo_file: a.photo_file || '',
    composite_image_path: a.composite_image_path,
    portrait_path: a.portrait_path || '',
    sort_key: a.sort_key,
    decade: a.decade,
    tags: a.tags.join(','),
  })));

  const publicationsCSV = Papa.unparse(publications.map(p => ({
    id: p.id,
    title: p.title,
    pub_name: p.pub_name,
    issue_date: p.issue_date,
    volume_issue: p.volume_issue || '',
    pdf_path: p.pdf_path,
    thumb_path: p.thumb_path,
    description: p.description || '',
    tags: p.tags.join(','),
    page_count: p.page_count || '',
    year: p.year,
    decade: p.decade,
  })));

  const photosCSV = Papa.unparse(photos.map(p => ({
    id: p.id,
    collection: p.collection,
    title: p.title,
    year_or_decade: p.year_or_decade,
    image_path: p.image_path,
    caption: p.caption,
    tags: p.tags.join(','),
    rights_note: p.rights_note || '',
  })));

  const facultyCSV = Papa.unparse(faculty.map(f => ({
    id: f.id,
    full_name: f.full_name,
    title: f.title,
    department: f.department || '',
    email: f.email,
    phone: f.phone || '',
    headshot_path: f.headshot_path || '',
    bio_snippet: f.bio_snippet || '',
    sort_key: f.sort_key,
  })));

  // Create README
  const readme = `MC MUSEUM KIOSK - DATABASE EXPORT
================================
Export Date: ${new Date(exportDate).toLocaleString()}
Export Version: 1.0

CONTENTS:
- alumni.csv (${alumni.length} records)
- publications.csv (${publications.length} records)
- photos.csv (${photos.length} records)
- faculty.csv (${faculty.length} records)

DATA STRUCTURE:

ALUMNI.CSV Fields:
- id: Unique identifier
- first_name, middle_name, last_name, full_name: Name fields
- class_role: Role in graduating class (e.g., Valedictorian)
- grad_year, grad_date: Graduation information
- photo_file: Original photo filename
- composite_image_path: Path to class composite image
- portrait_path: Path to individual portrait
- sort_key: Sorting identifier
- decade: Graduation decade
- tags: Comma-separated tags

PUBLICATIONS.CSV Fields:
- id: Unique identifier
- title: Publication title
- pub_name: Publication name (e.g., Amicus, Law Review)
- issue_date: Publication date
- volume_issue: Volume and issue number
- pdf_path: Path to PDF file
- thumb_path: Path to thumbnail image
- description: Publication description
- tags: Comma-separated tags
- page_count: Number of pages
- year, decade: Temporal information

PHOTOS.CSV Fields:
- id: Unique identifier
- collection: Photo collection name
- title: Photo title
- year_or_decade: Temporal information
- image_path: Path to image file
- caption: Photo caption
- tags: Comma-separated tags
- rights_note: Copyright/usage information

FACULTY.CSV Fields:
- id: Unique identifier
- full_name: Faculty member name
- title: Academic/professional title
- department: Department affiliation
- email: Contact email
- phone: Contact phone
- headshot_path: Path to headshot image
- bio_snippet: Short biography
- sort_key: Sorting identifier

NOTES:
- All dates in ISO 8601 format (YYYY-MM-DD)
- Tags are comma-separated within their fields
- Image paths are relative to public directory
- Empty fields represented as blank strings
`;

  // Create manifest
  const manifest = {
    export_date: exportDate,
    version: "1.0",
    counts: {
      alumni: alumni.length,
      publications: publications.length,
      photos: photos.length,
      faculty: faculty.length,
      total: alumni.length + publications.length + photos.length + faculty.length
    },
    files: [
      "alumni.csv",
      "publications.csv",
      "photos.csv",
      "faculty.csv",
      "README.txt",
      "export-manifest.json"
    ]
  };

  // Add files to ZIP
  zip.file("alumni.csv", alumniCSV);
  zip.file("publications.csv", publicationsCSV);
  zip.file("photos.csv", photosCSV);
  zip.file("faculty.csv", facultyCSV);
  zip.file("README.txt", readme);
  zip.file("export-manifest.json", JSON.stringify(manifest, null, 2));

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `mc-museum-database-${timestamp}.zip`;
  link.click();

  return manifest.counts;
}
