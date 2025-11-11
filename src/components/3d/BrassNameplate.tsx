import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * BrassNameplate Component
 * 
 * Creates an embossed brass nameplate with room title text.
 * Includes emissive properties for pulse effect on interaction.
 * 
 * Requirements:
 * - 1.5: Display brass embossed nameplates for each room label
 * - 1.7: Use brass color #CDAF63 from color palette
 * - 5.2: Trigger brass plaque emissive pulse lasting 300ms
 */

export interface BrassNameplateProps {
  /** Text to display on the nameplate */
  text: string;
  /** Width of the nameplate */
  width?: number;
  /** Height of the nameplate */
  height?: number;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Whether to trigger the pulse animation */
  isPulsing?: boolean;
  /** Callback when pulse animation completes */
  onPulseComplete?: () => void;
  /** Attract mode glow intensity (0-1) */
  attractGlowIntensity?: number;
  /** Current motion tier for performance optimization */
  motionTier?: 'full' | 'lite' | 'static';
}

export const BrassNameplate: React.FC<BrassNameplateProps> = ({
  text,
  width = 3.0,
  height = 0.6,
  position = [0, 0, 0],
  isPulsing = false,
  onPulseComplete,
  attractGlowIntensity = 0,
  motionTier = 'full'
}) => {
  const plateRef = useRef<THREE.Mesh>(null);
  const pulseStartTime = useRef<number>(0);
  const isPulsingRef = useRef(false);

  // Create embossed brass geometry
  const nameplateGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Create rounded rectangle for nameplate
    const cornerRadius = 0.05;
    const halfW = width / 2;
    const halfH = height / 2;
    
    shape.moveTo(-halfW + cornerRadius, -halfH);
    shape.lineTo(halfW - cornerRadius, -halfH);
    shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + cornerRadius);
    shape.lineTo(halfW, halfH - cornerRadius);
    shape.quadraticCurveTo(halfW, halfH, halfW - cornerRadius, halfH);
    shape.lineTo(-halfW + cornerRadius, halfH);
    shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - cornerRadius);
    shape.lineTo(-halfW, -halfH + cornerRadius);
    shape.quadraticCurveTo(-halfW, -halfH, -halfW + cornerRadius, -halfH);
    
    // Extrude with slight bevel for embossed effect
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 8
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Rotate to face upward
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
  }, [width, height]);

  // Brass material with PBR properties
  const brassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#CDAF63', // Brass color from palette
      roughness: 0.4, // Polished brass
      metalness: 0.9, // Highly metallic
      emissive: '#CDAF63',
      emissiveIntensity: 0.1, // Subtle base glow
      // Add slight ambient occlusion
      aoMapIntensity: 0.3
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (plateRef.current) {
        optimizer.disposeObject(plateRef.current);
      }
      nameplateGeometry.dispose();
      brassMaterial.dispose();
    };
  }, [nameplateGeometry, brassMaterial]);

  /**
   * Motion Tier Features (Requirement 6.2, 6.3, 6.4)
   * - Full tier: emissive pulses with full intensity
   * - Lite tier: emissive pulses with reduced intensity
   * - Static tier: no emissive pulses (cross-fade only)
   */
  useFrame(({ clock }) => {
    if (!plateRef.current) return;
    
    const material = plateRef.current.material as THREE.MeshStandardMaterial;
    
    // STATIC TIER: No emissive pulses (Requirement 6.4)
    if (motionTier === 'static') {
      // Keep base intensity only
      const baseIntensity = attractGlowIntensity > 0 ? attractGlowIntensity * 0.15 : 0.05;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        baseIntensity,
        0.1
      );
      return;
    }
    
    // FULL & LITE TIERS: Emissive pulses enabled (Requirements 6.2, 6.3)
    // Start pulse when isPulsing becomes true
    if (isPulsing && !isPulsingRef.current) {
      isPulsingRef.current = true;
      pulseStartTime.current = clock.getElapsedTime();
    }
    
    // Animate pulse (takes priority over attract glow)
    if (isPulsingRef.current) {
      const elapsed = clock.getElapsedTime() - pulseStartTime.current;
      const pulseDuration = 0.3; // 300ms as per requirement
      
      if (elapsed < pulseDuration) {
        // Pulse up and down using sine wave
        const progress = elapsed / pulseDuration;
        // Full tier: full intensity, Lite tier: reduced intensity
        const maxIntensity = motionTier === 'full' ? 0.7 : 0.5;
        const intensity = 0.1 + Math.sin(progress * Math.PI) * (maxIntensity - 0.1);
        material.emissiveIntensity = intensity;
      } else {
        // Pulse complete, reset
        material.emissiveIntensity = 0.1;
        isPulsingRef.current = false;
        if (onPulseComplete) {
          onPulseComplete();
        }
      }
    } else if (attractGlowIntensity > 0) {
      // Apply attract mode glow when not pulsing
      // Full tier: full glow, Lite tier: reduced glow
      const glowMultiplier = motionTier === 'full' ? 0.3 : 0.2;
      material.emissiveIntensity = 0.1 + attractGlowIntensity * glowMultiplier;
    } else {
      // Default base intensity
      material.emissiveIntensity = 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Brass plate */}
      <mesh
        ref={plateRef}
        geometry={nameplateGeometry}
        material={brassMaterial}
        castShadow
        receiveShadow
      />
      
      {/* Embossed text */}
      <Text
        position={[0, 0.08, 0]} // Slightly above the plate
        rotation={[-Math.PI / 2, 0, 0]} // Face upward
        fontSize={0.25}
        maxWidth={width - 0.2}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        font="/fonts/cinzel-regular.woff" // Elegant serif font
        anchorX="center"
        anchorY="middle"
        color="#3D2318" // Dark brown for contrast
        outlineWidth={0.01}
        outlineColor="#CDAF63"
      >
        {text}
      </Text>
      
      {/* Subtle shadow/depth under text */}
      <Text
        position={[0, 0.06, 0]} // Below the main text
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        maxWidth={width - 0.2}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        font="/fonts/cinzel-regular.woff"
        anchorX="center"
        anchorY="middle"
        color="#000000"
        fillOpacity={0.2}
      >
        {text}
      </Text>
    </group>
  );
};

export default BrassNameplate;
