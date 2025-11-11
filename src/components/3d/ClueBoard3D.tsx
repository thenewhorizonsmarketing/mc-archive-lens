import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomDefinition, MotionTier } from '@/types/kiosk-config';
import { WalnutFrame } from './WalnutFrame';
import { GlassPane } from './GlassPane';
import { BoardFloor } from './BoardFloor';
import { RoomTile3D } from './RoomTile3D';
import { BrassNameplate } from './BrassNameplate';
import { CenterLogoTile } from './CenterLogoTile';
import { calculateGridPosition, isEdgePosition, getCenterPosition } from './gridPositions';

/**
 * ClueBoard3D Component
 * 
 * Main 3D board component that composes the walnut frame, glass pane,
 * and marble board floor into the complete "Clue board in a display box" effect.
 * 
 * Requirements:
 * - 1.1: Render 3×3 grid with 8 room tiles around edges and 1 center logo tile
 * - 1.2: Display beveled walnut frame with rounded corners
 * - 1.3: Apply slightly reflective glass pane effect
 * - 1.4: Use deep green marble PBR material for the board floor
 */

export interface ClueBoard3DProps {
  /** Room definitions for the 8 room tiles */
  rooms: RoomDefinition[];
  /** Callback when a tile is clicked */
  onTileClick?: (roomId: string) => void;
  /** Whether a transition is in progress */
  isTransitioning?: boolean;
  /** Current motion tier for performance optimization */
  motionTier?: MotionTier;
  /** Attract mode glow intensity (0-1) */
  attractGlowIntensity?: number;
  /** Attract mode sweep position (0-1) */
  attractSweepPosition?: number;
}

export const ClueBoard3D: React.FC<ClueBoard3DProps> = ({
  rooms,
  onTileClick,
  isTransitioning = false,
  motionTier = 'full',
  attractGlowIntensity = 0,
  attractSweepPosition = 0
}) => {
  // Board dimensions
  const boardWidth = 12;
  const boardHeight = 12;
  const frameDepth = 0.8;
  const frameWidth = 1.2;
  const tileSize = 3.5;
  const tileGap = 0.15;
  const thickness = 0.3;

  // Track which tile is being pulsed
  const [pulsingTileId, setPulsingTileId] = useState<string | null>(null);
  
  // Track hovered tile for parallax effect
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  
  // Track keyboard-focused tile
  const [keyboardFocusedTileId, setKeyboardFocusedTileId] = useState<string | null>(null);
  
  // Ref for board group to apply tilt
  const boardGroupRef = useRef<THREE.Group>(null);

  // Handle tile click
  const handleTileClick = (roomId: string) => {
    if (!isTransitioning) {
      // Trigger pulse animation (full and lite tiers only)
      if (motionTier !== 'static') {
        setPulsingTileId(roomId);
      }
      
      // Call parent callback
      if (onTileClick) {
        onTileClick(roomId);
      }
    }
  };

  // Handle pulse complete
  const handlePulseComplete = () => {
    setPulsingTileId(null);
  };
  
  // Handle tile hover for parallax effect
  const handleTileHover = (roomId: string | null) => {
    if (motionTier !== 'static') {
      setHoveredTileId(roomId);
    }
  };

  // Listen for keyboard focus events
  React.useEffect(() => {
    const handleKeyboardFocus = (event: Event) => {
      const customEvent = event as CustomEvent<{ roomId: string }>;
      setKeyboardFocusedTileId(customEvent.detail.roomId);
    };

    window.addEventListener('keyboard-room-focus', handleKeyboardFocus);
    return () => {
      window.removeEventListener('keyboard-room-focus', handleKeyboardFocus);
    };
  }, []);

  // Filter rooms to only edge positions (8 rooms)
  const edgeRooms = rooms.filter(room => isEdgePosition(room.position));

  /**
   * Calculate glow intensity for a specific tile based on sweep position
   * The sweep moves across tiles in order, creating a wave effect
   */
  const calculateTileGlowIntensity = (tileIndex: number): number => {
    if (attractGlowIntensity === 0) return 0;
    
    // Map sweep position (0-1) to tile index (0-7)
    const sweepTilePosition = attractSweepPosition * (edgeRooms.length - 1);
    
    // Calculate distance from current sweep position
    const distance = Math.abs(sweepTilePosition - tileIndex);
    
    // Create a falloff: tiles near the sweep position glow more
    const falloff = Math.max(0, 1 - distance / 2); // Glow spreads across 2 tiles
    
    return attractGlowIntensity * falloff;
  };
  
  /**
   * Motion Tier Features (Requirement 6.2, 6.3, 6.4)
   * - Full tier: board tilt + parallax + emissive pulses
   * - Lite tier: parallax only, no tilt
   * - Static tier: cross-fade highlights only
   */
  useFrame((state) => {
    if (!boardGroupRef.current) return;
    
    const group = boardGroupRef.current;
    
    // FULL TIER: Board tilt + parallax (Requirement 6.2)
    if (motionTier === 'full') {
      // Gentle breathing tilt effect
      const time = state.clock.getElapsedTime();
      const breatheTiltX = Math.sin(time * 0.3) * 0.02; // Subtle X-axis tilt
      const breatheTiltZ = Math.cos(time * 0.4) * 0.015; // Subtle Z-axis tilt
      
      // Apply parallax effect when hovering over a tile
      let parallaxX = 0;
      let parallaxZ = 0;
      
      if (hoveredTileId) {
        const hoveredRoom = edgeRooms.find(r => r.id === hoveredTileId);
        if (hoveredRoom) {
          const [tileX, , tileZ] = calculateGridPosition(hoveredRoom.position, tileSize, tileGap, 0);
          // Subtle parallax shift toward the hovered tile
          parallaxX = tileX * 0.02;
          parallaxZ = tileZ * 0.02;
        }
      }
      
      // Smoothly interpolate rotation
      const targetRotationX = breatheTiltX + parallaxZ;
      const targetRotationZ = breatheTiltZ - parallaxX;
      
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotationX, 0.1);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotationZ, 0.1);
    }
    // LITE TIER: Parallax only, no tilt (Requirement 6.3)
    else if (motionTier === 'lite') {
      // Apply parallax effect when hovering over a tile
      let parallaxX = 0;
      let parallaxZ = 0;
      
      if (hoveredTileId) {
        const hoveredRoom = edgeRooms.find(r => r.id === hoveredTileId);
        if (hoveredRoom) {
          const [tileX, , tileZ] = calculateGridPosition(hoveredRoom.position, tileSize, tileGap, 0);
          // Subtle parallax shift toward the hovered tile
          parallaxX = tileX * 0.015;
          parallaxZ = tileZ * 0.015;
        }
      }
      
      // Smoothly interpolate rotation (parallax only, no breathing)
      const targetRotationX = parallaxZ;
      const targetRotationZ = -parallaxX;
      
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotationX, 0.1);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotationZ, 0.1);
    }
    // STATIC TIER: No tilt or parallax (Requirement 6.4)
    else {
      // Reset rotation to neutral
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, 0.1);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
    }
  });

  return (
    <group ref={boardGroupRef} position={[0, 0, 0]}>
      {/* Walnut Frame - surrounds the board */}
      <WalnutFrame
        width={boardWidth}
        height={boardHeight}
        depth={frameDepth}
        bevelSize={0.15}
        cornerRadius={0.2}
        frameWidth={frameWidth}
      />

      {/* Board Floor - 3×3 grid of marble tiles */}
      <BoardFloor
        tileSize={tileSize}
        tileGap={tileGap}
        thickness={thickness}
      />

      {/* Glass Pane - sits above the board for display case effect */}
      {motionTier !== 'static' && (
        <GlassPane
          width={boardWidth}
          height={boardHeight}
          position={[0, 0.5, 0]}
          opacity={0.15}
          reflectivity={motionTier === 'full' ? 0.3 : 0.15}
        />
      )}

      {/* Room Tiles - 8 tiles around the edges */}
      {edgeRooms.map((room, index) => {
        const position = calculateGridPosition(room.position, tileSize, tileGap, 0);
        const tileGlowIntensity = calculateTileGlowIntensity(index);
        
        return (
          <group key={room.id}>
            {/* Room Tile */}
            <RoomTile3D
              room={room}
              position={position}
              onClick={() => handleTileClick(room.id)}
              onHover={(isHovered) => handleTileHover(isHovered ? room.id : null)}
              isZooming={isTransitioning}
              motionTier={motionTier}
              tileSize={tileSize}
              thickness={thickness}
              attractGlowIntensity={tileGlowIntensity}
              isKeyboardFocused={keyboardFocusedTileId === room.id}
            />
            
            {/* Brass Nameplate */}
            <BrassNameplate
              text={room.title}
              width={tileSize - 0.5}
              height={0.6}
              position={[position[0], position[1] + thickness + 0.05, position[2]]}
              isPulsing={pulsingTileId === room.id}
              onPulseComplete={handlePulseComplete}
              attractGlowIntensity={tileGlowIntensity}
              motionTier={motionTier}
            />
          </group>
        );
      })}

      {/* Center Logo Tile */}
      <CenterLogoTile
        position={calculateGridPosition(getCenterPosition(), tileSize, tileGap, 0)}
        tileSize={tileSize}
        thickness={thickness}
      />
    </group>
  );
};

export default ClueBoard3D;
