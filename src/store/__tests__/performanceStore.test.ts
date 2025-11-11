import { describe, it, expect, beforeEach } from 'vitest';
import { usePerformanceStore } from '../performanceStore';
import type { GPUCapabilities } from '@/lib/utils/gpu-detector';

describe('PerformanceStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePerformanceStore.setState({
      motionTier: 'full',
      initialMotionTier: 'full',
      autoTierEnabled: true,
      gpuCapabilities: null,
      currentFPS: 60,
      averageFPS: 60,
      targetFPS: 60,
      metrics: {
        fps: 60,
        frameTime: 16.67,
        drawCalls: 0,
        triangles: 0,
        memoryUsage: 0,
      },
      fpsHistory: [],
      maxHistoryLength: 60,
      webGLAvailable: true,
      webGLVersion: 2,
    });
  });

  describe('Motion Tier Management (Requirement 6.1, 6.2, 6.3, 6.4)', () => {
    it('should set motion tier', () => {
      const { setMotionTier } = usePerformanceStore.getState();
      
      setMotionTier('lite');
      
      expect(usePerformanceStore.getState().motionTier).toBe('lite');
    });

    it('should set initial motion tier', () => {
      const { setInitialMotionTier } = usePerformanceStore.getState();
      
      setInitialMotionTier('lite');
      
      const state = usePerformanceStore.getState();
      expect(state.initialMotionTier).toBe('lite');
      expect(state.motionTier).toBe('lite');
    });

    it('should enable/disable auto-tier', () => {
      const { setAutoTier } = usePerformanceStore.getState();
      
      setAutoTier(false);
      expect(usePerformanceStore.getState().autoTierEnabled).toBe(false);
      
      setAutoTier(true);
      expect(usePerformanceStore.getState().autoTierEnabled).toBe(true);
    });
  });

  describe('GPU Capabilities', () => {
    it('should store GPU capabilities', () => {
      const { setGPUCapabilities } = usePerformanceStore.getState();
      
      const capabilities: GPUCapabilities = {
        vendor: 'NVIDIA',
        renderer: 'GeForce GTX 1080',
        gpuTier: 3,
        webglVersion: 2,
        maxTextureSize: 16384,
        maxAnisotropy: 16,
        supportsFloatTextures: true,
        supportsDepthTexture: true,
      };
      
      setGPUCapabilities(capabilities);
      
      const state = usePerformanceStore.getState();
      expect(state.gpuCapabilities).toEqual(capabilities);
      expect(state.webGLAvailable).toBe(true);
      expect(state.webGLVersion).toBe(2);
    });
  });

  describe('FPS Tracking', () => {
    it('should update current FPS', () => {
      const { updateFPS } = usePerformanceStore.getState();
      
      updateFPS(55);
      
      expect(usePerformanceStore.getState().currentFPS).toBe(55);
    });

    it('should calculate average FPS', () => {
      const { updateFPS } = usePerformanceStore.getState();
      
      updateFPS(60);
      updateFPS(58);
      updateFPS(62);
      
      const state = usePerformanceStore.getState();
      expect(state.averageFPS).toBe(60); // (60 + 58 + 62) / 3
    });

    it('should maintain FPS history with max length', () => {
      const { updateFPS } = usePerformanceStore.getState();
      
      // Add 65 FPS readings
      for (let i = 0; i < 65; i++) {
        updateFPS(60);
      }
      
      const state = usePerformanceStore.getState();
      expect(state.fpsHistory.length).toBe(60); // Should cap at maxHistoryLength
    });
  });

  describe('Performance Metrics', () => {
    it('should update metrics', () => {
      const { updateMetrics } = usePerformanceStore.getState();
      
      updateMetrics({
        drawCalls: 100,
        triangles: 50000,
      });
      
      const state = usePerformanceStore.getState();
      expect(state.metrics.drawCalls).toBe(100);
      expect(state.metrics.triangles).toBe(50000);
      expect(state.metrics.fps).toBe(60); // Should preserve other metrics
    });

    it('should reset metrics', () => {
      const { updateMetrics, resetMetrics } = usePerformanceStore.getState();
      
      updateMetrics({
        drawCalls: 100,
        triangles: 50000,
      });
      
      resetMetrics();
      
      const state = usePerformanceStore.getState();
      expect(state.metrics.drawCalls).toBe(0);
      expect(state.metrics.triangles).toBe(0);
      expect(state.fpsHistory).toEqual([]);
      expect(state.currentFPS).toBe(60);
    });
  });

  describe('Auto-Downgrade (Requirement 6.5)', () => {
    it('should downgrade from full to lite when FPS drops below 55', () => {
      const { updateFPS, autoDowngradeTier } = usePerformanceStore.getState();
      
      // Simulate sustained low FPS
      for (let i = 0; i < 60; i++) {
        updateFPS(50);
      }
      
      autoDowngradeTier();
      
      expect(usePerformanceStore.getState().motionTier).toBe('lite');
    });

    it('should downgrade from lite to static when FPS drops below 45', () => {
      const { setMotionTier, updateFPS, autoDowngradeTier } = usePerformanceStore.getState();
      
      setMotionTier('lite');
      
      // Simulate sustained very low FPS
      for (let i = 0; i < 60; i++) {
        updateFPS(40);
      }
      
      autoDowngradeTier();
      
      expect(usePerformanceStore.getState().motionTier).toBe('static');
    });

    it('should not downgrade when auto-tier is disabled', () => {
      const { setAutoTier, updateFPS, autoDowngradeTier } = usePerformanceStore.getState();
      
      setAutoTier(false);
      
      // Simulate low FPS
      for (let i = 0; i < 60; i++) {
        updateFPS(50);
      }
      
      autoDowngradeTier();
      
      expect(usePerformanceStore.getState().motionTier).toBe('full'); // Should not change
    });

    it('should not downgrade when FPS is acceptable', () => {
      const { updateFPS, autoDowngradeTier } = usePerformanceStore.getState();
      
      // Simulate good FPS
      for (let i = 0; i < 60; i++) {
        updateFPS(58);
      }
      
      autoDowngradeTier();
      
      expect(usePerformanceStore.getState().motionTier).toBe('full'); // Should not change
    });
  });

  describe('WebGL Availability', () => {
    it('should set WebGL availability', () => {
      const { setWebGLAvailable } = usePerformanceStore.getState();
      
      setWebGLAvailable(false, 0);
      
      const state = usePerformanceStore.getState();
      expect(state.webGLAvailable).toBe(false);
      expect(state.webGLVersion).toBe(0);
    });
  });
});
