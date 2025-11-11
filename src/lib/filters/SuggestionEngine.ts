/**
 * Suggestion Engine for Smart Search
 * 
 * Generates intelligent search suggestions based on:
 * - Search history
 * - Popular searches
 * - Field-specific suggestions
 * - Relevance ranking
 */

import { FilterConfig } from './types';

export type SuggestionType = 'recent' | 'popular' | 'category' | 'smart';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  text: string;
  category?: string;
  resultCount?: number;
  icon?: string;
  relevance: number;
}

export interface HistoryEntry {
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: FilterConfig;
}

export interface SuggestionEngineOptions {
  maxSuggestions?: number;
  maxHistorySize?: number;
  popularThreshold?: number;
  enableLogging?: boolean;
}

export class SuggestionEngine {
  private searchHistory: HistoryEntry[] = [];
  private popularSearches: Map<string, number> = new Map();
  private maxSuggestions: number;
  private maxHistorySize: number;
  private popularThreshold: number;
  private enableLogging: boolean;
  private storageKey: string = 'filter-search-history';

  constructor(options: SuggestionEngineOptions = {}) {
    this.maxSuggestions = options.maxSuggestions || 10;
    this.maxHistorySize = options.maxHistorySize || 100;
    this.popularThreshold = options.popularThreshold || 3;
    this.enableLogging = options.enableLogging || false;

    // Load history from storage
    this.loadHistory();
  }

  /**
   * Generate suggestions based on input query
   */
  async generateSuggestions(
    input: string,
    context?: FilterConfig
  ): Promise<Suggestion[]> {
    const startTime = performance.now();
    const normalizedInput = input.toLowerCase().trim();

    if (normalizedInput.length === 0) {
      return this.getDefaultSuggestions();
    }

    const suggestions: Suggestion[] = [];

    // Get recent search suggestions
    const recentSuggestions = this.getRecentSuggestions(normalizedInput);
    suggestions.push(...recentSuggestions);

    // Get popular search suggestions
    const popularSuggestions = this.getPopularSuggestions(normalizedInput);
    suggestions.push(...popularSuggestions);

    // Get category-based suggestions
    if (context) {
      const categorySuggestions = this.getCategorySuggestions(normalizedInput, context);
      suggestions.push(...categorySuggestions);
    }

    // Get smart suggestions (field-specific)
    const smartSuggestions = this.getSmartSuggestions(normalizedInput, context);
    suggestions.push(...smartSuggestions);

    // Rank and deduplicate suggestions
    const rankedSuggestions = this.rankSuggestions(suggestions);
    const uniqueSuggestions = this.deduplicateSuggestions(rankedSuggestions);
    const finalSuggestions = uniqueSuggestions.slice(0, this.maxSuggestions);

    const endTime = performance.now();
    this.log(`Generated ${finalSuggestions.length} suggestions in ${(endTime - startTime).toFixed(2)}ms`);

    return finalSuggestions;
  }

  /**
   * Record a search in history
   */
  recordSearch(query: string, resultCount: number, filters?: FilterConfig): void {
    const entry: HistoryEntry = {
      query: query.trim(),
      timestamp: new Date(),
      resultCount,
      filters
    };

    // Add to history
    this.searchHistory.unshift(entry);

    // Trim history to max size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }

    // Update popular searches count
    const normalizedQuery = query.toLowerCase().trim();
    const currentCount = this.popularSearches.get(normalizedQuery) || 0;
    this.popularSearches.set(normalizedQuery, currentCount + 1);

    // Save to storage
    this.saveHistory();

    this.log(`Recorded search: "${query}" with ${resultCount} results`);
  }

  /**
   * Learn from user selection to improve future suggestions
   */
  learnFromSelection(suggestion: Suggestion): void {
    // Boost the relevance of selected suggestions
    const normalizedText = suggestion.text.toLowerCase().trim();
    const currentCount = this.popularSearches.get(normalizedText) || 0;
    this.popularSearches.set(normalizedText, currentCount + 1);

    this.log(`Learned from selection: "${suggestion.text}"`);
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
    this.popularSearches.clear();
    this.saveHistory();
    this.log('Cleared search history');
  }

  /**
   * Get search history
   */
  getHistory(): HistoryEntry[] {
    return [...this.searchHistory];
  }

  /**
   * Get popular searches
   */
  getPopularSearchTerms(limit: number = 10): Array<{ term: string; count: number }> {
    return Array.from(this.popularSearches.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Private methods

  private getDefaultSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Get most recent searches
    const recentSearches = this.searchHistory
      .slice(0, 5)
      .map((entry, index) => ({
        id: `recent-${index}`,
        type: 'recent' as SuggestionType,
        text: entry.query,
        resultCount: entry.resultCount,
        icon: '🕐',
        relevance: 1.0 - (index * 0.1)
      }));

    suggestions.push(...recentSearches);

    // Get most popular searches
    const popularSearches = this.getPopularSearchTerms(5)
      .map((item, index) => ({
        id: `popular-${index}`,
        type: 'popular' as SuggestionType,
        text: item.term,
        icon: '🔥',
        relevance: 0.8 - (index * 0.1)
      }));

    suggestions.push(...popularSearches);

    return suggestions.slice(0, this.maxSuggestions);
  }

  private getRecentSuggestions(input: string): Suggestion[] {
    return this.searchHistory
      .filter(entry => {
        const query = entry.query.toLowerCase();
        return query.includes(input) || input.includes(query);
      })
      .slice(0, 3)
      .map((entry, index) => ({
        id: `recent-${entry.query}-${index}`,
        type: 'recent' as SuggestionType,
        text: entry.query,
        resultCount: entry.resultCount,
        icon: '🕐',
        relevance: this.calculateRelevance(input, entry.query, 1.0 - (index * 0.1))
      }));
  }

  private getPopularSuggestions(input: string): Suggestion[] {
    const popularTerms = Array.from(this.popularSearches.entries())
      .filter(([term, count]) => {
        return count >= this.popularThreshold && term.includes(input);
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([term, count], index) => ({
        id: `popular-${term}-${index}`,
        type: 'popular' as SuggestionType,
        text: term,
        icon: '🔥',
        relevance: this.calculateRelevance(input, term, 0.9 - (index * 0.1))
      }));

    return popularTerms;
  }

  private getCategorySuggestions(input: string, context: FilterConfig): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const contentType = context.type;

    // Define category-specific suggestions based on content type
    const categoryTerms: Record<string, string[]> = {
      alumni: ['name', 'year', 'degree', 'location', 'employer'],
      publication: ['title', 'author', 'year', 'journal', 'topic'],
      photo: ['year', 'event', 'location', 'people'],
      faculty: ['name', 'department', 'specialty', 'courses']
    };

    const terms = categoryTerms[contentType] || [];
    const matchingTerms = terms.filter(term => term.includes(input));

    matchingTerms.forEach((term, index) => {
      suggestions.push({
        id: `category-${term}-${index}`,
        type: 'category' as SuggestionType,
        text: term,
        category: contentType,
        icon: '📁',
        relevance: 0.7 - (index * 0.1)
      });
    });

    return suggestions;
  }

  private getSmartSuggestions(input: string, context?: FilterConfig): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Common search patterns
    const patterns = [
      { pattern: /^\d{4}$/, suggestion: `${input} graduates`, type: 'year' },
      { pattern: /^[A-Z][a-z]+$/, suggestion: `${input} (name search)`, type: 'name' },
      { pattern: /\b(law|legal|court)\b/i, suggestion: `${input} publications`, type: 'legal' }
    ];

    patterns.forEach((pattern, index) => {
      if (pattern.pattern.test(input)) {
        suggestions.push({
          id: `smart-${pattern.type}-${index}`,
          type: 'smart' as SuggestionType,
          text: pattern.suggestion,
          icon: '💡',
          relevance: 0.6
        });
      }
    });

    return suggestions;
  }

  private rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
    return suggestions.sort((a, b) => {
      // Sort by relevance (descending)
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }

      // Then by type priority
      const typePriority: Record<SuggestionType, number> = {
        recent: 4,
        popular: 3,
        smart: 2,
        category: 1
      };

      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;

      return bPriority - aPriority;
    });
  }

  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateRelevance(input: string, text: string, baseRelevance: number): number {
    const normalizedInput = input.toLowerCase();
    const normalizedText = text.toLowerCase();

    // Exact match
    if (normalizedText === normalizedInput) {
      return baseRelevance * 1.5;
    }

    // Starts with input
    if (normalizedText.startsWith(normalizedInput)) {
      return baseRelevance * 1.3;
    }

    // Contains input
    if (normalizedText.includes(normalizedInput)) {
      return baseRelevance * 1.1;
    }

    // Calculate similarity score (simple Levenshtein-like)
    const similarity = this.calculateSimilarity(normalizedInput, normalizedText);
    return baseRelevance * (0.5 + similarity * 0.5);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore history with Date objects
        this.searchHistory = data.history?.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })) || [];

        // Restore popular searches
        this.popularSearches = new Map(data.popular || []);

        this.log(`Loaded ${this.searchHistory.length} history entries`);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  private saveHistory(): void {
    try {
      const data = {
        history: this.searchHistory.slice(0, this.maxHistorySize),
        popular: Array.from(this.popularSearches.entries())
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  private log(...args: any[]): void {
    if (this.enableLogging) {
      console.log('[SuggestionEngine]', ...args);
    }
  }
}

/**
 * Singleton instance for global suggestion engine
 */
export class GlobalSuggestionEngine extends SuggestionEngine {
  private static instance: GlobalSuggestionEngine;

  private constructor() {
    super({
      maxSuggestions: 10,
      maxHistorySize: 100,
      popularThreshold: 3,
      enableLogging: false
    });
  }

  static getInstance(): GlobalSuggestionEngine {
    if (!GlobalSuggestionEngine.instance) {
      GlobalSuggestionEngine.instance = new GlobalSuggestionEngine();
    }
    return GlobalSuggestionEngine.instance;
  }
}

export default SuggestionEngine;
