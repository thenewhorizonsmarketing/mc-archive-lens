import { AlumniRecord } from "@/types";
import { getBaseFilename, getFileExtension, generateStandardFilename } from "./fileNaming";

export interface PhotoMatch {
  id: string;
  photoFile: File;
  originalFilename: string;
  matchedAlumni: AlumniRecord | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestedFilename: string;
  previewUrl: string;
  sequenceNumber: number;
}

/**
 * Parses a name from a filename
 * Examples: "Carmen_Castilla.jpg" → { firstName: "Carmen", lastName: "Castilla" }
 */
export function parseNameFromFilename(filename: string): { firstName?: string; lastName?: string } {
  const baseName = getBaseFilename(filename);
  
  // Remove common separators and extract name parts
  const cleaned = baseName
    .replace(/['"]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split by space and take first two parts as first/last name
  const parts = cleaned.split(' ').filter(p => p.length > 0);
  
  if (parts.length >= 2) {
    return {
      firstName: parts[0],
      lastName: parts[parts.length - 1]
    };
  } else if (parts.length === 1) {
    return { lastName: parts[0] };
  }
  
  return {};
}

/**
 * Calculates string similarity using simple approach (Levenshtein-like)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap check
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matches = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w2 === w1 || w2.includes(w1) || w1.includes(w2))) {
      matches++;
    }
  });
  
  return matches / Math.max(words1.length, words2.length);
}

/**
 * Finds the best matching alumni record for a given photo filename
 */
export function findBestMatch(
  photoFilename: string,
  alumni: AlumniRecord[]
): { match: AlumniRecord | null; confidence: number } {
  const parsed = parseNameFromFilename(photoFilename);
  
  if (!parsed.firstName && !parsed.lastName) {
    return { match: null, confidence: 0 };
  }
  
  let bestMatch: AlumniRecord | null = null;
  let bestScore = 0;
  
  const searchName = [parsed.firstName, parsed.lastName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  for (const alumnus of alumni) {
    const fullName = alumnus.full_name.toLowerCase();
    const score = calculateSimilarity(searchName, fullName);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = alumnus;
    }
  }
  
  return { match: bestMatch, confidence: bestScore };
}

/**
 * Determines confidence level from similarity score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.3) return 'low';
  return 'none';
}

/**
 * Matches uploaded photos to alumni records and generates standardized filenames
 */
export function matchPhotosToAlumni(
  files: File[],
  alumni: AlumniRecord[]
): PhotoMatch[] {
  const matches: PhotoMatch[] = [];
  
  // Sort alumni by grad_year and full_name for sequence numbering
  const sortedAlumni = [...alumni].sort((a, b) => {
    if (a.grad_year !== b.grad_year) {
      return a.grad_year - b.grad_year;
    }
    return a.full_name.localeCompare(b.full_name);
  });
  
  files.forEach((file, index) => {
    const { match, confidence: score } = findBestMatch(file.name, alumni);
    const confidence = getConfidenceLevel(score);
    
    // Generate sequence number based on matched alumni's position
    let sequenceNumber = index + 1;
    if (match) {
      const alumniIndex = sortedAlumni.findIndex(a => a.id === match.id);
      sequenceNumber = alumniIndex + 1;
    }
    
    const extension = getFileExtension(file.name);
    
    // Generate suggested filename
    let suggestedFilename = file.name;
    if (match) {
      const nameParts = match.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      suggestedFilename = generateStandardFilename({
        sequenceNumber,
        firstName,
        lastName,
        role: match.class_role,
        extension
      });
    }
    
    matches.push({
      id: `photo-${Date.now()}-${index}`,
      photoFile: file,
      originalFilename: file.name,
      matchedAlumni: match,
      confidence,
      suggestedFilename,
      previewUrl: URL.createObjectURL(file),
      sequenceNumber
    });
  });
  
  return matches;
}

/**
 * Updates alumni records with new photo filenames
 */
export function updateAlumniWithPhotos(
  alumni: AlumniRecord[],
  photoMatches: PhotoMatch[]
): AlumniRecord[] {
  const updatedAlumni = [...alumni];
  
  photoMatches.forEach(match => {
    if (match.matchedAlumni) {
      const index = updatedAlumni.findIndex(a => a.id === match.matchedAlumni!.id);
      if (index !== -1) {
        updatedAlumni[index] = {
          ...updatedAlumni[index],
          photo_file: match.suggestedFilename,
          composite_image_path: `/photos/${updatedAlumni[index].grad_year}/${match.suggestedFilename}`
        };
      }
    }
  });
  
  return updatedAlumni;
}
