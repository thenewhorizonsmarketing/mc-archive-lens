import React, { useRef } from 'react';
import * as THREE from 'three';

/**
 * Lighting Component
 * 
 * Sets up the lighting for the 3D Clue Board scene with warm key light
 * from top-left and fill light from bottom-right.
 * 
 * Requirements:
 * - 1.6: Apply warm area light from top-left and fill light from bottom-right
 * - Optimize light shadow maps
 * - Keep draw calls minimal
 */

export interface LightingProps {
  /** Whether shadows should be enabled (based on motion tier) */
  enableShadows?: boolean;
  /** Intensity multiplier for all lights */
  intensity?: number;
}

export const Lighting: React.FC<LightingProps> = ({
  enableShadows = true,
  intensity = 1.0
}) => {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Ambient light - provides base illumination */}
      <ambientLight 
        intensity={0.3 * intensity} 
        color="#F5E6C8" // Warm cream accent color
      />

      {/* Key Light - Warm directional light from top-left */}
      <directionalLight
        ref={keyLightRef}
        position={[-5, 8, 5]} // Top-left position
        intensity={0.8 * intensity}
        color="#FFF5E1" // Warm white
        castShadow={enableShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />

      {/* Fill Light - Softer light from bottom-right */}
      <directionalLight
        ref={fillLightRef}
        position={[5, 3, -5]} // Bottom-right position
        intensity={0.4 * intensity}
        color="#E8D4B8" // Slightly warmer fill
        castShadow={false} // Fill light doesn't cast shadows for performance
      />

      {/* Subtle rim light from behind for depth */}
      <directionalLight
        position={[0, 2, -8]}
        intensity={0.2 * intensity}
        color="#CDAF63" // Brass accent color
        castShadow={false}
      />

      {/* Hemisphere light for subtle sky/ground color variation */}
      <hemisphereLight
        intensity={0.15 * intensity}
        color="#F5E6C8" // Sky color (warm cream)
        groundColor="#0E6B5C" // Ground color (board teal)
      />
    </>
  );
};

export default Lighting;
