// Fuzzy Search Implementation for Enhanced Search Features
export class FuzzySearchEngine {
  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity score (0-1) based on Levenshtein distance
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  /**
   * Check if two strings are fuzzy matches based on threshold
   */
  static isFuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    return this.calculateSimilarity(str1, str2) >= threshold;
  }

  /**
   * Find fuzzy matches in an array of strings
   */
  static findFuzzyMatches(query: string, candidates: string[], threshold: number = 0.8): Array<{
    text: string;
    similarity: number;
  }> {
    return candidates
      .map(candidate => ({
        text: candidate,
        similarity: this.calculateSimilarity(query, candidate)
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Generate phonetic representation using simple Soundex-like algorithm
   */
  static generatePhoneticCode(str: string): string {
    if (!str) return '';
    
    const normalized = str.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.length === 0) return '';

    let code = normalized[0];
    
    // Simple phonetic mapping
    const phoneticMap: { [key: string]: string } = {
      'b': '1', 'f': '1', 'p': '1', 'v': '1',
      'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
      'd': '3', 't': '3',
      'l': '4',
      'm': '5', 'n': '5',
      'r': '6'
    };

    for (let i = 1; i < normalized.length; i++) {
      const char = normalized[i];
      const phoneticValue = phoneticMap[char] || '0';
      
      if (phoneticValue !== '0' && phoneticValue !== code[code.length - 1]) {
        code += phoneticValue;
      }
    }

    // Pad or truncate to 4 characters
    return (code + '0000').substring(0, 4);
  }

  /**
   * Check if two strings have similar phonetic representation
   */
  static isPhoneticMatch(str1: string, str2: string): boolean {
    const code1 = this.generatePhoneticCode(str1);
    const code2 = this.generatePhoneticCode(str2);
    return code1 === code2;
  }

  /**
   * Advanced fuzzy search with multiple matching strategies
   */
  static advancedFuzzySearch(
    query: string, 
    candidates: Array<{ text: string; metadata?: any }>,
    options: {
      threshold?: number;
      usePhonetic?: boolean;
      useStemming?: boolean;
      weightByLength?: boolean;
    } = {}
  ): Array<{
    text: string;
    similarity: number;
    matchType: 'exact' | 'fuzzy' | 'phonetic' | 'stemmed';
    metadata?: any;
  }> {
    const {
      threshold = 0.7,
      usePhonetic = true,
      useStemming = true,
      weightByLength = true
    } = options;

    const results: Array<{
      text: string;
      similarity: number;
      matchType: 'exact' | 'fuzzy' | 'phonetic' | 'stemmed';
      metadata?: any;
    }> = [];

    for (const candidate of candidates) {
      const candidateText = candidate.text;
      let bestSimilarity = 0;
      let matchType: 'exact' | 'fuzzy' | 'phonetic' | 'stemmed' = 'fuzzy';

      // Exact match
      if (query.toLowerCase() === candidateText.toLowerCase()) {
        bestSimilarity = 1.0;
        matchType = 'exact';
      }
      // Fuzzy match
      else {
        const fuzzySimilarity = this.calculateSimilarity(query, candidateText);
        if (fuzzySimilarity > bestSimilarity) {
          bestSimilarity = fuzzySimilarity;
          matchType = 'fuzzy';
        }

        // Phonetic match
        if (usePhonetic && this.isPhoneticMatch(query, candidateText)) {
          const phoneticSimilarity = Math.max(fuzzySimilarity, 0.8);
          if (phoneticSimilarity > bestSimilarity) {
            bestSimilarity = phoneticSimilarity;
            matchType = 'phonetic';
          }
        }

        // Stemming match (simple implementation)
        if (useStemming) {
          const stemmedQuery = this.simpleStem(query);
          const stemmedCandidate = this.simpleStem(candidateText);
          const stemmedSimilarity = this.calculateSimilarity(stemmedQuery, stemmedCandidate);
          if (stemmedSimilarity > bestSimilarity) {
            bestSimilarity = stemmedSimilarity;
            matchType = 'stemmed';
          }
        }
      }

      // Apply length weighting
      if (weightByLength && bestSimilarity > 0) {
        const lengthDiff = Math.abs(query.length - candidateText.length);
        const lengthPenalty = lengthDiff / Math.max(query.length, candidateText.length);
        bestSimilarity *= (1 - lengthPenalty * 0.1);
      }

      if (bestSimilarity >= threshold) {
        results.push({
          text: candidateText,
          similarity: bestSimilarity,
          matchType,
          metadata: candidate.metadata
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Simple stemming implementation (removes common suffixes)
   */
  private static simpleStem(word: string): string {
    const normalized = word.toLowerCase().trim();
    
    // Common English suffixes to remove
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ion', 'tion', 'ness', 'ment', 's'];
    
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
        return normalized.slice(0, -suffix.length);
      }
    }
    
    return normalized;
  }
}

export default FuzzySearchEngine;