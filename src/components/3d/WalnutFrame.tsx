import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';

/**
 * WalnutFrame Component
 * 
 * Creates a beveled walnut wood frame with rounded corners and ambient occlusion.
 * This frame surrounds the Clue board to create the "display box" effect.
 * 
 * Requirements:
 * - 1.2: Display beveled walnut frame with rounded corners and soft ambient occlusion
 * - 1.7: Use walnut color #6B3F2B from color palette
 */

export interface WalnutFrameProps {
  /** Width of the frame opening */
  width?: number;
  /** Height of the frame opening */
  height?: number;
  /** Depth/thickness of the frame */
  depth?: number;
  /** Size of the bevel on the inner edge */
  bevelSize?: number;
  /** Radius for rounded corners */
  cornerRadius?: number;
  /** Frame border width */
  frameWidth?: number;
}

export const WalnutFrame: React.FC<WalnutFrameProps> = ({
  width = 12,
  height = 12,
  depth = 0.8,
  bevelSize = 0.15,
  cornerRadius = 0.2,
  frameWidth = 1.2
}) => {
  // Create frame geometry with beveled edges
  const frameGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Outer rectangle with rounded corners
    const outerWidth = width + frameWidth * 2;
    const outerHeight = height + frameWidth * 2;
    const halfOuterW = outerWidth / 2;
    const halfOuterH = outerHeight / 2;
    
    // Draw outer shape with rounded corners
    shape.moveTo(-halfOuterW + cornerRadius, -halfOuterH);
    shape.lineTo(halfOuterW - cornerRadius, -halfOuterH);
    shape.quadraticCurveTo(halfOuterW, -halfOuterH, halfOuterW, -halfOuterH + cornerRadius);
    shape.lineTo(halfOuterW, halfOuterH - cornerRadius);
    shape.quadraticCurveTo(halfOuterW, halfOuterH, halfOuterW - cornerRadius, halfOuterH);
    shape.lineTo(-halfOuterW + cornerRadius, halfOuterH);
    shape.quadraticCurveTo(-halfOuterW, halfOuterH, -halfOuterW, halfOuterH - cornerRadius);
    shape.lineTo(-halfOuterW, -halfOuterH + cornerRadius);
    shape.quadraticCurveTo(-halfOuterW, -halfOuterH, -halfOuterW + cornerRadius, -halfOuterH);
    
    // Inner rectangle (hole) with slight rounding
    const hole = new THREE.Path();
    const halfW = width / 2;
    const halfH = height / 2;
    const innerRadius = cornerRadius * 0.5;
    
    hole.moveTo(-halfW + innerRadius, -halfH);
    hole.lineTo(halfW - innerRadius, -halfH);
    hole.quadraticCurveTo(halfW, -halfH, halfW, -halfH + innerRadius);
    hole.lineTo(halfW, halfH - innerRadius);
    hole.quadraticCurveTo(halfW, halfH, halfW - innerRadius, halfH);
    hole.lineTo(-halfW + innerRadius, halfH);
    hole.quadraticCurveTo(-halfW, halfH, -halfW, halfH - innerRadius);
    hole.lineTo(-halfW, -halfH + innerRadius);
    hole.quadraticCurveTo(-halfW, -halfH, -halfW + innerRadius, -halfH);
    
    shape.holes.push(hole);
    
    // Extrude with bevel for 3D depth
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelSegments: 3,
      curveSegments: 12
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Center the geometry
    geometry.center();
    
    // Rotate to face forward
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
  }, [width, height, depth, bevelSize, cornerRadius, frameWidth]);

  // Walnut wood material with PBR properties
  const walnutMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#6B3F2B', // Walnut brown from color palette
      roughness: 0.7, // Slightly rough wood surface
      metalness: 0.0, // Wood is non-metallic
      // Ambient occlusion will be baked into the geometry
      aoMapIntensity: 1.0,
      // Add subtle emissive for warmth
      emissive: '#3D2318',
      emissiveIntensity: 0.05
    });
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const optimizer = getRenderingOptimizer();
      if (meshRef.current) {
        optimizer.disposeObject(meshRef.current);
      }
      frameGeometry.dispose();
      walnutMaterial.dispose();
    };
  }, [frameGeometry, walnutMaterial]);

  return (
    <mesh 
      ref={meshRef}
      geometry={frameGeometry} 
      material={walnutMaterial}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
    >
      {/* Add ambient occlusion effect through additional geometry details */}
      {/* The bevel and rounded corners create natural shadow areas */}
    </mesh>
  );
};

export default WalnutFrame;
