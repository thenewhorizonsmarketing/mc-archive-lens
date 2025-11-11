import React, { useState } from 'react';
import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';
import { usePerformanceStore } from '@/store/performanceStore';

/**
 * Example usage of PerformanceMonitor component
 * 
 * This demonstrates how to integrate the PerformanceMonitor into your application
 * and display real-time performance metrics.
 */
export const PerformanceMonitorExample: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [downgrades, setDowngrades] = useState<string[]>([]);
  
  // Get motion tier from store
  const motionTier = usePerformanceStore((state) => state.motionTier);
  const currentFPS = usePerformanceStore((state) => state.currentFPS);
  const averageFPS = usePerformanceStore((state) => state.averageFPS);

  const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  };

  const handleTierDowngrade = (newTier: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDowngrades(prev => [...prev, `${timestamp}: Downgraded to ${newTier}`]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Performance Monitor Example</h2>
      
      {/* Performance Monitor Component */}
      <PerformanceMonitor
        enabled={true}
        targetFPS={60}
        downgradeFPSThreshold={55}
        downgradeFrameThreshold={180}
        onMetricsUpdate={handleMetricsUpdate}
        onTierDowngrade={handleTierDowngrade}
      />

      {/* Display Current Metrics */}
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        color: '#00ff00', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Real-Time Metrics</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <strong>Current FPS:</strong> {currentFPS}
          </div>
          <div>
            <strong>Average FPS:</strong> {averageFPS.toFixed(1)}
          </div>
          
          {metrics && (
            <>
              <div>
                <strong>Frame Time:</strong> {metrics.frameTime.toFixed(2)}ms
              </div>
              <div>
                <strong>Draw Calls:</strong> {metrics.drawCalls}
                {metrics.drawCalls > 120 && (
                  <span style={{ color: '#ff0000', marginLeft: '5px' }}>⚠️ OVER BUDGET</span>
                )}
              </div>
              <div>
                <strong>Memory Usage:</strong> {metrics.memoryUsage}MB
              </div>
              <div>
                <strong>Motion Tier:</strong> {motionTier.toUpperCase()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performance Status */}
      <div style={{ 
        backgroundColor: currentFPS >= 55 ? '#004400' : '#440000',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Performance Status</h3>
        <p>
          {currentFPS >= 60 && '✅ Excellent - Running at target 60 FPS'}
          {currentFPS >= 55 && currentFPS < 60 && '⚠️ Good - Running at acceptable FPS (55-60)'}
          {currentFPS < 55 && '❌ Poor - Below acceptable threshold (< 55 FPS)'}
        </p>
        
        {metrics && metrics.drawCalls > 120 && (
          <p style={{ color: '#ffaa00' }}>
            ⚠️ Draw calls exceed budget (Requirement 7.3: target ≤ 120)
          </p>
        )}
      </div>

      {/* Downgrade History */}
      {downgrades.length > 0 && (
        <div style={{ 
          backgroundColor: '#442200',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>Tier Downgrade History</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {downgrades.map((downgrade, index) => (
              <li key={index}>{downgrade}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Usage Instructions */}
      <div style={{ 
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        color: '#333'
      }}>
        <h3 style={{ marginTop: 0 }}>Usage Instructions</h3>
        <p>
          The PerformanceMonitor component tracks:
        </p>
        <ul>
          <li><strong>FPS:</strong> Frames per second using requestAnimationFrame</li>
          <li><strong>Frame Time:</strong> Average time per frame in milliseconds</li>
          <li><strong>Draw Calls:</strong> Number of WebGL draw calls (Requirement 7.3: ≤ 120)</li>
          <li><strong>Memory Usage:</strong> JavaScript heap memory usage</li>
          <li><strong>Sustained Frame Drops:</strong> Auto-downgrades motion tier when FPS drops below 55 for 3 seconds (Requirement 6.5)</li>
        </ul>
        
        <h4>Integration Example:</h4>
        <pre style={{ 
          backgroundColor: '#1a1a1a', 
          color: '#00ff00', 
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`import { PerformanceMonitor } from '@/components/system';

function App() {
  return (
    <PerformanceMonitor
      enabled={true}
      targetFPS={60}
      downgradeFPSThreshold={55}
      downgradeFrameThreshold={180}
      onMetricsUpdate={(metrics) => {
        console.log('FPS:', metrics.fps);
        console.log('Draw Calls:', metrics.drawCalls);
      }}
      onTierDowngrade={(newTier) => {
        console.log('Downgraded to:', newTier);
      }}
    >
      {/* Your app content */}
    </PerformanceMonitor>
  );
}`}
        </pre>
      </div>
    </div>
  );
};

export default PerformanceMonitorExample;
