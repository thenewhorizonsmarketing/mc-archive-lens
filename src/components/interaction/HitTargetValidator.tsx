import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * HitTargetValidator Component
 * 
 * Validates that all interactive 3D elements meet the minimum
 * 56px hit target size requirement for accessibility.
 * 
 * Requirements:
 * - 3.1: Minimum 56px hit target size for all interactive elements
 */

export interface HitTargetValidatorProps {
  /** Minimum hit target size in pixels */
  minSize?: number;
  /** Whether to show visual debug overlays */
  debug?: boolean;
  /** Whether to log validation results to console */
  verbose?: boolean;
}

interface HitTargetInfo {
  object: THREE.Object3D;
  screenSize: { width: number; height: number };
  worldSize: { width: number; height: number; depth: number };
  isValid: boolean;
}

const MIN_HIT_TARGET_SIZE = 56; // pixels

export const HitTargetValidator: React.FC<HitTargetValidatorProps> = ({
  minSize = MIN_HIT_TARGET_SIZE,
  debug = false,
  verbose = true
}) => {
  const { scene, camera, gl } = useThree();
  const validationResults = useRef<HitTargetInfo[]>([]);

  /**
   * Calculate screen-space size of a 3D object
   */
  const calculateScreenSize = (object: THREE.Object3D): { width: number; height: number } => {
    // Get bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Get center point
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Project corners to screen space
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z)
    ];

    // Project all corners to screen space
    const screenCorners = corners.map(corner => {
      const projected = corner.clone().project(camera);
      const canvas = gl.domElement;
      return {
        x: (projected.x * 0.5 + 0.5) * canvas.width,
        y: (-(projected.y * 0.5) + 0.5) * canvas.height
      };
    });

    // Find min/max screen coordinates
    const minX = Math.min(...screenCorners.map(c => c.x));
    const maxX = Math.max(...screenCorners.map(c => c.x));
    const minY = Math.min(...screenCorners.map(c => c.y));
    const maxY = Math.max(...screenCorners.map(c => c.y));

    return {
      width: maxX - minX,
      height: maxY - minY
    };
  };

  /**
   * Validate all interactive objects in the scene
   */
  const validateHitTargets = () => {
    const results: HitTargetInfo[] = [];

    // Find all objects with roomId userData (interactive elements)
    scene.traverse((object) => {
      if (object.userData && object.userData.roomId) {
        // Calculate screen size
        const screenSize = calculateScreenSize(object);

        // Get world size
        const box = new THREE.Box3().setFromObject(object);
        const worldSize = new THREE.Vector3();
        box.getSize(worldSize);

        // Check if meets minimum size
        const isValid = screenSize.width >= minSize && screenSize.height >= minSize;

        const info: HitTargetInfo = {
          object,
          screenSize,
          worldSize: {
            width: worldSize.x,
            height: worldSize.y,
            depth: worldSize.z
          },
          isValid
        };

        results.push(info);

        // Log if verbose
        if (verbose) {
          const status = isValid ? '✓' : '✗';
          console.log(
            `[HitTargetValidator] ${status} Room: ${object.userData.roomId}`,
            `Screen: ${screenSize.width.toFixed(1)}px × ${screenSize.height.toFixed(1)}px`,
            `World: ${worldSize.x.toFixed(2)} × ${worldSize.y.toFixed(2)} × ${worldSize.z.toFixed(2)}`
          );
        }
      }
    });

    validationResults.current = results;

    // Summary
    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;

    if (verbose) {
      console.log(
        `[HitTargetValidator] Summary: ${validCount}/${results.length} targets valid`,
        invalidCount > 0 ? `(${invalidCount} need adjustment)` : ''
      );
    }

    return results;
  };

  /**
   * Run validation on mount and when camera/scene changes
   */
  useEffect(() => {
    // Wait for scene to be fully loaded
    const timer = setTimeout(() => {
      validateHitTargets();
    }, 1000);

    return () => clearTimeout(timer);
  }, [scene, camera, gl]);

  // No visual output in production
  if (!debug) {
    return null;
  }

  // Debug visualization (optional)
  return null;
};

/**
 * Hook to validate hit targets programmatically
 */
export const useHitTargetValidation = (minSize: number = MIN_HIT_TARGET_SIZE) => {
  const { scene, camera, gl } = useThree();

  const validate = React.useCallback(() => {
    const results: Array<{
      roomId: string;
      screenWidth: number;
      screenHeight: number;
      isValid: boolean;
    }> = [];

    scene.traverse((object) => {
      if (object.userData && object.userData.roomId) {
        // Get bounding box
        const box = new THREE.Box3().setFromObject(object);
        
        // Project corners to screen space
        const corners = [
          new THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new THREE.Vector3(box.max.x, box.max.y, box.max.z)
        ];

        const screenCorners = corners.map(corner => {
          const projected = corner.clone().project(camera);
          const canvas = gl.domElement;
          return {
            x: (projected.x * 0.5 + 0.5) * canvas.width,
            y: (-(projected.y * 0.5) + 0.5) * canvas.height
          };
        });

        const width = Math.abs(screenCorners[1].x - screenCorners[0].x);
        const height = Math.abs(screenCorners[1].y - screenCorners[0].y);

        results.push({
          roomId: object.userData.roomId,
          screenWidth: width,
          screenHeight: height,
          isValid: width >= minSize && height >= minSize
        });
      }
    });

    return results;
  }, [scene, camera, gl, minSize]);

  return { validate };
};

export default HitTargetValidator;
