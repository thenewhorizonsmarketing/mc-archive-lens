import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * CenterLogoTile Component
 * 
 * Creates the center branding tile for the 3×3 grid.
 * Features the MC Law logo and branding with elegant styling.
 * 
 * Requirements:
 * - 1.1: Render center logo tile in 3×3 grid
 */

export interface CenterLogoTileProps {
  /** 3D position in the scene */
  position?: [number, number, number];
  /** Size of the tile */
  tileSize?: number;
  /** Thickness of the tile */
  thickness?: number;
}

export const CenterLogoTile: React.FC<CenterLogoTileProps> = ({
  position = [0, 0, 0],
  tileSize = 3.5,
  thickness = 0.3
}) => {
  // Create special marble texture for center tile (lighter, more elegant)
  const centerMarbleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Use accent color for center tile
      ctx.fillStyle = '#F5E6C8'; // Cream accent from palette
      ctx.fillRect(0, 0, 512, 512);
      
      // Add subtle marble veining
      const imageData = ctx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
          const i = (y * 512 + x) * 4;
          
          // Create subtle wavy patterns
          const vein1 = Math.sin(x * 0.02 + y * 0.015) * 0.5 + 0.5;
          const vein2 = Math.sin(x * 0.018 - y * 0.022) * 0.5 + 0.5;
          const noise = Math.random() * 0.2;
          
          const veinIntensity = (vein1 * vein2 + noise) * 20;
          
          // Apply subtle darkening for veins
          data[i] = Math.max(0, data[i] - veinIntensity); // R
          data[i + 1] = Math.max(0, data[i + 1] - veinIntensity * 0.9); // G
          data[i + 2] = Math.max(0, data[i + 2] - veinIntensity * 0.8); // B
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, []);

  // Elegant marble material for center tile
  const centerMarbleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#F5E6C8', // Cream accent
      map: centerMarbleTexture,
      roughness: 0.25, // More polished than other tiles
      metalness: 0.0,
      emissive: '#F5E6C8',
      emissiveIntensity: 0.1, // Subtle glow
    });
  }, [centerMarbleTexture]);

  // Create decorative border geometry
  const borderGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Outer square
    const outerSize = tileSize * 0.9;
    const halfOuter = outerSize / 2;
    
    shape.moveTo(-halfOuter, -halfOuter);
    shape.lineTo(halfOuter, -halfOuter);
    shape.lineTo(halfOuter, halfOuter);
    shape.lineTo(-halfOuter, halfOuter);
    shape.lineTo(-halfOuter, -halfOuter);
    
    // Inner square (hole)
    const innerSize = tileSize * 0.75;
    const halfInner = innerSize / 2;
    
    const hole = new THREE.Path();
    hole.moveTo(-halfInner, -halfInner);
    hole.lineTo(halfInner, -halfInner);
    hole.lineTo(halfInner, halfInner);
    hole.lineTo(-halfInner, halfInner);
    hole.lineTo(-halfInner, -halfInner);
    
    shape.holes.push(hole);
    
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.02,
      bevelEnabled: false
    });
    
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
  }, [tileSize]);

  // Brass material for border
  const brassBorderMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#CDAF63', // Brass from palette
      roughness: 0.4,
      metalness: 0.9,
      emissive: '#CDAF63',
      emissiveIntensity: 0.15
    });
  }, []);

  const mainMeshRef = useRef<THREE.Mesh>(null);
  const borderMeshRef = useRef<THREE.Mesh>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (mainMeshRef.current) {
        optimizer.disposeObject(mainMeshRef.current);
      }
      if (borderMeshRef.current) {
        optimizer.disposeObject(borderMeshRef.current);
      }
      centerMarbleTexture.dispose();
      centerMarbleMaterial.dispose();
      borderGeometry.dispose();
      brassBorderMaterial.dispose();
    };
  }, [centerMarbleTexture, centerMarbleMaterial, borderGeometry, brassBorderMaterial]);

  return (
    <group position={position}>
      {/* Main center tile */}
      <mesh
        ref={mainMeshRef}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[tileSize, thickness, tileSize]} />
        <primitive object={centerMarbleMaterial} attach="material" />
      </mesh>

      {/* Decorative brass border */}
      <mesh
        ref={borderMeshRef}
        position={[0, thickness / 2 + 0.02, 0]}
        geometry={borderGeometry}
        material={brassBorderMaterial}
        castShadow
      />

      {/* MC Law branding text */}
      <Text
        position={[0, thickness / 2 + 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.4}
        maxWidth={tileSize - 1}
        lineHeight={1.2}
        letterSpacing={0.05}
        textAlign="center"
        font="/fonts/cinzel-regular.woff"
        anchorX="center"
        anchorY="middle"
        color="#6B3F2B" // Walnut brown for contrast
        outlineWidth={0.005}
        outlineColor="#CDAF63"
      >
        MC LAW
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, thickness / 2 + 0.08, 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        maxWidth={tileSize - 1}
        lineHeight={1}
        letterSpacing={0.08}
        textAlign="center"
        font="/fonts/cinzel-regular.woff"
        anchorX="center"
        anchorY="middle"
        color="#6B3F2B"
        fillOpacity={0.8}
      >
        MUSEUM & ARCHIVES
      </Text>

      {/* Decorative corner elements */}
      {[
        [-tileSize * 0.35, tileSize * 0.35],
        [tileSize * 0.35, tileSize * 0.35],
        [-tileSize * 0.35, -tileSize * 0.35],
        [tileSize * 0.35, -tileSize * 0.35]
      ].map(([x, z], index) => (
        <mesh
          key={`corner-${index}`}
          position={[x, thickness / 2 + 0.03, z]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <primitive object={brassBorderMaterial} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

export default CenterLogoTile;
