import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * BoardFloor Component
 * 
 * Creates the 3×3 grid base with deep green marble PBR material.
 * This is the main playing surface of the Clue board.
 * 
 * Requirements:
 * - 1.1: Render 3×3 grid with 8 room tiles around edges and 1 center logo tile
 * - 1.4: Use deep green marble PBR material for the board floor
 * - 1.5: Display brass embossed nameplates for each room label
 */

export interface BoardFloorProps {
  /** Size of each grid tile */
  tileSize?: number;
  /** Gap between tiles */
  tileGap?: number;
  /** Thickness of the floor */
  thickness?: number;
}

export const BoardFloor: React.FC<BoardFloorProps> = ({
  tileSize = 3.5,
  tileGap = 0.15,
  thickness = 0.3
}) => {
  // Create marble texture procedurally
  const marbleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base deep green color
      ctx.fillStyle = '#0E6B5C';
      ctx.fillRect(0, 0, 1024, 1024);
      
      // Add marble veining
      const imageData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imageData.data;
      
      // Create Perlin-like noise for marble effect
      for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
          const i = (y * 1024 + x) * 4;
          
          // Create wavy patterns for marble veins
          const vein1 = Math.sin(x * 0.02 + y * 0.01) * 0.5 + 0.5;
          const vein2 = Math.sin(x * 0.015 - y * 0.02) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          
          const veinIntensity = (vein1 * vein2 + noise) * 40;
          
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
    texture.repeat.set(1, 1);
    
    return texture;
  }, []);

  // Create roughness map for marble
  const roughnessMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Marble is generally smooth but with some variation
      ctx.fillStyle = '#404040'; // Medium roughness
      ctx.fillRect(0, 0, 512, 512);
      
      // Add subtle variation
      const imageData = ctx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 30 - 15;
        const value = Math.max(0, Math.min(255, data[i] + noise));
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, []);

  // Create ambient occlusion map (baked)
  const aoMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Start with white (no occlusion)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      
      // Add darker areas around edges for depth
      const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 256);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.7, 'rgba(200, 200, 200, 1)');
      gradient.addColorStop(1, 'rgba(150, 150, 150, 1)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, []);

  // Marble PBR material
  const marbleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0E6B5C', // Deep green from color palette
      map: marbleTexture,
      roughness: 0.3, // Polished marble
      roughnessMap: roughnessMap,
      metalness: 0.0, // Marble is non-metallic
      aoMap: aoMap,
      aoMapIntensity: 0.5,
      // Add subtle emissive for depth
      emissive: '#0A4A3F',
      emissiveIntensity: 0.05
    });
  }, [marbleTexture, roughnessMap, aoMap]);

  // Create instanced mesh for all 9 tiles (reduces draw calls from 9 to 1)
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const tileGeometry = useMemo(() => {
    return new THREE.BoxGeometry(tileSize, thickness, tileSize);
  }, [tileSize, thickness]);

  // Setup instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const optimizer = getRenderingOptimizer();
    const totalSize = tileSize * 3 + tileGap * 2;
    const startPos = -totalSize / 2 + tileSize / 2;
    
    let index = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startPos + col * (tileSize + tileGap);
        const z = startPos + row * (tileSize + tileGap);
        
        optimizer.updateInstanceMatrix(
          instancedMeshRef.current,
          index,
          new THREE.Vector3(x, 0, z),
          new THREE.Euler(0, 0, 0),
          new THREE.Vector3(1, 1, 1)
        );
        
        index++;
      }
    }
  }, [tileSize, tileGap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (instancedMeshRef.current) {
        optimizer.disposeObject(instancedMeshRef.current);
      }
      tileGeometry.dispose();
      marbleTexture.dispose();
      roughnessMap.dispose();
      aoMap.dispose();
      marbleMaterial.dispose();
    };
  }, [tileGeometry, marbleTexture, roughnessMap, aoMap, marbleMaterial]);

  return (
    <group position={[0, -thickness / 2, 0]}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[tileGeometry, marbleMaterial, 9]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

export default BoardFloor;
