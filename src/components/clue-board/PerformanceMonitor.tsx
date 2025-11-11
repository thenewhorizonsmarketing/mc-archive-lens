import React from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

/**
 * Visual performance monitor overlay for testing animation performance
 * Shows FPS, frame time, and memory usage (if available)
 * Target: 60 FPS for smooth animations
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = false 
}) => {
  const metrics = usePerformanceMonitor(enabled);

  if (!enabled) {
    return null;
  }

  const fpsColor = metrics.fps >= 55 ? '#4ade80' : metrics.fps >= 45 ? '#fbbf24' : '#ef4444';
  const targetFps = 60;
  const fpsPercentage = Math.min((metrics.fps / targetFps) * 100, 100);

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '200px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
        Performance Monitor
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>FPS:</span>
          <span style={{ color: fpsColor, fontWeight: 'bold' }}>
            {metrics.fps} / {targetFps}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${fpsPercentage}%`,
              height: '100%',
              background: fpsColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <span>Frame Time: </span>
        <span style={{ color: '#69B3E7' }}>{metrics.frameTime}ms</span>
      </div>

      {metrics.memoryUsage !== undefined && (
        <div>
          <span>Memory: </span>
          <span style={{ color: '#C99700' }}>{metrics.memoryUsage}MB</span>
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
        Target: 60 FPS (16.67ms/frame)
      </div>
    </div>
  );
};
