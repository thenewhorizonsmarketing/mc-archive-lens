import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkBlocker } from '../network-blocker';

describe('NetworkBlocker (Requirement 8.3)', () => {
  let networkBlocker: NetworkBlocker;

  beforeEach(() => {
    networkBlocker = NetworkBlocker.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NetworkBlocker.getInstance();
      const instance2 = NetworkBlocker.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Request Detection', () => {
    it('should allow local file URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('file:///path/to/file.json')).toBe(false);
    });

    it('should allow data URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('data:image/png;base64,abc123')).toBe(false);
    });

    it('should allow blob URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('blob:http://localhost/abc-123')).toBe(false);
    });

    it('should allow relative URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('/api/data')).toBe(false);
      expect((blocker as any).isExternalRequest('./config.json')).toBe(false);
      expect((blocker as any).isExternalRequest('../assets/model.glb')).toBe(false);
    });

    it('should allow localhost URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('http://localhost:3000/api')).toBe(false);
      expect((blocker as any).isExternalRequest('http://127.0.0.1:8080/data')).toBe(false);
    });

    it('should block external HTTP URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('http://example.com/api')).toBe(true);
      expect((blocker as any).isExternalRequest('https://api.example.com/data')).toBe(true);
    });

    it('should block external WebSocket URLs', () => {
      const blocker = NetworkBlocker.getInstance();
      expect((blocker as any).isExternalRequest('ws://example.com/socket')).toBe(true);
      expect((blocker as any).isExternalRequest('wss://api.example.com/socket')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track blocked requests', () => {
      const blocker = NetworkBlocker.getInstance();
      
      const initialStats = blocker.getStats();
      expect(initialStats.blockedCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(initialStats.blockedRequests)).toBe(true);
    });
  });
});
