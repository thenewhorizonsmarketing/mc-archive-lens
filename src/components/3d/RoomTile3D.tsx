import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RoomDefinition, MotionTier } from '@/types/kiosk-config';
import { useKioskStore } from '@/store/kioskStore';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * RoomTile3D Component
 * 
 * Interactive 3D room tile with marble floor material, hover states,
 * and click handling for navigation.
 * 
 * Requirements:
 * - 1.1: Render room tiles in 3×3 grid
 * - 3.2: Navigate to corresponding section on tap
 * - 5.1: Lock input during transitions
 * - 5.6: Guard against additional tap inputs during transitions
 */

export interface RoomTile3DProps {
  /** Room definition with title, route, etc. */
  room: RoomDefinition;
  /** 3D position in the scene */
  position: [number, number, number];
  /** Callback when tile is clicked */
  onClick?: () => void;
  /** Callback when tile hover state changes */
  onHover?: (isHovered: boolean) => void;
  /** Whether the tile is currently hovered */
  isHovered?: boolean;
  /** Whether a zoom transition is in progress */
  isZooming?: boolean;
  /** Current motion tier for performance optimization */
  motionTier?: MotionTier;
  /** Size of the tile */
  tileSize?: number;
  /** Thickness of the tile */
  thickness?: number;
  /** Attract mode glow intensity (0-1) */
  attractGlowIntensity?: number;
  /** Whether the tile is focused via keyboard navigation */
  isKeyboardFocused?: boolean;
}

export const RoomTile3D: React.FC<RoomTile3DProps> = ({
  room,
  position,
  onClick,
  onHover,
  isHovered = false,
  isZooming = false,
  motionTier = 'full',
  tileSize = 3.5,
  thickness = 0.3,
  attractGlowIntensity = 0,
  isKeyboardFocused = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [localHovered, setLocalHovered] = useState(false);
  const hoverState = isHovered || localHovered || isKeyboardFocused;
  
  // Get input lock state from store (requirement 5.1, 5.6)
  const inputLocked = useKioskStore((state) => state.inputLocked);
  
  // Track highlight opacity for static tier cross-fade
  const highlightOpacityRef = useRef(0);

  // Create marble texture procedurally (similar to BoardFloor but per-tile)
  const marbleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Use room color as base or default to deep green
      const baseColor = room.color || '#0E6B5C';
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 512, 512);
      
      // Add marble veining
      const imageData = ctx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      // Create Perlin-like noise for marble effect
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
          const i = (y * 512 + x) * 4;
          
          // Create wavy patterns for marble veins
          const vein1 = Math.sin(x * 0.03 + y * 0.02) * 0.5 + 0.5;
          const vein2 = Math.sin(x * 0.025 - y * 0.03) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          
          const veinIntensity = (vein1 * vein2 + noise) * 30;
          
          // Apply veining to create lighter streaks
          data[i] = Math.min(255, data[i] + veinIntensity); // R
          data[i + 1] = Math.min(255, data[i + 1] + veinIntensity * 1.2); // G
          data[i + 2] = Math.min(255, data[i + 2] + veinIntensity * 1.1); // B
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [room.color]);

  // Marble PBR material with hover effect
  const marbleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: room.color || '#0E6B5C',
      map: marbleTexture,
      roughness: 0.3,
      metalness: 0.0,
      emissive: room.color || '#0E6B5C',
      emissiveIntensity: 0.0, // Will be animated on hover
    });
  }, [room.color, marbleTexture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (meshRef.current) {
        optimizer.disposeObject(meshRef.current);
      }
      marbleTexture.dispose();
      marbleMaterial.dispose();
    };
  }, [marbleTexture, marbleMaterial]);

  /**
   * Motion Tier Features (Requirement 6.2, 6.3, 6.4)
   * - Full tier: emissive pulses + subtle lift
   * - Lite tier: emissive pulses only
   * - Static tier: cross-fade highlights only
   */
  useFrame(() => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    
    // FULL TIER: Emissive pulses + subtle lift (Requirement 6.2)
    if (motionTier === 'full') {
      // Smoothly transition emissive intensity on hover
      const baseIntensity = attractGlowIntensity > 0 ? attractGlowIntensity * 0.3 : 0.05;
      const targetIntensity = hoverState ? 0.2 : baseIntensity;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        targetIntensity,
        0.1
      );

      // Subtle lift on hover
      const targetY = hoverState ? position[1] + 0.1 : position[1];
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.1
      );
    }
    // LITE TIER: Emissive pulses only, no lift (Requirement 6.3)
    else if (motionTier === 'lite') {
      // Smoothly transition emissive intensity on hover
      const baseIntensity = attractGlowIntensity > 0 ? attractGlowIntensity * 0.3 : 0.05;
      const targetIntensity = hoverState ? 0.2 : baseIntensity;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        targetIntensity,
        0.1
      );
      
      // Keep tile at original position (no lift)
      meshRef.current.position.y = position[1];
    }
    // STATIC TIER: Cross-fade highlights only (Requirement 6.4)
    else {
      // Use opacity-based highlight instead of emissive
      const targetOpacity = hoverState ? 0.3 : 0;
      highlightOpacityRef.current = THREE.MathUtils.lerp(
        highlightOpacityRef.current,
        targetOpacity,
        0.1
      );
      
      // Apply subtle brightness change via emissive (very subtle)
      const baseIntensity = attractGlowIntensity > 0 ? attractGlowIntensity * 0.2 : 0;
      const targetIntensity = hoverState ? 0.1 : baseIntensity;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        targetIntensity,
        0.15
      );
      
      // Keep tile at original position
      meshRef.current.position.y = position[1];
    }
  });

  const handlePointerOver = (e: THREE.Event) => {
    e.stopPropagation();
    // Don't show hover state if input is locked
    if (!isZooming && !inputLocked) {
      setLocalHovered(true);
      document.body.style.cursor = 'pointer';
      // Notify parent of hover state for parallax effect
      if (onHover) {
        onHover(true);
      }
    }
  };

  const handlePointerOut = (e: THREE.Event) => {
    e.stopPropagation();
    setLocalHovered(false);
    document.body.style.cursor = 'default';
    // Notify parent of hover state for parallax effect
    if (onHover) {
      onHover(false);
    }
  };

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    // Block clicks when input is locked (requirement 5.1, 5.6)
    if (!isZooming && !inputLocked && onClick) {
      console.log('[RoomTile3D] Tile clicked:', room.id);
      onClick();
    } else if (inputLocked) {
      console.log('[RoomTile3D] Click blocked - input locked');
    }
  };

  return (
    <group position={position} userData={{ roomId: room.id }}>
      {/* Main tile mesh */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        userData={{ roomId: room.id }}
      >
        <boxGeometry args={[tileSize, thickness, tileSize]} />
        <primitive object={marbleMaterial} attach="material" />
      </mesh>

      {/* Static tier: Cross-fade highlight overlay (Requirement 6.4) */}
      {motionTier === 'static' && (
        <mesh
          position={[0, thickness / 2 + 0.01, 0]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[tileSize, thickness + 0.02, tileSize]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={highlightOpacityRef.current}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Invisible hit box for better touch targeting (56px minimum) */}
      <mesh
        position={[0, thickness, 0]}
        visible={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        userData={{ roomId: room.id }}
      >
        <boxGeometry args={[tileSize, 1.0, tileSize]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

export default RoomTile3D;
