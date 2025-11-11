import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useKioskStore } from '@/store/kioskStore';
import * as THREE from 'three';
import type { RoomDefinition } from '@/types/kiosk-config';
import { calculateGridPosition } from './gridPositions';

/**
 * CameraController Component
 * 
 * Manages the orthographic camera with proper framing and smooth transitions.
 * Implements camera dolly-in transitions when navigating to rooms.
 * 
 * Requirements:
 * - 2.1: Use orthographic camera by default
 * - 2.2: Apply small perspective nudge on hover to show depth
 * - 2.3: Maintain fixed composition to keep all tiles visible
 * - 2.4: Ensure pixel-perfect view with no clipping
 * - 5.3: Perform camera dolly-in through doorway lasting 500-700ms
 */

export interface CameraControllerProps {
  /** Whether a transition is in progress */
  isTransitioning?: boolean;
  /** Target room ID for camera transition */
  targetRoom?: string | null;
  /** Current motion tier */
  motionTier?: 'full' | 'lite' | 'static';
  /** Room definitions for calculating target positions */
  rooms?: RoomDefinition[];
}

export const CameraController: React.FC<CameraControllerProps> = ({
  isTransitioning = false,
  targetRoom = null,
  motionTier = 'full',
  rooms = []
}) => {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const { size } = useThree();
  
  const updateTransitionProgress = useKioskStore((state) => state.updateTransitionProgress);
  const completeTransition = useKioskStore((state) => state.completeTransition);

  // Camera animation state
  const animationState = useRef({
    startPosition: new THREE.Vector3(0, 5, 10),
    targetPosition: new THREE.Vector3(0, 5, 10),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    startTime: 0,
    duration: 600, // 600ms transition (within 500-700ms requirement)
    isAnimating: false
  });

  // Default camera position for board view
  const defaultPosition = new THREE.Vector3(0, 5, 10);
  const defaultLookAt = new THREE.Vector3(0, 0, 0);

  /**
   * Calculate camera target position for a specific room
   * Dolly in toward the room tile with a slight perspective nudge
   */
  const calculateRoomCameraPosition = (roomId: string): { position: THREE.Vector3; lookAt: THREE.Vector3 } => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return { 
        position: defaultPosition.clone(), 
        lookAt: defaultLookAt.clone() 
      };
    }

    // Get the room's grid position
    const [tileX, tileY, tileZ] = calculateGridPosition(room.position);
    
    // Calculate camera position: dolly in toward the tile
    // Move closer and slightly above the tile for dramatic effect
    const dollyDistance = 4; // Move 4 units closer
    const heightOffset = 3; // Slightly lower for better view
    
    // Direction from default position to tile
    const direction = new THREE.Vector3(tileX, 0, tileZ).normalize();
    
    // Camera position: between default and tile, with height
    const cameraPosition = new THREE.Vector3(
      tileX * 0.3, // 30% toward tile X
      heightOffset,
      10 - dollyDistance + (tileZ * 0.2) // Dolly in, with slight Z adjustment
    );
    
    // Look at the tile position
    const lookAtPosition = new THREE.Vector3(tileX, tileY, tileZ);
    
    return { position: cameraPosition, lookAt: lookAtPosition };
  };

  // Initialize camera position
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.copy(defaultPosition);
      cameraRef.current.lookAt(defaultLookAt);
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  // Handle viewport resize
  useEffect(() => {
    if (cameraRef.current) {
      const aspect = size.width / size.height;
      const frustumSize = 8; // Adjust to frame the board properly
      
      cameraRef.current.left = (-frustumSize * aspect) / 2;
      cameraRef.current.right = (frustumSize * aspect) / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = -frustumSize / 2;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [size.width, size.height]);

  // Start transition when target room changes
  useEffect(() => {
    if (isTransitioning && targetRoom && cameraRef.current) {
      animationState.current.isAnimating = true;
      animationState.current.startTime = performance.now();
      animationState.current.startPosition.copy(cameraRef.current.position);
      
      // Calculate target position based on room
      const { position, lookAt } = calculateRoomCameraPosition(targetRoom);
      animationState.current.targetPosition.copy(position);
      animationState.current.targetLookAt.copy(lookAt);
      
      console.log('[CameraController] Starting transition to room:', targetRoom, {
        from: animationState.current.startPosition.toArray(),
        to: position.toArray(),
        lookAt: lookAt.toArray()
      });
    }
  }, [isTransitioning, targetRoom, rooms]);

  // Animation loop
  useFrame((state) => {
    if (!cameraRef.current) return;

    const anim = animationState.current;
    
    if (anim.isAnimating) {
      const elapsed = performance.now() - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      
      // Smooth easing with perspective nudge (ease-in-out cubic with slight acceleration)
      // This creates a more dramatic "dolly through doorway" effect
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Add slight perspective nudge at the peak of transition (requirement 2.2)
      const perspectiveNudge = Math.sin(progress * Math.PI) * 0.3;
      
      // Interpolate camera position with perspective nudge
      const basePosition = new THREE.Vector3().lerpVectors(
        anim.startPosition,
        anim.targetPosition,
        eased
      );
      
      // Apply perspective nudge (move slightly forward during transition)
      cameraRef.current.position.copy(basePosition);
      cameraRef.current.position.z -= perspectiveNudge;
      
      // Interpolate look-at target
      const currentLookAt = new THREE.Vector3().lerpVectors(
        defaultLookAt,
        anim.targetLookAt,
        eased
      );
      cameraRef.current.lookAt(currentLookAt);
      
      // Update transition progress in store
      updateTransitionProgress(progress);
      
      // Complete transition
      if (progress >= 1) {
        anim.isAnimating = false;
        completeTransition();
        console.log('[CameraController] Transition complete');
      }
    } else if (!isTransitioning) {
      // Smoothly return to default position when not transitioning
      cameraRef.current.position.lerp(defaultPosition, 0.1);
      cameraRef.current.lookAt(defaultLookAt);
    }

    // Apply subtle breathing effect for attract mode (motion tier full only)
    if (motionTier === 'full' && !isTransitioning && !anim.isAnimating) {
      const time = state.clock.getElapsedTime();
      const breathe = Math.sin(time * 0.5) * 0.1;
      cameraRef.current.position.y = 5 + breathe;
    }

    cameraRef.current.updateProjectionMatrix();
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[0, 5, 10]}
      zoom={1}
      near={0.1}
      far={1000}
    />
  );
};

export default CameraController;
