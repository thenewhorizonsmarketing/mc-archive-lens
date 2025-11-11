import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIdleStore } from '@/store/idleStore';
import * as THREE from 'three';

/**
 * AttractLoop Component
 * 
 * Implements attract mode animations to draw attention when idle.
 * Includes gentle breathing tilt effect and soft glow sweep across plaques.
 * 
 * Requirements:
 * - 4.1: Create gentle breathing tilt effect and soft glow sweep after 45s idle
 */

export interface AttractLoopProps {
  /** Camera reference to apply tilt effect */
  cameraRef?: React.RefObject<THREE.Camera>;
  /** Motion tier for performance optimization */
  motionTier?: 'full' | 'lite' | 'static';
  /** Callback to provide glow intensity for brass plaques */
  onGlowUpdate?: (intensity: number, sweepPosition: number) => void;
}

export const AttractLoop: React.FC<AttractLoopProps> = ({
  cameraRef,
  motionTier = 'full',
  onGlowUpdate
}) => {
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const attractStartTime = useRef<number>(0);
  const isAttractingRef = useRef(false);

  // Track when attract mode starts
  useEffect(() => {
    if (isInAttractMode && !isAttractingRef.current) {
      isAttractingRef.current = true;
      attractStartTime.current = performance.now();
      console.log('[AttractLoop] Attract mode started');
    } else if (!isInAttractMode && isAttractingRef.current) {
      isAttractingRef.current = false;
      console.log('[AttractLoop] Attract mode ended');
    }
  }, [isInAttractMode]);

  // Animate attract loop
  useFrame(({ clock, camera }) => {
    if (!isInAttractMode || !isAttractingRef.current) {
      return;
    }

    const time = clock.getElapsedTime();
    const attractElapsed = (performance.now() - attractStartTime.current) / 1000;

    // Only apply animations based on motion tier
    if (motionTier === 'static') {
      // Static tier: no animations
      return;
    }

    // Gentle breathing tilt effect (full tier only)
    if (motionTier === 'full' && cameraRef?.current) {
      // Slow breathing cycle: 4 seconds per breath
      const breathCycle = 4.0;
      const breathPhase = (attractElapsed % breathCycle) / breathCycle;
      
      // Smooth sine wave for breathing
      const breathIntensity = Math.sin(breathPhase * Math.PI * 2) * 0.15;
      
      // Apply subtle tilt to camera
      // Tilt around X axis (pitch) for breathing effect
      const targetRotationX = breathIntensity * 0.05; // Very subtle, ±2.8 degrees
      
      if (cameraRef.current.rotation) {
        // Smoothly interpolate to target rotation
        cameraRef.current.rotation.x += (targetRotationX - cameraRef.current.rotation.x) * 0.05;
      }
      
      // Subtle Y position change for breathing
      const breathYOffset = Math.sin(breathPhase * Math.PI * 2) * 0.2;
      const targetY = 5 + breathYOffset;
      
      if (cameraRef.current.position) {
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
      }
    }

    // Soft glow sweep across plaques (full and lite tiers)
    if (motionTier === 'full' || motionTier === 'lite') {
      // Sweep cycle: 6 seconds for full sweep across all plaques
      const sweepCycle = 6.0;
      const sweepPhase = (attractElapsed % sweepCycle) / sweepCycle;
      
      // Sweep position: 0 to 1 across the board
      // Use ease-in-out for smooth acceleration/deceleration
      const sweepPosition = sweepPhase < 0.5
        ? 2 * sweepPhase * sweepPhase
        : 1 - Math.pow(-2 * sweepPhase + 2, 2) / 2;
      
      // Glow intensity: peak when sweep passes over
      // Create a traveling wave of intensity
      const glowIntensity = Math.sin(sweepPhase * Math.PI) * 0.4 + 0.1; // Range: 0.1 to 0.5
      
      // Notify parent component of glow update
      if (onGlowUpdate) {
        onGlowUpdate(glowIntensity, sweepPosition);
      }
    }
  });

  // This component doesn't render anything visible
  return null;
};

export default AttractLoop;
