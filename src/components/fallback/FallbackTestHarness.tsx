import React, { useState, useEffect } from 'react';
import { FallbackBoard } from './FallbackBoard';
import { detectWebGL, prefersReducedMotion } from '@/lib/webgl';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * FallbackTestHarness Component
 * 
 * Test harness for validating fallback board activation under different conditions.
 * 
 * Requirements:
 * - 11.1: Test with WebGL disabled
 * - 11.2: Test with reduced motion enabled
 * - Verify automatic switching
 */

export interface FallbackTestHarnessProps {
  rooms: RoomDefinition[];
}

export const FallbackTestHarness: React.FC<FallbackTestHarnessProps> = ({ rooms }) => {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [forceWebGLError, setForceWebGLError] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Detect actual capabilities on mount
  useEffect(() => {
    const capabilities = detectWebGL();
    const reducedMotionPref = prefersReducedMotion();
    
    setWebglAvailable(capabilities.available);
    setReducedMotion(reducedMotionPref);
    
    addTestResult(`Initial WebGL: ${capabilities.available ? 'Available' : 'Not Available'}`);
    addTestResult(`Initial Reduced Motion: ${reducedMotionPref ? 'Enabled' : 'Disabled'}`);
    addTestResult(`WebGL Version: ${capabilities.version}`);
    addTestResult(`Renderer: ${capabilities.renderer}`);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const handleRoomClick = (roomId: string) => {
    addTestResult(`Room clicked: ${roomId}`);
    console.log('[FallbackTestHarness] Room clicked:', roomId);
  };

  // Test 1: Simulate WebGL disabled
  const testWebGLDisabled = () => {
    addTestResult('TEST 1: Simulating WebGL disabled');
    setWebglAvailable(false);
    setForceWebGLError(false);
    addTestResult('✓ Fallback should now be active (WebGL unavailable)');
  };

  // Test 2: Simulate reduced motion enabled
  const testReducedMotion = () => {
    addTestResult('TEST 2: Simulating reduced motion enabled');
    setReducedMotion(true);
    setWebglAvailable(true);
    setForceWebGLError(false);
    addTestResult('✓ Fallback should now be active (Reduced motion)');
  };

  // Test 3: Simulate WebGL error
  const testWebGLError = () => {
    addTestResult('TEST 3: Simulating WebGL context error');
    setForceWebGLError(true);
    setWebglAvailable(false);
    addTestResult('✓ Fallback should now be active (WebGL error)');
  };

  // Test 4: Reset to normal
  const testReset = () => {
    addTestResult('TEST 4: Resetting to normal conditions');
    const capabilities = detectWebGL();
    const reducedMotionPref = prefersReducedMotion();
    
    setWebglAvailable(capabilities.available);
    setReducedMotion(reducedMotionPref);
    setForceWebGLError(false);
    
    if (capabilities.available && !reducedMotionPref) {
      addTestResult('✓ 3D mode should be active (WebGL available, no reduced motion)');
    } else {
      addTestResult('✓ Fallback remains active (WebGL unavailable or reduced motion)');
    }
  };

  // Test 5: Verify keyboard navigation
  const testKeyboardNav = () => {
    addTestResult('TEST 5: Keyboard navigation test');
    addTestResult('→ Press Tab to focus room tiles');
    addTestResult('→ Press Enter or Space to activate');
    addTestResult('→ Verify focus indicators are visible');
  };

  // Test 6: Verify touch targets
  const testTouchTargets = () => {
    addTestResult('TEST 6: Touch target validation');
    const tiles = document.querySelectorAll('.fallback-room-tile');
    let allValid = true;
    
    tiles.forEach((tile, index) => {
      const rect = tile.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const minSize = 56; // Requirement 3.1
      
      if (width < minSize || height < minSize) {
        addTestResult(`✗ Tile ${index + 1}: ${width}x${height}px (below 56px minimum)`);
        allValid = false;
      } else {
        addTestResult(`✓ Tile ${index + 1}: ${width}x${height}px (meets 56px minimum)`);
      }
    });
    
    if (allValid) {
      addTestResult('✓ All touch targets meet minimum size requirement');
    } else {
      addTestResult('✗ Some touch targets are too small');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const shouldShowFallback = !webglAvailable || reducedMotion || forceWebGLError;

  return (
    <div className="fallback-test-harness">
      {/* Test Controls */}
      <div className="test-controls" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '1rem',
        zIndex: 1000,
        borderBottom: '2px solid #CDAF63'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
          Fallback Board Test Harness
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button onClick={testWebGLDisabled} style={buttonStyle}>
            Test 1: WebGL Disabled
          </button>
          <button onClick={testReducedMotion} style={buttonStyle}>
            Test 2: Reduced Motion
          </button>
          <button onClick={testWebGLError} style={buttonStyle}>
            Test 3: WebGL Error
          </button>
          <button onClick={testReset} style={buttonStyle}>
            Test 4: Reset
          </button>
          <button onClick={testKeyboardNav} style={buttonStyle}>
            Test 5: Keyboard Nav
          </button>
          <button onClick={testTouchTargets} style={buttonStyle}>
            Test 6: Touch Targets
          </button>
          <button onClick={clearResults} style={{ ...buttonStyle, background: '#dc2626' }}>
            Clear Results
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ color: shouldShowFallback ? '#22c55e' : '#ef4444' }}>
              {shouldShowFallback ? '2D Fallback Active' : '3D Mode Active'}
            </span>
          </div>
          <div>
            <strong>WebGL:</strong>{' '}
            <span style={{ color: webglAvailable ? '#22c55e' : '#ef4444' }}>
              {webglAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div>
            <strong>Reduced Motion:</strong>{' '}
            <span style={{ color: reducedMotion ? '#ef4444' : '#22c55e' }}>
              {reducedMotion ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <strong>WebGL Error:</strong>{' '}
            <span style={{ color: forceWebGLError ? '#ef4444' : '#22c55e' }}>
              {forceWebGLError ? 'Simulated' : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results Log */}
      <div className="test-results" style={{
        position: 'fixed',
        top: '140px',
        right: 0,
        width: '400px',
        maxHeight: 'calc(100vh - 160px)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '1rem',
        zIndex: 1000,
        overflowY: 'auto',
        borderLeft: '2px solid #CDAF63',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Test Results</h3>
        {testResults.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No test results yet. Run a test to begin.</p>
        ) : (
          <div>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '0.25rem',
                color: result.includes('✓') ? '#22c55e' : result.includes('✗') ? '#ef4444' : 'white'
              }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fallback Board */}
      <div style={{ paddingTop: '140px' }}>
        {shouldShowFallback ? (
          <FallbackBoard
            rooms={rooms}
            onRoomClick={handleRoomClick}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 140px)',
            background: '#1a1a1a',
            color: 'white',
            fontSize: '2rem'
          }}>
            3D Mode Would Be Active Here
            <br />
            <span style={{ fontSize: '1rem', opacity: 0.7 }}>
              (Run a test to activate fallback)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#0E6B5C',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500
};

export default FallbackTestHarness;
