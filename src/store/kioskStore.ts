import { create } from 'zustand';

/**
 * Kiosk State Store
 * Manages current route, transition state, and navigation
 * 
 * Requirements:
 * - 5.1: Lock input during transitions to prevent double-taps
 * - 5.6: Guard against additional tap inputs during transitions
 */

export type KioskRoute = 'home' | 'alumni' | 'faculty' | 'photos' | 'publications' | string;

export interface TransitionState {
  isTransitioning: boolean;
  transitionProgress: number;
  targetRoute: KioskRoute | null;
  startTime: number;
  inputLocked: boolean;
}

interface KioskState {
  // Current route
  currentRoute: KioskRoute;
  previousRoute: KioskRoute | null;
  
  // Transition state
  isTransitioning: boolean;
  transitionProgress: number;
  targetRoute: KioskRoute | null;
  inputLocked: boolean;
  transitionStartTime: number;
  
  // Actions
  setRoute: (route: KioskRoute) => void;
  startTransition: (targetRoute: KioskRoute) => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  cancelTransition: () => void;
  goBack: () => void;
  goHome: () => void;
  isInputLocked: () => boolean;
  lockInput: () => void;
  unlockInput: () => void;
}

export const useKioskStore = create<KioskState>((set, get) => ({
  // Initial state
  currentRoute: 'home',
  previousRoute: null,
  isTransitioning: false,
  transitionProgress: 0,
  targetRoute: null,
  inputLocked: false,
  transitionStartTime: 0,
  
  // Actions
  setRoute: (route) => set({ 
    currentRoute: route,
    previousRoute: get().currentRoute 
  }),
  
  startTransition: (targetRoute) => {
    // Lock input immediately when transition starts (requirement 5.1)
    set({ 
      isTransitioning: true,
      transitionProgress: 0,
      targetRoute,
      inputLocked: true,
      transitionStartTime: performance.now()
    });
    console.log('[KioskStore] Transition started, input locked');
  },
  
  updateTransitionProgress: (progress) => set({ 
    transitionProgress: Math.max(0, Math.min(1, progress))
  }),
  
  completeTransition: () => {
    const { targetRoute, transitionStartTime } = get();
    const duration = performance.now() - transitionStartTime;
    
    if (targetRoute) {
      set({ 
        currentRoute: targetRoute,
        previousRoute: get().currentRoute,
        isTransitioning: false,
        transitionProgress: 1,
        targetRoute: null,
        inputLocked: false // Unlock input when transition completes
      });
      console.log(`[KioskStore] Transition complete (${duration.toFixed(0)}ms), input unlocked`);
    }
  },
  
  cancelTransition: () => {
    set({ 
      isTransitioning: false,
      transitionProgress: 0,
      targetRoute: null,
      inputLocked: false // Unlock input on cancel
    });
    console.log('[KioskStore] Transition cancelled, input unlocked');
  },
  
  goBack: () => {
    const { previousRoute, inputLocked } = get();
    if (previousRoute && !inputLocked) {
      set({ 
        currentRoute: previousRoute,
        previousRoute: null
      });
    }
  },
  
  goHome: () => {
    const { inputLocked } = get();
    if (!inputLocked) {
      set({ 
        currentRoute: 'home',
        previousRoute: get().currentRoute
      });
    }
  },
  
  // Input locking helpers (requirement 5.6)
  isInputLocked: () => get().inputLocked,
  
  lockInput: () => {
    set({ inputLocked: true });
    console.log('[KioskStore] Input manually locked');
  },
  
  unlockInput: () => {
    set({ inputLocked: false });
    console.log('[KioskStore] Input manually unlocked');
  }
}));
