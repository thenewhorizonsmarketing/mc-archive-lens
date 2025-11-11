import { create } from 'zustand';

/**
 * Idle State Store
 * Manages idle timers, attract mode, and auto-reset behavior
 */

interface IdleState {
  // Idle tracking
  isIdle: boolean;
  isInAttractMode: boolean;
  lastActivityTime: number;
  
  // Timer configuration (in milliseconds)
  idleTimeout: number; // 45 seconds default
  attractTimeout: number; // 120 seconds default
  
  // Timer IDs (for cleanup)
  idleTimerId: number | null;
  attractTimerId: number | null;
  
  // Actions
  recordActivity: () => void;
  startIdleTimer: () => void;
  stopIdleTimer: () => void;
  enterAttractMode: () => void;
  exitAttractMode: () => void;
  triggerAutoReset: () => void;
  setIdleTimeout: (timeout: number) => void;
  setAttractTimeout: (timeout: number) => void;
  resetAll: () => void;
}

export const useIdleStore = create<IdleState>((set, get) => ({
  // Initial state
  isIdle: false,
  isInAttractMode: false,
  lastActivityTime: Date.now(),
  idleTimeout: 45000, // 45 seconds
  attractTimeout: 120000, // 120 seconds (2 minutes)
  idleTimerId: null,
  attractTimerId: null,
  
  // Actions
  recordActivity: () => {
    const { isIdle, isInAttractMode } = get();
    
    set({ 
      lastActivityTime: Date.now(),
      isIdle: false
    });
    
    // Exit attract mode if active
    if (isInAttractMode) {
      get().exitAttractMode();
    }
    
    // Restart idle timer
    get().startIdleTimer();
  },
  
  startIdleTimer: () => {
    const { idleTimerId, attractTimerId, idleTimeout, attractTimeout } = get();
    
    // Clear existing timers
    if (idleTimerId) window.clearTimeout(idleTimerId);
    if (attractTimerId) window.clearTimeout(attractTimerId);
    
    // Start idle timer (45s)
    const newIdleTimerId = window.setTimeout(() => {
      set({ isIdle: true });
      get().enterAttractMode();
    }, idleTimeout);
    
    // Start attract/reset timer (120s)
    const newAttractTimerId = window.setTimeout(() => {
      get().triggerAutoReset();
    }, attractTimeout);
    
    set({ 
      idleTimerId: newIdleTimerId,
      attractTimerId: newAttractTimerId
    });
  },
  
  stopIdleTimer: () => {
    const { idleTimerId, attractTimerId } = get();
    
    if (idleTimerId) {
      window.clearTimeout(idleTimerId);
    }
    if (attractTimerId) {
      window.clearTimeout(attractTimerId);
    }
    
    set({ 
      idleTimerId: null,
      attractTimerId: null
    });
  },
  
  enterAttractMode: () => {
    console.log('[Idle] Entering attract mode');
    set({ isInAttractMode: true });
  },
  
  exitAttractMode: () => {
    console.log('[Idle] Exiting attract mode');
    set({ isInAttractMode: false });
  },
  
  triggerAutoReset: () => {
    console.log('[Idle] Triggering auto-reset to home');
    
    // Clear idle and attract mode states
    // The IdleManager component will handle navigation and modal clearing
    set({ 
      isIdle: false,
      isInAttractMode: false,
      lastActivityTime: Date.now()
    });
    
    // Stop current timers
    get().stopIdleTimer();
    
    // Restart timers after a brief delay to allow reset to complete
    setTimeout(() => {
      get().startIdleTimer();
    }, 100);
  },
  
  setIdleTimeout: (timeout) => set({ idleTimeout: timeout }),
  
  setAttractTimeout: (timeout) => set({ attractTimeout: timeout }),
  
  resetAll: () => {
    get().stopIdleTimer();
    set({ 
      isIdle: false,
      isInAttractMode: false,
      lastActivityTime: Date.now()
    });
    get().startIdleTimer();
  }
}));
