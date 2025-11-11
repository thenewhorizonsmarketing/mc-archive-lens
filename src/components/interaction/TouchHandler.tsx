import React, { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * TouchHandler Component
 * 
 * Handles touch gestures and 3D hit detection for the kiosk interface.
 * 
 * Requirements:
 * - 3.1: Minimum 56px hit targets
 * - 3.2: Navigate to corresponding section on tap
 * - 3.3: Open admin overlay on 3-second tap-and-hold in upper-left
 * - 3.4: Navigate back/home on two-finger tap
 * - 3.5: Disable pinch/zoom gestures
 * - 3.6: Block input during transitions
 */

export interface TouchHandlerProps {
  /** Callback when a room tile is tapped */
  onRoomTap?: (roomId: string) => void;
  /** Callback when admin gesture is detected (3s hold in upper-left) */
  onAdminGesture?: () => void;
  /** Callback when back gesture is detected (two-finger tap) */
  onBackGesture?: () => void;
  /** Whether a transition is in progress (blocks input) */
  isTransitioning?: boolean;
  /** Children to render (typically the 3D scene) */
  children?: React.ReactNode;
}

interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

const ADMIN_GESTURE_DURATION = 3000; // 3 seconds
const ADMIN_GESTURE_ZONE_SIZE = 0.15; // 15% of screen width/height
const TAP_THRESHOLD = 10; // pixels - max movement to still count as tap
const TWO_FINGER_TAP_THRESHOLD = 500; // ms - max time between touches

export const TouchHandler: React.FC<TouchHandlerProps> = ({
  onRoomTap,
  onAdminGesture,
  onBackGesture,
  isTransitioning = false,
  children
}) => {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const touchPoints = useRef<Map<number, TouchPoint>>(new Map());
  const adminGestureTimer = useRef<number | null>(null);
  const lastTouchTime = useRef<number>(0);
  const twoFingerTapDetected = useRef<boolean>(false);

  /**
   * Perform raycasting to detect 3D object hits
   */
  const performRaycast = useCallback((x: number, y: number): THREE.Intersection[] => {
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    const rect = gl.domElement.getBoundingClientRect();
    const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((y - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // Perform raycast
    return raycaster.current.intersectObjects(scene.children, true);
  }, [gl, camera, scene]);

  /**
   * Check if touch is in admin gesture zone (upper-left corner)
   */
  const isInAdminZone = useCallback((x: number, y: number): boolean => {
    const rect = gl.domElement.getBoundingClientRect();
    const relativeX = (x - rect.left) / rect.width;
    const relativeY = (y - rect.top) / rect.height;

    return relativeX < ADMIN_GESTURE_ZONE_SIZE && relativeY < ADMIN_GESTURE_ZONE_SIZE;
  }, [gl]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Block input during transitions
    if (isTransitioning) {
      event.preventDefault();
      return;
    }

    const now = Date.now();
    const touches = Array.from(event.changedTouches);

    // Detect two-finger tap
    if (event.touches.length === 2) {
      const timeSinceLastTouch = now - lastTouchTime.current;
      
      if (timeSinceLastTouch < TWO_FINGER_TAP_THRESHOLD) {
        twoFingerTapDetected.current = true;
      }
    }

    lastTouchTime.current = now;

    // Record touch points
    touches.forEach(touch => {
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        currentX: touch.clientX,
        currentY: touch.clientY
      };

      touchPoints.current.set(touch.identifier, touchPoint);

      // Check for admin gesture (single touch in upper-left)
      if (event.touches.length === 1 && isInAdminZone(touch.clientX, touch.clientY)) {
        // Start admin gesture timer
        adminGestureTimer.current = window.setTimeout(() => {
          if (onAdminGesture) {
            console.log('[TouchHandler] Admin gesture detected');
            onAdminGesture();
          }
          // Clear the touch point
          touchPoints.current.delete(touch.identifier);
        }, ADMIN_GESTURE_DURATION);
      }
    });
  }, [isTransitioning, isInAdminZone, onAdminGesture]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((event: TouchEvent) => {
    // Prevent default to disable scrolling
    event.preventDefault();

    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      const touchPoint = touchPoints.current.get(touch.identifier);
      if (touchPoint) {
        touchPoint.currentX = touch.clientX;
        touchPoint.currentY = touch.clientY;

        // Check if moved too much (cancel tap/admin gesture)
        const deltaX = Math.abs(touchPoint.currentX - touchPoint.startX);
        const deltaY = Math.abs(touchPoint.currentY - touchPoint.startY);

        if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
          // Cancel admin gesture if active
          if (adminGestureTimer.current) {
            window.clearTimeout(adminGestureTimer.current);
            adminGestureTimer.current = null;
          }
        }
      }
    });
  }, []);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Block input during transitions
    if (isTransitioning) {
      event.preventDefault();
      return;
    }

    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      const touchPoint = touchPoints.current.get(touch.identifier);
      
      if (touchPoint) {
        const deltaX = Math.abs(touch.clientX - touchPoint.startX);
        const deltaY = Math.abs(touch.clientY - touchPoint.startY);
        const duration = Date.now() - touchPoint.startTime;

        // Check if it's a valid tap (minimal movement)
        const isTap = deltaX < TAP_THRESHOLD && deltaY < TAP_THRESHOLD;

        // Handle two-finger tap gesture
        if (twoFingerTapDetected.current && event.touches.length === 0) {
          console.log('[TouchHandler] Two-finger tap detected - going back/home');
          if (onBackGesture) {
            onBackGesture();
          }
          twoFingerTapDetected.current = false;
          touchPoints.current.clear();
          return;
        }

        // Handle single tap on room tiles
        if (isTap && duration < ADMIN_GESTURE_DURATION) {
          // Perform raycast to detect room tile hits
          const intersections = performRaycast(touch.clientX, touch.clientY);

          if (intersections.length > 0) {
            // Find the first interactive object
            for (const intersection of intersections) {
              let obj: THREE.Object3D | null = intersection.object;
              
              // Traverse up to find room data
              while (obj) {
                if (obj.userData && obj.userData.roomId) {
                  console.log('[TouchHandler] Room tapped:', obj.userData.roomId);
                  if (onRoomTap) {
                    onRoomTap(obj.userData.roomId);
                  }
                  break;
                }
                obj = obj.parent;
              }
            }
          }
        }

        // Clear admin gesture timer
        if (adminGestureTimer.current) {
          window.clearTimeout(adminGestureTimer.current);
          adminGestureTimer.current = null;
        }

        // Remove touch point
        touchPoints.current.delete(touch.identifier);
      }
    });

    // Reset two-finger tap detection if all touches are gone
    if (event.touches.length === 0) {
      twoFingerTapDetected.current = false;
    }
  }, [isTransitioning, performRaycast, onRoomTap, onBackGesture]);

  /**
   * Handle touch cancel
   */
  const handleTouchCancel = useCallback((event: TouchEvent) => {
    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      touchPoints.current.delete(touch.identifier);
    });

    // Clear admin gesture timer
    if (adminGestureTimer.current) {
      window.clearTimeout(adminGestureTimer.current);
      adminGestureTimer.current = null;
    }

    twoFingerTapDetected.current = false;
  }, []);

  /**
   * Prevent default gestures (pinch, zoom, scroll)
   */
  const preventDefaultGestures = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const canvas = gl.domElement;

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // Prevent default gestures
    canvas.addEventListener('gesturestart', preventDefaultGestures, { passive: false });
    canvas.addEventListener('gesturechange', preventDefaultGestures, { passive: false });
    canvas.addEventListener('gestureend', preventDefaultGestures, { passive: false });

    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', preventDefaultGestures);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
      canvas.removeEventListener('gesturestart', preventDefaultGestures);
      canvas.removeEventListener('gesturechange', preventDefaultGestures);
      canvas.removeEventListener('gestureend', preventDefaultGestures);
      canvas.removeEventListener('contextmenu', preventDefaultGestures);

      // Clear any pending timers
      if (adminGestureTimer.current) {
        window.clearTimeout(adminGestureTimer.current);
      }
    };
  }, [gl, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventDefaultGestures]);

  return <>{children}</>;
};

export default TouchHandler;
