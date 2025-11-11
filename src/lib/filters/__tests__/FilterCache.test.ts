import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterCache } from '../FilterCache';

describe('FilterCache', () => {
  let cache: FilterCache;

  beforeEach(() => {
    cache = new FilterCache();
  });

  describe('set and get', () => {
    it('should store and retrieve cached values', () => {
      const key = 'test-key';
      const value = { results: [1, 2, 3] };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should handle multiple cache entries', () => {
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });
      cache.set('key3', { data: 'value3' });

      expect(cache.get('key1')).toEqual({ data: 'value1' });
      expect(cache.get('key2')).toEqual({ data: 'value2' });
      expect(cache.get('key3')).toEqual({ data: 'value3' });
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const value = { data: 'test' };
      const ttl = 100; // 100ms

      cache.set(key, value, ttl);
      expect(cache.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get(key)).toBeUndefined();
    });

    it('should use default TTL of 5 minutes', () => {
      const key = 'default-ttl-key';
      const value = { data: 'test' };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should not expire before TTL', async () => {
      const key = 'not-expired-key';
      const value = { data: 'test' };
      const ttl = 1000; // 1 second

      cache.set(key, value, ttl);

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get(key)).toEqual(value);
    });
  });

  describe('invalidate', () => {
    it('should remove specific cache entry', () => {
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toEqual({ data: 'value2' });
    });

    it('should handle invalidating non-existent keys', () => {
      expect(() => cache.invalidate('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });
      cache.set('key3', { data: 'value3' });

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should allow new entries after clear', () => {
      cache.set('key1', { data: 'value1' });
      cache.clear();
      cache.set('key2', { data: 'value2' });

      expect(cache.get('key2')).toEqual({ data: 'value2' });
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('existing-key', { data: 'test' });
      expect(cache.has('existing-key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const key = 'expiring-key';
      cache.set(key, { data: 'test' }, 50);

      expect(cache.has(key)).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.has(key)).toBe(false);
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same input', () => {
      const config = {
        type: 'alumni' as const,
        textFilters: [{ field: 'name', value: 'John', matchType: 'contains' as const, caseSensitive: false }],
        operator: 'AND' as const
      };

      const key1 = cache.generateKey(config);
      const key2 = cache.generateKey(config);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const config1 = {
        type: 'alumni' as const,
        textFilters: [{ field: 'name', value: 'John', matchType: 'contains' as const, caseSensitive: false }],
        operator: 'AND' as const
      };

      const config2 = {
        type: 'alumni' as const,
        textFilters: [{ field: 'name', value: 'Jane', matchType: 'contains' as const, caseSensitive: false }],
        operator: 'AND' as const
      };

      const key1 = cache.generateKey(config1);
      const key2 = cache.generateKey(config2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', { data: 'value1' });
      expect(cache.size()).toBe(1);

      cache.set('key2', { data: 'value2' });
      expect(cache.size()).toBe(2);

      cache.invalidate('key1');
      expect(cache.size()).toBe(1);
    });
  });
});
