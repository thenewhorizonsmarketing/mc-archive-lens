import React, { useState } from 'react';
import { usePerformanceStore } from '@/store/performanceStore';
import { useMotionTierDetection } from '@/hooks/useMotionTierDetection';
import { getMotionTierConfig, getMotionTierDescription } from '@/lib/utils/motion-tier-features';
import type { MotionTier } from '@/store/performanceStore';

/**
 * Example component demonstrating motion tier detection
 * 
 * This component shows:
 * - GPU capabilities detection
 * - Initial motion tier assignment
 * - Motion tier features
 * - Manual tier override
 * - Auto-downgrade status
 */
export const MotionTierDetectionExample: React.FC = () => {
  const [overrideTier, setOverrideTier] = useState<MotionTier | 'auto'>('auto');
  
  const {
    motionTier,
    initialMotionTier,
    gpuCapabilities,
    autoTierEnabled,
    currentFPS,
    averageFPS
  } = usePerformanceStore();
  
  // Use motion tier detection hook
  const { isDetected } = useMotionTierDetection({
    overrideTier,
    enableAutoDowngrade: true,
    onDetectionComplete: (tier) => {
      console.log('[Example] Motion tier detection complete:', tier);
    }
  });
  
  const tierConfig = getMotionTierConfig(motionTier);
  const tierDescription = getMotionTierDescription(motionTier);
  
  const handleOverrideChange = (tier: MotionTier | 'auto') => {
    setOverrideTier(tier);
    
    if (tier !== 'auto') {
      usePerformanceStore.getState().setMotionTier(tier);
      usePerformanceStore.getState().setAutoTier(false);
    } else {
      usePerformanceStore.getState().setAutoTier(true);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 10000
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
        Motion Tier Detection
      </h3>
      
      {/* Detection Status */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Detection Status:</strong>{' '}
        {isDetected ? (
          <span style={{ color: '#4ade80' }}>✓ Complete</span>
        ) : (
          <span style={{ color: '#fbbf24' }}>⏳ In Progress...</span>
        )}
      </div>
      
      {/* GPU Capabilities */}
      {gpuCapabilities && (
        <div style={{ marginBottom: '15px' }}>
          <strong>GPU Capabilities:</strong>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div>Vendor: {gpuCapabilities.vendor}</div>
            <div>Renderer: {gpuCapabilities.renderer}</div>
            <div>WebGL: {gpuCapabilities.webglVersion === 2 ? '2.0' : gpuCapabilities.webglVersion === 1 ? '1.0' : 'Not Available'}</div>
            <div>GPU Tier: {gpuCapabilities.gpuTier}</div>
            <div>Max Texture Size: {gpuCapabilities.maxTextureSize}px</div>
            <div>Screen: {gpuCapabilities.screenResolution.width}x{gpuCapabilities.screenResolution.height}</div>
            <div>Device Pixel Ratio: {gpuCapabilities.devicePixelRatio}</div>
          </div>
        </div>
      )}
      
      {/* Motion Tier */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Motion Tier:</strong>
        <div style={{ marginLeft: '10px', marginTop: '5px' }}>
          <div>
            Initial: <span style={{ color: '#60a5fa' }}>{initialMotionTier}</span>
          </div>
          <div>
            Current: <span style={{ color: '#4ade80' }}>{motionTier}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
            {tierDescription}
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Enabled Features:</strong>
        <div style={{ marginLeft: '10px', marginTop: '5px' }}>
          <div>
            Board Tilt: {tierConfig.features.boardTilt ? '✓' : '✗'}
          </div>
          <div>
            Parallax: {tierConfig.features.parallax ? '✓' : '✗'}
          </div>
          <div>
            Emissive Pulse: {tierConfig.features.emissivePulse ? '✓' : '✗'}
          </div>
          <div>
            Camera Transition: {tierConfig.features.cameraTransition ? '✓' : '✗'}
          </div>
          <div>
            Target FPS: {tierConfig.targetFPS}
          </div>
        </div>
      </div>
      
      {/* Performance */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Performance:</strong>
        <div style={{ marginLeft: '10px', marginTop: '5px' }}>
          <div>Current FPS: {currentFPS}</div>
          <div>Average FPS: {averageFPS.toFixed(1)}</div>
          <div>
            Auto-Downgrade: {autoTierEnabled ? (
              <span style={{ color: '#4ade80' }}>Enabled</span>
            ) : (
              <span style={{ color: '#9ca3af' }}>Disabled</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Manual Override */}
      <div>
        <strong>Manual Override:</strong>
        <div style={{ marginTop: '5px' }}>
          <select
            value={overrideTier}
            onChange={(e) => handleOverrideChange(e.target.value as MotionTier | 'auto')}
            style={{
              width: '100%',
              padding: '5px',
              background: '#1f2937',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="auto">Auto-Detect</option>
            <option value="full">Full</option>
            <option value="lite">Lite</option>
            <option value="static">Static</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MotionTierDetectionExample;
