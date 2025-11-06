import { parseAlumniCSVFromURL } from './csvParser';
import { AlumniRecord } from '@/types';

// Load default sample CSV from public folder
export async function loadDefaultAlumniCSV(): Promise<AlumniRecord[]> {
  try {
    const alumni = await parseAlumniCSVFromURL('/sample-alumni.csv');
    return alumni;
  } catch (error) {
    console.error('Failed to load default CSV:', error);
    throw error;
  }
}
