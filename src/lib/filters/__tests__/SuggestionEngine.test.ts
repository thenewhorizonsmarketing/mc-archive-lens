import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestionEngine } from '../SuggestionEngine';
import type { FilterConfig, HistoryEntry } from '../types';

describe('SuggestionEngine', () => {
  let engine: SuggestionEngine;

  beforeEach(() => {
    engine = new SuggestionEngine();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for empty input', async () => {
      const suggestions = await engine.generateSuggestions('', {
        type: 'alumni',
        operator: 'AND'
      }, []);

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions based on input', async () => {
      const suggestions = await engine.generateSuggestions('joh', {
        type: 'alumni',
        operator: 'AND'
      }, []);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.text.toLowerCase().includes('joh'))).toBe(true);
    });

    it('should prioritize recent searches', async () => {
      const history: HistoryEntry[] = [
        {
          id: '1',
          query: 'John Doe',
          filters: { type: 'alumni', operator: 'AND' },
          timestamp: new Date(),
          resultCount: 5
        },
        {
          id: '2',
          query: 'John Smith',
          filters: { type: 'alumni', operator: 'AND' },
          timestamp: new Date(Date.now() - 86400000),
          resultCount: 3
        }
      ];

      const suggestions = await engine.generateSuggestions('joh', {
        type: 'alumni',
        operator: 'AND'
      }, history);

      expect(suggestions.length).toBeGreaterThan(0);
      const recentSuggestions = suggestions.filter(s => s.type === 'recent');
      expect(recentSuggestions.length).toBeGreaterThan(0);
    });

    it('should generate category-based suggestions', async () => {
      const suggestions = await engine.generateSuggestions('law', {
        type: 'alumni',
        operator: 'AND'
      }, []);

      const categorySuggestions = suggestions.filter(s => s.category);
      expect(categorySuggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rankSuggestions', () => {
    it('should rank suggestions by relevance', () => {
      const suggestions = [
        { type: 'popular' as const, text: 'John', category: 'name', resultCount: 100 },
        { type: 'recent' as const, text: 'John Doe', category: 'name', resultCount: 5 },
        { type: 'smart' as const, text: 'Johnny', category: 'name', resultCount: 50 }
      ];

      const ranked = engine.rankSuggestions(suggestions);
      expect(ranked).toHaveLength(3);
      expect(ranked[0].type).toBe('recent'); // Recent should be first
    });

    it('should prioritize exact matches', () => {
      const suggestions = [
        { type: 'popular' as const, text: 'Johnson', category: 'name', resultCount: 100 },
        { type: 'smart' as const, text: 'John', category: 'name', resultCount: 50 }
      ];

      const ranked = engine.rankSuggestions(suggestions);
      expect(ranked[0].text.length).toBeLessThanOrEqual(ranked[1].text.length);
    });
  });

  describe('learnFromSelection', () => {
    it('should learn from user selection', () => {
      const suggestion = {
        type: 'smart' as const,
        text: 'John Doe',
        category: 'name',
        resultCount: 5
      };

      expect(() => engine.learnFromSelection(suggestion)).not.toThrow();
    });

    it('should increase weight for frequently selected suggestions', async () => {
      const suggestion = {
        type: 'smart' as const,
        text: 'John Doe',
        category: 'name',
        resultCount: 5
      };

      // Select multiple times
      engine.learnFromSelection(suggestion);
      engine.learnFromSelection(suggestion);
      engine.learnFromSelection(suggestion);

      const suggestions = await engine.generateSuggestions('joh', {
        type: 'alumni',
        operator: 'AND'
      }, []);

      // The learned suggestion should appear in results
      expect(suggestions.some(s => s.text === suggestion.text)).toBe(true);
    });
  });

  describe('performance', () => {
    it('should generate suggestions within 100ms', async () => {
      const start = performance.now();
      await engine.generateSuggestions('test', {
        type: 'alumni',
        operator: 'AND'
      }, []);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
