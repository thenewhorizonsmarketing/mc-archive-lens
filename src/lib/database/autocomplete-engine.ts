// Intelligent Auto-complete Engine with Stemming and Context Awareness
import { DatabaseManager } from './manager';
import { FuzzySearchEngine } from './fuzzy-search';

export interface AutocompleteOptions {
  limit?: number;
  minLength?: number;
  fuzzyThreshold?: number;
  includePhonetic?: boolean;
  includeStemmed?: boolean;
  contextWeight?: number;
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'exact' | 'fuzzy' | 'phonetic' | 'stemmed' | 'contextual';
  confidence: number;
  frequency?: number;
  category?: 'name' | 'title' | 'department' | 'publication' | 'tag';
  metadata?: any;
}

export class AutocompleteEngine {
  private dbManager: DatabaseManager;
  private suggestionCache: Map<string, AutocompleteSuggestion[]> = new Map();
  private popularTerms: Map<string, number> = new Map();
  private contextHistory: string[] = [];

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.initializePopularTerms();
  }

  /**
   * Initialize popular terms from database
   */
  private async initializePopularTerms(): Promise<void> {
    try {
      // Get popular names from alumni
      const alumniNames = await this.dbManager.executeQuery(`
        SELECT full_name, COUNT(*) as frequency 
        FROM alumni 
        GROUP BY full_name 
        ORDER BY frequency DESC 
        LIMIT 100
      `) as Array<{ full_name: string; frequency: number }>;

      alumniNames.forEach(({ full_name, frequency }) => {
        this.popularTerms.set(full_name.toLowerCase(), frequency);
        // Also add individual words
        full_name.split(' ').forEach(word => {
          if (word.length > 2) {
            const current = this.popularTerms.get(word.toLowerCase()) || 0;
            this.popularTerms.set(word.toLowerCase(), current + frequency);
          }
        });
      });

      // Get popular publication terms
      const pubTerms = await this.dbManager.executeQuery(`
        SELECT title, pub_name 
        FROM publications 
        LIMIT 200
      `) as Array<{ title: string; pub_name: string }>;

      pubTerms.forEach(({ title, pub_name }) => {
        [title, pub_name].forEach(term => {
          if (term) {
            const words = term.toLowerCase().split(/\s+/);
            words.forEach(word => {
              if (word.length > 2) {
                const current = this.popularTerms.get(word) || 0;
                this.popularTerms.set(word, current + 1);
              }
            });
          }
        });
      });

    } catch (error) {
      console.warn('Failed to initialize popular terms:', error);
    }
  }

  /**
   * Generate intelligent autocomplete suggestions
   */
  async getSuggestions(
    query: string, 
    options: AutocompleteOptions = {}
  ): Promise<AutocompleteSuggestion[]> {
    const {
      limit = 10,
      minLength = 2,
      fuzzyThreshold = 0.7,
      includePhonetic = true,
      includeStemmed = true,
      contextWeight = 0.2
    } = options;

    if (query.length < minLength) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `${normalizedQuery}:${JSON.stringify(options)}`;
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const suggestions: AutocompleteSuggestion[] = [];

    try {
      // Get exact matches from database
      await this.addExactMatches(normalizedQuery, suggestions);
      
      // Get fuzzy matches
      if (suggestions.length < limit) {
        await this.addFuzzyMatches(normalizedQuery, suggestions, fuzzyThreshold);
      }

      // Get phonetic matches
      if (includePhonetic && suggestions.length < limit) {
        await this.addPhoneticMatches(normalizedQuery, suggestions);
      }

      // Get stemmed matches
      if (includeStemmed && suggestions.length < limit) {
        await this.addStemmedMatches(normalizedQuery, suggestions);
      }

      // Add contextual suggestions
      if (suggestions.length < limit) {
        this.addContextualSuggestions(normalizedQuery, suggestions, contextWeight);
      }

      // Sort by confidence and limit results
      const finalSuggestions = suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

      // Cache results
      this.suggestionCache.set(cacheKey, finalSuggestions);
      
      // Update context history
      this.updateContextHistory(normalizedQuery);

      return finalSuggestions;

    } catch (error) {
      console.error('Autocomplete generation failed:', error);
      return [];
    }
  }

  /**
   * Add exact matches from database
   */
  private async addExactMatches(query: string, suggestions: AutocompleteSuggestion[]): Promise<void> {
    const queries = [
      // Alumni names
      `SELECT DISTINCT full_name as text, 'name' as category 
       FROM alumni 
       WHERE LOWER(full_name) LIKE ? 
       ORDER BY full_name 
       LIMIT 5`,
      
      // Publication titles
      `SELECT DISTINCT title as text, 'publication' as category 
       FROM publications 
       WHERE LOWER(title) LIKE ? 
       ORDER BY title 
       LIMIT 5`,
      
      // Departments
      `SELECT DISTINCT department as text, 'department' as category 
       FROM faculty 
       WHERE LOWER(department) LIKE ? 
       ORDER BY department 
       LIMIT 3`,
      
      // Tags
      `SELECT DISTINCT tags as text, 'tag' as category 
       FROM alumni 
       WHERE LOWER(tags) LIKE ? AND tags IS NOT NULL 
       ORDER BY tags 
       LIMIT 3`
    ];

    const pattern = `${query}%`;

    for (const sql of queries) {
      try {
        const results = await this.dbManager.executeQuery(sql, [pattern]) as Array<{
          text: string;
          category: string;
        }>;

        results.forEach(result => {
          if (result.text && !suggestions.find(s => s.text.toLowerCase() === result.text.toLowerCase())) {
            const frequency = this.popularTerms.get(result.text.toLowerCase()) || 1;
            suggestions.push({
              text: result.text,
              type: 'exact',
              confidence: 0.9 + (frequency / 1000), // Boost popular terms
              frequency,
              category: result.category as any,
            });
          }
        });
      } catch (error) {
        console.warn('Exact match query failed:', error);
      }
    }
  }

  /**
   * Add fuzzy matches using Levenshtein distance
   */
  private async addFuzzyMatches(
    query: string, 
    suggestions: AutocompleteSuggestion[], 
    threshold: number
  ): Promise<void> {
    // Get a broader set of candidates for fuzzy matching
    const candidates: Array<{ text: string; category: string }> = [];

    try {
      // Get alumni names
      const alumni = await this.dbManager.executeQuery(`
        SELECT full_name as text, 'name' as category 
        FROM alumni 
        WHERE LENGTH(full_name) BETWEEN ? AND ?
        LIMIT 100
      `, [query.length - 3, query.length + 10]) as Array<{ text: string; category: string }>;

      candidates.push(...alumni);

      // Perform fuzzy matching
      const fuzzyMatches = FuzzySearchEngine.advancedFuzzySearch(
        query,
        candidates,
        { threshold, usePhonetic: false, useStemming: false }
      );

      fuzzyMatches.forEach(match => {
        if (!suggestions.find(s => s.text.toLowerCase() === match.text.toLowerCase())) {
          const frequency = this.popularTerms.get(match.text.toLowerCase()) || 1;
          suggestions.push({
            text: match.text,
            type: match.matchType as any,
            confidence: match.similarity * 0.8, // Slightly lower than exact matches
            frequency,
            category: 'name',
          });
        }
      });

    } catch (error) {
      console.warn('Fuzzy matching failed:', error);
    }
  }

  /**
   * Add phonetic matches for names
   */
  private async addPhoneticMatches(query: string, suggestions: AutocompleteSuggestion[]): Promise<void> {
    try {
      const queryPhonetic = FuzzySearchEngine.generatePhoneticCode(query);
      
      // Get names that might sound similar
      const candidates = await this.dbManager.executeQuery(`
        SELECT DISTINCT full_name as text 
        FROM alumni 
        WHERE LENGTH(full_name) BETWEEN ? AND ?
        LIMIT 50
      `, [query.length - 2, query.length + 5]) as Array<{ text: string }>;

      candidates.forEach(candidate => {
        if (FuzzySearchEngine.isPhoneticMatch(query, candidate.text)) {
          if (!suggestions.find(s => s.text.toLowerCase() === candidate.text.toLowerCase())) {
            const frequency = this.popularTerms.get(candidate.text.toLowerCase()) || 1;
            suggestions.push({
              text: candidate.text,
              type: 'phonetic',
              confidence: 0.7,
              frequency,
              category: 'name',
            });
          }
        }
      });

    } catch (error) {
      console.warn('Phonetic matching failed:', error);
    }
  }

  /**
   * Add stemmed matches
   */
  private async addStemmedMatches(query: string, suggestions: AutocompleteSuggestion[]): Promise<void> {
    const stemmedQuery = this.simpleStem(query);
    if (stemmedQuery === query) return; // No stemming occurred

    try {
      // Search for terms that match the stemmed version
      const pattern = `%${stemmedQuery}%`;
      const results = await this.dbManager.executeQuery(`
        SELECT DISTINCT title as text, 'publication' as category 
        FROM publications 
        WHERE LOWER(title) LIKE ? 
        LIMIT 5
      `, [pattern]) as Array<{ text: string; category: string }>;

      results.forEach(result => {
        if (!suggestions.find(s => s.text.toLowerCase() === result.text.toLowerCase())) {
          suggestions.push({
            text: result.text,
            type: 'stemmed',
            confidence: 0.6,
            category: result.category as any,
          });
        }
      });

    } catch (error) {
      console.warn('Stemmed matching failed:', error);
    }
  }

  /**
   * Add contextual suggestions based on search history
   */
  private addContextualSuggestions(
    query: string, 
    suggestions: AutocompleteSuggestion[], 
    contextWeight: number
  ): void {
    // Find related terms from context history
    const relatedTerms = this.contextHistory
      .filter(term => term !== query && term.includes(query))
      .slice(0, 3);

    relatedTerms.forEach(term => {
      if (!suggestions.find(s => s.text.toLowerCase() === term.toLowerCase())) {
        suggestions.push({
          text: term,
          type: 'contextual',
          confidence: 0.5 + contextWeight,
          category: 'name', // Default category
        });
      }
    });
  }

  /**
   * Update context history for better suggestions
   */
  private updateContextHistory(query: string): void {
    this.contextHistory.unshift(query);
    if (this.contextHistory.length > 20) {
      this.contextHistory.pop();
    }
  }

  /**
   * Simple stemming implementation
   */
  private simpleStem(word: string): string {
    const normalized = word.toLowerCase().trim();
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ion', 'tion', 'ness', 'ment', 's'];
    
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
        return normalized.slice(0, -suffix.length);
      }
    }
    
    return normalized;
  }

  /**
   * Clear suggestion cache
   */
  clearCache(): void {
    this.suggestionCache.clear();
  }

  /**
   * Get popular terms for debugging
   */
  getPopularTerms(): Map<string, number> {
    return new Map(this.popularTerms);
  }
}

export default AutocompleteEngine;