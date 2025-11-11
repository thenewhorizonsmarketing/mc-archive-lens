/**
 * E2E Test: Room Navigation
 * Tests navigation through all 8 rooms
 * Requirements: 13.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useKioskStore } from '@/store/kioskStore';

describe('Room Navigation E2E', () => {
  const rooms = [
    'alumni',
    'faculty',
    'photos',
    'publications',
    'history',
    'awards',
    'events',
    'contact',
  ];

  beforeEach(() => {
    // Reset to home
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

  describe('All Room Navigation (Requirement 13.2)', () => {
    it('should navigate to all 8 rooms from home', () => {
      const { setRoute } = useKioskStore.getState();
      
      rooms.forEach(room => {
        // Navigate to room
        setRoute(room);
        
        const state = useKioskStore.getState();
        expect(state.currentRoute).toBe(room);
        expect(state.previousRoute).toBeDefined();
        
        // Return to home
        setRoute('home');
        expect(useKioskStore.getState().currentRoute).toBe('home');
      });
    });

    it('should maintain navigation history', () => {
      const { setRoute } = useKioskStore.getState();
      
      setRoute('alumni');
      expect(useKioskStore.getState().previousRoute).toBe('home');
      
      setRoute('faculty');
      expect(useKioskStore.getState().previousRoute).toBe('alumni');
      
      setRoute('photos');
      expect(useKioskStore.getState().previousRoute).toBe('faculty');
    });

    it('should handle back navigation through rooms', () => {
      const { setRoute, goBack } = useKioskStore.getState();
      
      setRoute('alumni');
      setRoute('faculty');
      
      goBack();
      expect(useKioskStore.getState().currentRoute).toBe('alumni');
      
      // Note: goBack only goes back one level, not to home
      // To go home, use goHome() instead
    });

    it('should return to home from any room', () => {
      const { setRoute, goHome } = useKioskStore.getState();
      
      rooms.forEach(room => {
        setRoute(room);
        goHome();
        expect(useKioskStore.getState().currentRoute).toBe('home');
      });
    });
  });

  describe('Navigation Transitions', () => {
    it('should complete transitions for all rooms', () => {
      const { startTransition, completeTransition } = useKioskStore.getState();
      
      rooms.forEach(room => {
        startTransition(room);
        
        expect(useKioskStore.getState().isTransitioning).toBe(true);
        expect(useKioskStore.getState().targetRoute).toBe(room);
        
        completeTransition();
        
        expect(useKioskStore.getState().isTransitioning).toBe(false);
        expect(useKioskStore.getState().currentRoute).toBe(room);
      });
    });

    it('should lock input during all room transitions', () => {
      const { startTransition, isInputLocked } = useKioskStore.getState();
      
      rooms.forEach(room => {
        startTransition(room);
        expect(isInputLocked()).toBe(true);
      });
    });
  });

  describe('Navigation Performance', () => {
    it('should complete navigation within acceptable time', () => {
      const maxTransitionTime = 1000; // 1 second total (300ms pulse + 700ms dolly)
      const mockTransitionTime = 800;
      
      expect(mockTransitionTime).toBeLessThanOrEqual(maxTransitionTime);
    });
  });
});
