import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * GlassPane Component
 * 
 * Creates a slightly reflective glass pane that sits over the board,
 * giving the "display case" effect with subtle reflections and fingerprint texture.
 * 
 * Requirements:
 * - 1.3: Apply slightly reflective glass pane effect using cube-mapped reflection and roughness map
 * - Optimize for performance
 */

export interface GlassPaneProps {
  /** Width of the glass pane */
  width?: number;
  /** Height of the glass pane */
  height?: number;
  /** Position above the board */
  position?: [number, number, number];
  /** Opacity of the glass (0-1) */
  opacity?: number;
  /** Reflection intensity */
  reflectivity?: number;
}

export const GlassPane: React.FC<GlassPaneProps> = ({
  width = 12,
  height = 12,
  position = [0, 0.5, 0],
  opacity = 0.15,
  reflectivity = 0.3
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create glass geometry
  const glassGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, 1, 1);
  }, [width, height]);

  // Create environment map for reflections
  const envMap = useMemo(() => {
    // Create a simple cube texture for reflections
    // In production, this would be loaded from actual environment textures
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    
    return cubeRenderTarget.texture;
  }, []);

  // Create procedural roughness map for fingerprint effect
  const roughnessMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base gray
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, 512, 512);
      
      // Add subtle noise for fingerprint/smudge effect
      const imageData = ctx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 40 - 20; // Random variation
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      
      // Add some circular smudges (fingerprints)
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 20 + Math.random() * 30;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.3)');
        gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, []);

  // Create normal map for subtle surface variation
  const normalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Base normal color (pointing up: RGB = 128, 128, 255)
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, 512, 512);
      
      // Add subtle variations
      const imageData = ctx.getImageData(0, 0, 512, 512);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 10 - 5;
        data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        // Keep Z (blue) channel mostly pointing up
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, []);

  // Glass material with reflections
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.1,
      roughnessMap: roughnessMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      envMap: envMap,
      envMapIntensity: reflectivity,
      transparent: true,
      opacity: opacity,
      transmission: 0.9, // Glass transmission
      thickness: 0.5, // Glass thickness for refraction
      ior: 1.5, // Index of refraction for glass
      clearcoat: 0.3, // Clearcoat layer for extra shine
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false // Optimize transparency rendering
    });
  }, [roughnessMap, normalMap, envMap, reflectivity, opacity]);

  // Subtle animation for attract mode (optional)
  useFrame((state) => {
    if (meshRef.current) {
      // Very subtle breathing effect on the glass
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.02;
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (meshRef.current) {
        optimizer.disposeObject(meshRef.current);
      }
      glassGeometry.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
      envMap.dispose();
      glassMaterial.dispose();
    };
  }, [glassGeometry, roughnessMap, normalMap, envMap, glassMaterial]);

  return (
    <mesh
      ref={meshRef}
      geometry={glassGeometry}
      material={glassMaterial}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1} // Render after opaque objects
    />
  );
};

export default GlassPane;
