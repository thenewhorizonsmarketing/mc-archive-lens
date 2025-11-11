import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useIdleStore } from '../idleStore';

// Mock window.setTimeout and window.clearTimeout for node environment
global.window = {
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
} as any;

describe('IdleStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset store to initial state
    useIdleStore.setState({
      isIdle: false,
      isInAttractMode: false,
      lastActivityTime: Date.now(),
      idleTimeout: 45000,
      attractTimeout: 120000,
      idleTimerId: null,
      attractTimerId: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    const { stopIdleTimer } = useIdleStore.getState();
    stopIdleTimer();
  });

  describe('Activity Recording', () => {
    it('should record activity and update timestamp', () => {
      const { recordActivity } = useIdleStore.getState();
      const beforeTime = Date.now();
      
      recordActivity();
      
      const state = useIdleStore.getState();
      expect(state.lastActivityTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.isIdle).toBe(false);
    });

    it('should exit attract mode on activity', () => {
      const { recordActivity } = useIdleStore.getState();
      
      useIdleStore.setState({ isInAttractMode: true });
      recordActivity();
      
      const state = useIdleStore.getState();
      expect(state.isInAttractMode).toBe(false);
    });
  });

  describe('Idle Timer (Requirement 4.1)', () => {
    it('should set up idle timer when started', () => {
      const { startIdleTimer } = useIdleStore.getState();
      
      startIdleTimer();
      
      const state = useIdleStore.getState();
      expect(state.idleTimerId).not.toBeNull();
      expect(state.attractTimerId).not.toBeNull();
    });

    it('should manually enter attract mode', () => {
      const { enterAttractMode } = useIdleStore.getState();
      
      enterAttractMode();
      
      const state = useIdleStore.getState();
      expect(state.isInAttractMode).toBe(true);
    });

    it('should restart timers on activity', () => {
      const { startIdleTimer, recordActivity } = useIdleStore.getState();
      
      startIdleTimer();
      const firstTimerId = useIdleStore.getState().idleTimerId;
      
      // Record activity (should restart timer)
      recordActivity();
      
      const state = useIdleStore.getState();
      expect(state.idleTimerId).not.toBe(firstTimerId); // Timer should be restarted
      expect(state.isIdle).toBe(false);
    });
  });

  describe('Timer Management', () => {
    it('should stop idle timers', () => {
      const { startIdleTimer, stopIdleTimer } = useIdleStore.getState();
      
      startIdleTimer();
      stopIdleTimer();
      
      // Fast-forward past idle timeout
      vi.advanceTimersByTime(50000);
      
      // Should not enter idle mode
      const state = useIdleStore.getState();
      expect(state.isIdle).toBe(false);
      expect(state.isInAttractMode).toBe(false);
    });

    it('should clear timer IDs when stopped', () => {
      const { startIdleTimer, stopIdleTimer } = useIdleStore.getState();
      
      startIdleTimer();
      
      let state = useIdleStore.getState();
      expect(state.idleTimerId).not.toBeNull();
      expect(state.attractTimerId).not.toBeNull();
      
      stopIdleTimer();
      
      state = useIdleStore.getState();
      expect(state.idleTimerId).toBeNull();
      expect(state.attractTimerId).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should allow custom idle timeout', () => {
      const { setIdleTimeout } = useIdleStore.getState();
      
      setIdleTimeout(10000); // 10 seconds
      
      const state = useIdleStore.getState();
      expect(state.idleTimeout).toBe(10000);
    });

    it('should allow custom attract timeout', () => {
      const { setAttractTimeout } = useIdleStore.getState();
      
      setAttractTimeout(30000); // 30 seconds
      
      const state = useIdleStore.getState();
      expect(state.attractTimeout).toBe(30000);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', () => {
      const { resetAll } = useIdleStore.getState();
      
      useIdleStore.setState({ 
        isIdle: true, 
        isInAttractMode: true 
      });
      
      resetAll();
      
      const state = useIdleStore.getState();
      expect(state.isIdle).toBe(false);
      expect(state.isInAttractMode).toBe(false);
    });
  });
});
