import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { usePerformanceStore } from '@/store/performanceStore';
import { useKioskStore } from '@/store/kioskStore';
import { useIdleStore } from '@/store/idleStore';
import type { RoomDefinition } from '@/types/kiosk-config';
import { CameraController } from './CameraController';
import { Lighting } from './Lighting';
import { ClueBoard3D } from './ClueBoard3D';
import { AttractLoop } from '@/components/system/AttractLoop';
import { getRenderingOptimizer } from '@/lib/utils/rendering-optimizer';
import * as THREE from 'three';

/**
 * BoardScene Component
 * 
 * R3F Canvas wrapper that sets up the 3D scene with proper renderer configuration,
 * lighting, and performance monitoring.
 * 
 * Requirements:
 * - 1.1: Render 3×3 grid with 8 room tiles and 1 center logo tile
 * - 1.5: Display brass embossed nameplates
 * - 1.6: Apply warm area light from top-left and fill light from bottom-right
 * - 1.7: Use color palette and elegant typography
 */

export interface BoardSceneProps {
  rooms: RoomDefinition[];
  onRoomSelect: (roomId: string) => void;
  className?: string;
}

export const BoardScene: React.FC<BoardSceneProps> = ({
  rooms,
  onRoomSelect,
  className = ''
}) => {
  const motionTier = usePerformanceStore((state) => state.motionTier);
  const isTransitioning = useKioskStore((state) => state.isTransitioning);
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const updateFPS = usePerformanceStore((state) => state.updateFPS);
  const updateMetrics = usePerformanceStore((state) => state.updateMetrics);
  
  // State for attract mode glow
  const [attractGlowIntensity, setAttractGlowIntensity] = useState(0);
  const [attractSweepPosition, setAttractSweepPosition] = useState(0);
  const cameraRef = useRef<THREE.Camera>(null);

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      // Calculate FPS every second
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        updateFPS(fps);
        
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [updateFPS]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false
        }}
        shadows={motionTier === 'full'}
        flat={false}
        linear={false}
        dpr={[1, 2]}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 200
        }}
        onCreated={({ gl, scene }) => {
          // Optimize renderer
          const optimizer = getRenderingOptimizer();
          optimizer.optimizeRenderer(gl);
          
          gl.setClearColor('#000000', 1);
          
          console.log('[BoardScene] Renderer initialized:', {
            maxTextureSize: gl.capabilities.maxTextureSize,
            maxVertexUniforms: gl.capabilities.maxVertexUniforms,
            maxFragmentUniforms: gl.capabilities.maxFragmentUniforms
          });

          updateMetrics({
            drawCalls: 0,
            triangles: 0
          });
        }}
      >
        <SceneOptimizer 
          motionTier={motionTier}
          updateMetrics={updateMetrics}
        />
        
        <Lighting 
          enableShadows={motionTier === 'full'}
          intensity={1.0}
        />

        <CameraController
          isTransitioning={isTransitioning}
          targetRoom={useKioskStore.getState().targetRoute}
          motionTier={motionTier}
        />

        {isInAttractMode && (
          <AttractLoop
            cameraRef={cameraRef}
            motionTier={motionTier}
            onGlowUpdate={(intensity, position) => {
              setAttractGlowIntensity(intensity);
              setAttractSweepPosition(position);
            }}
          />
        )}

        <Suspense fallback={null}>
          <ClueBoard3D
            rooms={rooms}
            onTileClick={onRoomSelect}
            isTransitioning={isTransitioning}
            motionTier={motionTier}
            attractGlowIntensity={attractGlowIntensity}
            attractSweepPosition={attractSweepPosition}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

/**
 * SceneOptimizer Component
 * 
 * Handles frustum culling and performance monitoring within the R3F context
 */
interface SceneOptimizerProps {
  motionTier: 'full' | 'lite' | 'static';
  updateMetrics: (metrics: { drawCalls: number; triangles: number }) => void;
}

const SceneOptimizer: React.FC<SceneOptimizerProps> = ({ motionTier, updateMetrics }) => {
  const { camera, scene, gl } = useThree();
  const optimizer = getRenderingOptimizer();
  const frameCount = useRef(0);

  useEffect(() => {
    let animationFrameId: number;

    const optimizeFrame = () => {
      frameCount.current++;

      // Perform frustum culling every frame for full tier
      // Every 2 frames for lite tier
      // Every 4 frames for static tier
      const cullInterval = motionTier === 'full' ? 1 : motionTier === 'lite' ? 2 : 4;
      
      if (frameCount.current % cullInterval === 0) {
        optimizer.performFrustumCulling(camera, scene);
      }

      // Update metrics every 30 frames (~0.5 seconds at 60fps)
      if (frameCount.current % 30 === 0) {
        const stats = optimizer.getRenderStats(gl);
        updateMetrics({
          drawCalls: stats.drawCalls,
          triangles: stats.triangles
        });

        // Log warning if draw calls exceed target
        if (stats.drawCalls > 120) {
          console.warn('[SceneOptimizer] Draw calls exceed target:', stats.drawCalls);
        }
      }

      animationFrameId = requestAnimationFrame(optimizeFrame);
    };

    animationFrameId = requestAnimationFrame(optimizeFrame);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [camera, scene, gl, motionTier, optimizer, updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimizer.disposeScene(scene);
    };
  }, [scene, optimizer]);

  return null;
};

export default BoardScene;
