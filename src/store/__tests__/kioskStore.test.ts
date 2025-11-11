import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKioskStore } from '../kioskStore';

describe('KioskStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useKioskStore.setState({
      currentRoute: 'home',
      previousRoute: null,
      isTransitioning: false,
      transitionProgress: 0,
      targetRoute: null,
      inputLocked: false,
      transitionStartTime: 0,
    });
  });

  describe('Route Navigation', () => {
    it('should set current route and track previous route', () => {
      const { setRoute, currentRoute, previousRoute } = useKioskStore.getState();
      
      expect(currentRoute).toBe('home');
      expect(previousRoute).toBeNull();
      
      setRoute('alumni');
      
      const state = useKioskStore.getState();
      expect(state.currentRoute).toBe('alumni');
      expect(state.previousRoute).toBe('home');
    });

    it('should navigate back to previous route', () => {
      const { setRoute, goBack } = useKioskStore.getState();
      
      setRoute('alumni');
      setRoute('faculty');
      
      goBack();
      
      const state = useKioskStore.getState();
      expect(state.currentRoute).toBe('alumni');
      expect(state.previousRoute).toBeNull();
    });

    it('should navigate home', () => {
      const { setRoute, goHome } = useKioskStore.getState();
      
      setRoute('alumni');
      goHome();
      
      const state = useKioskStore.getState();
      expect(state.currentRoute).toBe('home');
      expect(state.previousRoute).toBe('alumni');
    });
  });

  describe('Transition Management', () => {
    it('should start transition and lock input', () => {
      const { startTransition } = useKioskStore.getState();
      
      startTransition('alumni');
      
      const state = useKioskStore.getState();
      expect(state.isTransitioning).toBe(true);
      expect(state.targetRoute).toBe('alumni');
      expect(state.inputLocked).toBe(true);
      expect(state.transitionProgress).toBe(0);
    });

    it('should update transition progress', () => {
      const { startTransition, updateTransitionProgress } = useKioskStore.getState();
      
      startTransition('alumni');
      updateTransitionProgress(0.5);
      
      const state = useKioskStore.getState();
      expect(state.transitionProgress).toBe(0.5);
    });

    it('should clamp transition progress between 0 and 1', () => {
      const { startTransition, updateTransitionProgress } = useKioskStore.getState();
      
      startTransition('alumni');
      updateTransitionProgress(1.5);
      
      expect(useKioskStore.getState().transitionProgress).toBe(1);
      
      updateTransitionProgress(-0.5);
      
      expect(useKioskStore.getState().transitionProgress).toBe(0);
    });

    it('should complete transition and unlock input', () => {
      const { startTransition, completeTransition } = useKioskStore.getState();
      
      startTransition('alumni');
      completeTransition();
      
      const state = useKioskStore.getState();
      expect(state.isTransitioning).toBe(false);
      expect(state.currentRoute).toBe('alumni');
      expect(state.inputLocked).toBe(false);
      expect(state.targetRoute).toBeNull();
    });

    it('should cancel transition and unlock input', () => {
      const { startTransition, cancelTransition } = useKioskStore.getState();
      
      startTransition('alumni');
      cancelTransition();
      
      const state = useKioskStore.getState();
      expect(state.isTransitioning).toBe(false);
      expect(state.inputLocked).toBe(false);
      expect(state.targetRoute).toBeNull();
      expect(state.currentRoute).toBe('home'); // Should stay on original route
    });
  });

  describe('Input Locking (Requirement 5.1, 5.6)', () => {
    it('should lock input manually', () => {
      const { lockInput, isInputLocked } = useKioskStore.getState();
      
      expect(isInputLocked()).toBe(false);
      
      lockInput();
      
      expect(useKioskStore.getState().isInputLocked()).toBe(true);
    });

    it('should unlock input manually', () => {
      const { lockInput, unlockInput, isInputLocked } = useKioskStore.getState();
      
      lockInput();
      expect(isInputLocked()).toBe(true);
      
      unlockInput();
      
      expect(useKioskStore.getState().isInputLocked()).toBe(false);
    });

    it('should prevent navigation when input is locked', () => {
      const { lockInput, goHome, goBack } = useKioskStore.getState();
      
      useKioskStore.setState({ currentRoute: 'alumni', previousRoute: 'home' });
      lockInput();
      
      goHome();
      expect(useKioskStore.getState().currentRoute).toBe('alumni'); // Should not change
      
      goBack();
      expect(useKioskStore.getState().currentRoute).toBe('alumni'); // Should not change
    });
  });
});
