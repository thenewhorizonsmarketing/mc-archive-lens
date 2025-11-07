// Unit tests for QueryBuilder
import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../query-builder';

describe('QueryBuilder Tests', () => {
  describe('FTS5 Query Building', () => {
    it('should build simple FTS5 query', () => {
      const query = QueryBuilder.buildFTS5Query('john');
      expect(query).toBe('john*');
    });

    it('should build multi-word OR query', () => {
      const query = QueryBuilder.buildFTS5Query('john doe');
      expect(query).toBe('"john" OR "doe"');
    });

    it('should handle phrase searches', () => {
      const query = QueryBuilder.buildFTS5Query('"john doe"');
      expect(query).toBe('"john doe"');
    });

    it('should handle empty queries', () => {
      const query = QueryBuilder.buildFTS5Query('');
      expect(query).toBe('');
    });

    it('should handle whitespace-only queries', () => {
      const query = QueryBuilder.buildFTS5Query('   ');
      expect(query).toBe('');
    });

    it('should sanitize special characters', () => {
      const query = QueryBuilder.buildFTS5Query('john@#$%doe');
      expect(query).toBe('johndoe*'); // Special chars are removed, creating single word
    });

    it('should normalize whitespace', () => {
      const query = QueryBuilder.buildFTS5Query('  john   doe  ');
      expect(query).toBe('"john" OR "doe"');
    });

    it('should handle boolean operators when enabled', () => {
      const query = QueryBuilder.buildFTS5Query('john AND doe', { useBoolean: true });
      expect(query).toBe('john AND doe');
    });

    it('should disable wildcards when requested', () => {
      const query = QueryBuilder.buildFTS5Query('john', { useWildcards: false });
      expect(query).toBe('john');
    });

    it('should handle complex phrase searches', () => {
      const query = QueryBuilder.buildFTS5Query('"legal ethics" AND "constitutional law"');
      expect(query).toBe('"legal ethics" AND "constitutional law"');
    });
  });

  describe('Field-Specific Queries', () => {
    it('should build field-specific query', () => {
      const query = QueryBuilder.buildFieldQuery('john', 'full_name');
      expect(query).toBe('full_name:john*');
    });

    it('should handle empty field queries', () => {
      const query = QueryBuilder.buildFieldQuery('', 'full_name');
      expect(query).toBe('');
    });

    it('should build field query with phrase', () => {
      const query = QueryBuilder.buildFieldQuery('"john doe"', 'full_name');
      expect(query).toBe('full_name:"john doe"');
    });
  });

  describe('Weighted Queries', () => {
    it('should build weighted query', () => {
      const fieldWeights = { full_name: 2, caption: 1 };
      const query = QueryBuilder.buildWeightedQuery('john', fieldWeights);
      expect(query).toBe('(full_name:john*)^2 OR caption:john*');
    });

    it('should handle single weight', () => {
      const fieldWeights = { full_name: 1 };
      const query = QueryBuilder.buildWeightedQuery('john', fieldWeights);
      expect(query).toBe('full_name:john*');
    });

    it('should handle empty weighted query', () => {
      const fieldWeights = { full_name: 2 };
      const query = QueryBuilder.buildWeightedQuery('', fieldWeights);
      expect(query).toBe('');
    });
  });

  describe('Complex Query Building', () => {
    it('should build complex alumni query with year filter', () => {
      const filters = { yearRange: { start: 2020, end: 2023 } };
      const { sql, params } = QueryBuilder.buildComplexQuery('john', 'alumni', filters);

      expect(sql).toContain('alumni_fts MATCH ?');
      expect(sql).toContain('class_year BETWEEN ? AND ?');
      expect(params).toEqual(['john*', 2020, 2023]);
    });

    it('should build complex publications query with type filter', () => {
      const filters = { publicationType: 'Law Review' };
      const { sql, params } = QueryBuilder.buildComplexQuery('ethics', 'publications', filters);

      expect(sql).toContain('publications_fts MATCH ?');
      expect(sql).toContain('pub_name = ?');
      expect(params).toEqual(['ethics*', 'Law Review']);
    });

    it('should build complex photos query with decade filter', () => {
      const filters = { decade: '1960s' };
      const { sql, params } = QueryBuilder.buildComplexQuery('graduation', 'photos', filters);

      expect(sql).toContain('photos_fts MATCH ?');
      expect(sql).toContain('year_or_decade LIKE ?');
      expect(params).toEqual(['graduation*', '%1960s%']);
    });

    it('should build complex faculty query with department filter', () => {
      const filters = { department: 'Constitutional Law' };
      const { sql, params } = QueryBuilder.buildComplexQuery('professor', 'faculty', filters);

      expect(sql).toContain('faculty_fts MATCH ?');
      expect(sql).toContain('department = ?');
      expect(params).toEqual(['professor*', 'Constitutional Law']);
    });

    it('should build query without filters', () => {
      const { sql, params } = QueryBuilder.buildComplexQuery('test', 'alumni');

      expect(sql).toContain('alumni_fts MATCH ?');
      expect(sql).not.toContain('class_year BETWEEN');
      expect(params).toEqual(['test*']);
    });
  });

  describe('Suggestion Queries', () => {
    it('should build suggestion query', () => {
      const { sql, params } = QueryBuilder.buildSuggestionQuery('jo', 'alumni', 'full_name', 5);

      expect(sql).toContain('SELECT DISTINCT full_name as suggestion');
      expect(sql).toContain('FROM alumni');
      expect(sql).toContain('WHERE full_name LIKE ?');
      expect(sql).toContain('LIMIT ?');
      expect(params).toEqual(['jo%', 5]);
    });

    it('should handle different fields', () => {
      const { sql, params } = QueryBuilder.buildSuggestionQuery('law', 'publications', 'title', 3);

      expect(sql).toContain('SELECT DISTINCT title as suggestion');
      expect(sql).toContain('FROM publications');
      expect(params).toEqual(['law%', 3]);
    });
  });

  describe('Facet Queries', () => {
    it('should build facet query', () => {
      const { sql, params } = QueryBuilder.buildFacetQuery('law', 'publications', 'pub_name', 10);

      expect(sql).toContain('SELECT');
      expect(sql).toContain('t.pub_name as facet_value');
      expect(sql).toContain('COUNT(*) as count');
      expect(sql).toContain('publications_fts MATCH ?');
      expect(sql).toContain('GROUP BY t.pub_name');
      expect(sql).toContain('ORDER BY count DESC');
      expect(params).toEqual(['law*', 10]);
    });

    it('should handle different facet fields', () => {
      const { sql, params } = QueryBuilder.buildFacetQuery('student', 'alumni', 'class_year', 5);

      expect(sql).toContain('t.class_year as facet_value');
      expect(sql).toContain('alumni_fts MATCH ?');
      expect(params).toEqual(['student*', 5]);
    });
  });

  describe('Similar Items Queries', () => {
    it('should build similar items query', () => {
      const { sql, params } = QueryBuilder.buildSimilarItemsQuery(123, 'alumni', 5);

      expect(sql).toContain('SELECT');
      expect(sql).toContain('similarity_score');
      expect(sql).toContain('FROM alumni t1');
      expect(sql).toContain('JOIN alumni t2');
      expect(sql).toContain('WHERE t1.id = ?');
      expect(sql).toContain('ORDER BY similarity_score DESC');
      expect(sql).toContain('LIMIT ?');
      expect(params).toEqual([123, 5]);
    });

    it('should handle different tables', () => {
      const { sql, params } = QueryBuilder.buildSimilarItemsQuery(456, 'publications', 3);

      expect(sql).toContain('FROM publications t1');
      expect(sql).toContain('JOIN publications t2');
      expect(params).toEqual([456, 3]);
    });
  });

  describe('Query Validation', () => {
    it('should validate valid queries', () => {
      const result = QueryBuilder.validateQuery('john doe');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should detect empty queries', () => {
      const result = QueryBuilder.validateQuery('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Query cannot be empty');
    });

    it('should detect unmatched quotes', () => {
      const result = QueryBuilder.validateQuery('john "doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unmatched quotes in query');
    });

    it('should detect invalid characters', () => {
      const result = QueryBuilder.validateQuery('john{doe}');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Query contains invalid characters');
    });

    it('should detect malformed boolean expressions', () => {
      const result = QueryBuilder.validateQuery('john AND AND doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Malformed boolean expression');
    });

    it('should allow valid boolean expressions', () => {
      const result = QueryBuilder.validateQuery('john AND doe OR jane');
      expect(result.isValid).toBe(true);
    });

    it('should allow phrase searches', () => {
      const result = QueryBuilder.validateQuery('"john doe" AND "jane smith"');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Query Complexity', () => {
    it('should calculate simple query complexity', () => {
      const complexity = QueryBuilder.getQueryComplexity('john');
      expect(complexity).toBeGreaterThanOrEqual(0);
      expect(complexity).toBeLessThan(10);
    });

    it('should calculate complex query complexity', () => {
      const simpleComplexity = QueryBuilder.getQueryComplexity('john');
      const complexComplexity = QueryBuilder.getQueryComplexity('john AND doe OR "jane smith" AND professor*');
      
      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });

    it('should account for boolean operators', () => {
      const simple = QueryBuilder.getQueryComplexity('john doe');
      const withBoolean = QueryBuilder.getQueryComplexity('john AND doe');
      
      expect(withBoolean).toBeGreaterThan(simple);
    });

    it('should account for phrase searches', () => {
      const simple = QueryBuilder.getQueryComplexity('john doe');
      const withPhrase = QueryBuilder.getQueryComplexity('"john doe"');
      
      expect(withPhrase).toBeGreaterThan(simple);
    });

    it('should account for wildcards', () => {
      const simple = QueryBuilder.getQueryComplexity('john');
      const withWildcard = QueryBuilder.getQueryComplexity('john*');
      
      expect(withWildcard).toBeGreaterThan(simple);
    });
  });

  describe('Query Optimization', () => {
    it('should not modify simple queries', () => {
      const query = 'john doe';
      const optimized = QueryBuilder.optimizeQuery(query, 50);
      expect(optimized).toBe(query);
    });

    it('should remove excessive wildcards', () => {
      const query = 'john***doe**';
      const optimized = QueryBuilder.optimizeQuery(query, 50);
      expect(optimized).toContain('john*');
      expect(optimized).toContain('doe*');
    });

    it('should limit OR clauses', () => {
      const query = Array.from({ length: 15 }, (_, i) => `word${i}`).join(' OR ');
      const optimized = QueryBuilder.optimizeQuery(query, 50);
      const orCount = (optimized.match(/ OR /g) || []).length;
      expect(orCount).toBeLessThan(15); // Should reduce the number of OR operators
    });

    it('should truncate very long queries', () => {
      const query = 'a'.repeat(250);
      const optimized = QueryBuilder.optimizeQuery(query, 50);
      expect(optimized.length).toBeLessThanOrEqual(250); // Should not be longer than original
    });

    it('should handle complex optimization', () => {
      const query = 'john*** AND doe** OR ' + 'word '.repeat(20) + 'a'.repeat(100);
      const optimized = QueryBuilder.optimizeQuery(query, 50);
      
      expect(optimized).toContain('john*');
      expect(optimized).toContain('doe*');
      expect(optimized.length).toBeLessThanOrEqual(query.length); // Should not be longer
    });
  });

  describe('Boolean Query Processing', () => {
    it('should detect boolean operators', () => {
      const hasBool1 = (QueryBuilder as any).containsBooleanOperators('john AND doe');
      const hasBool2 = (QueryBuilder as any).containsBooleanOperators('john OR doe');
      const hasBool3 = (QueryBuilder as any).containsBooleanOperators('NOT john');
      const noBool = (QueryBuilder as any).containsBooleanOperators('john doe');

      expect(hasBool1).toBe(true);
      expect(hasBool2).toBe(true);
      expect(hasBool3).toBe(true);
      expect(noBool).toBe(false);
    });

    it('should process boolean queries', () => {
      const processed = (QueryBuilder as any).processBooleanQuery('john and doe or jane');
      expect(processed).toBe('john AND doe OR jane');
    });

    it('should normalize boolean operators', () => {
      const processed = (QueryBuilder as any).processBooleanQuery('john  AND   doe  OR  jane');
      expect(processed).toBe('john AND doe OR jane');
    });
  });

  describe('Word Sanitization', () => {
    it('should sanitize individual words', () => {
      const sanitized = (QueryBuilder as any).sanitizeWord('john@#$');
      expect(sanitized).toBe('john');
    });

    it('should preserve hyphens and apostrophes', () => {
      const sanitized1 = (QueryBuilder as any).sanitizeWord("john-doe");
      const sanitized2 = (QueryBuilder as any).sanitizeWord("john's");
      
      expect(sanitized1).toBe('john-doe');
      expect(sanitized2).toBe("john's");
    });

    it('should handle empty words', () => {
      const sanitized = (QueryBuilder as any).sanitizeWord('');
      expect(sanitized).toBe('');
    });
  });
});