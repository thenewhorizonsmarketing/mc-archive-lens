import { create } from 'zustand';
import type { GPUCapabilities } from '@/lib/utils/gpu-detector';

/**
 * Performance State Store
 * Manages FPS tracking, motion tier, and performance metrics
 */

export type MotionTier = 'full' | 'lite' | 'static';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
}

interface PerformanceState {
  // Motion tier
  motionTier: MotionTier;
  initialMotionTier: MotionTier; // Store initial tier for reference
  autoTierEnabled: boolean;
  
  // GPU capabilities
  gpuCapabilities: GPUCapabilities | null;
  
  // Performance metrics
  currentFPS: number;
  averageFPS: number;
  targetFPS: number;
  metrics: PerformanceMetrics;
  
  // Performance history (for monitoring)
  fpsHistory: number[];
  maxHistoryLength: number;
  
  // WebGL availability
  webGLAvailable: boolean;
  webGLVersion: number;
  
  // Actions
  setMotionTier: (tier: MotionTier) => void;
  setInitialMotionTier: (tier: MotionTier) => void;
  setGPUCapabilities: (capabilities: GPUCapabilities) => void;
  setAutoTier: (enabled: boolean) => void;
  updateFPS: (fps: number) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setWebGLAvailable: (available: boolean, version?: number) => void;
  autoDowngradeTier: () => void;
  resetMetrics: () => void;
}

const DEFAULT_METRICS: PerformanceMetrics = {
  fps: 60,
  frameTime: 16.67,
  drawCalls: 0,
  triangles: 0,
  memoryUsage: 0
};

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  // Initial state
  motionTier: 'full',
  initialMotionTier: 'full',
  autoTierEnabled: true,
  gpuCapabilities: null,
  currentFPS: 60,
  averageFPS: 60,
  targetFPS: 60,
  metrics: DEFAULT_METRICS,
  fpsHistory: [],
  maxHistoryLength: 60, // Keep last 60 frames (1 second at 60fps)
  webGLAvailable: true,
  webGLVersion: 2,
  
  // Actions
  setMotionTier: (tier) => {
    console.log(`[PerformanceStore] Motion tier changed: ${get().motionTier} -> ${tier}`);
    set({ motionTier: tier });
  },
  
  setInitialMotionTier: (tier) => {
    console.log(`[PerformanceStore] Initial motion tier set: ${tier}`);
    set({ 
      initialMotionTier: tier,
      motionTier: tier 
    });
  },
  
  setGPUCapabilities: (capabilities) => {
    console.log('[PerformanceStore] GPU capabilities stored:', {
      vendor: capabilities.vendor,
      renderer: capabilities.renderer,
      gpuTier: capabilities.gpuTier,
      webglVersion: capabilities.webglVersion
    });
    set({ 
      gpuCapabilities: capabilities,
      webGLAvailable: capabilities.webglVersion > 0,
      webGLVersion: capabilities.webglVersion
    });
  },
  
  setAutoTier: (enabled) => {
    console.log(`[PerformanceStore] Auto-tier ${enabled ? 'enabled' : 'disabled'}`);
    set({ autoTierEnabled: enabled });
  },
  
  updateFPS: (fps) => {
    const { fpsHistory, maxHistoryLength } = get();
    const newHistory = [...fpsHistory, fps].slice(-maxHistoryLength);
    const averageFPS = newHistory.reduce((sum, val) => sum + val, 0) / newHistory.length;
    
    set({ 
      currentFPS: fps,
      averageFPS,
      fpsHistory: newHistory
    });
  },
  
  updateMetrics: (metrics) => set((state) => ({ 
    metrics: { ...state.metrics, ...metrics }
  })),
  
  setWebGLAvailable: (available, version = 2) => set({ 
    webGLAvailable: available,
    webGLVersion: version
  }),
  
  autoDowngradeTier: () => {
    const { motionTier, autoTierEnabled, averageFPS } = get();
    
    if (!autoTierEnabled) {
      console.log('[PerformanceStore] Auto-tier disabled, skipping downgrade');
      return;
    }
    
    // Downgrade if sustained low FPS (Requirement 6.5)
    if (averageFPS < 55 && motionTier === 'full') {
      console.warn(`[PerformanceStore] Auto-downgrading from full to lite tier (avg FPS: ${averageFPS.toFixed(1)})`);
      set({ motionTier: 'lite' });
    } else if (averageFPS < 45 && motionTier === 'lite') {
      console.warn(`[PerformanceStore] Auto-downgrading from lite to static tier (avg FPS: ${averageFPS.toFixed(1)})`);
      set({ motionTier: 'static' });
    }
  },
  
  resetMetrics: () => set({ 
    metrics: DEFAULT_METRICS,
    fpsHistory: [],
    currentFPS: 60,
    averageFPS: 60
  })
}));
