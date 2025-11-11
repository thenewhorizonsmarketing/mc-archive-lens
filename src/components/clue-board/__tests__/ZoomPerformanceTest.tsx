import React, { useState, useRef } from 'react';
import { ClueBoard } from '../ClueBoard';
import { CentralBranding } from '../CentralBranding';
import { RoomCardGrid } from '../RoomCardGrid';
import { Users, BookOpen, Image, GraduationCap } from 'lucide-react';

/**
 * Manual test component for verifying zoom animation performance
 * 
 * Usage:
 * 1. Import this component in your test page
 * 2. Enable the performance monitor
 * 3. Click on any room card to trigger zoom animation
 * 4. Observe the FPS counter during the animation
 * 5. FPS should remain at or near 60 throughout the zoom
 * 
 * Success Criteria:
 * - FPS stays above 55 during zoom animation (green indicator)
 * - No frame drops or stuttering visible
 * - Smooth acceleration and deceleration
 * - Sibling cards fade smoothly
 */
export const ZoomPerformanceTest: React.FC = () => {
  const [showMonitor, setShowMonitor] = useState(true);
  const [testResults, setTestResults] = useState<{
    minFps: number;
    maxFps: number;
    avgFps: number;
    frameDrops: number;
  } | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const isRecordingRef = useRef(false);

  const startRecording = () => {
    fpsHistoryRef.current = [];
    isRecordingRef.current = true;
    setTestResults(null);
    
    // Stop recording after 1 second (covers full zoom animation)
    setTimeout(() => {
      isRecordingRef.current = false;
      analyzeResults();
    }, 1000);
  };

  const analyzeResults = () => {
    const history = fpsHistoryRef.current;
    if (history.length === 0) return;

    const minFps = Math.min(...history);
    const maxFps = Math.max(...history);
    const avgFps = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
    const frameDrops = history.filter(fps => fps < 55).length;

    setTestResults({ minFps, maxFps, avgFps, frameDrops });
  };

  const rooms = [
    {
      id: 'alumni',
      title: 'Alumni',
      description: 'Explore our distinguished graduates',
      icon: <GraduationCap size={48} />,
      onClick: () => {
        startRecording();
        console.log('Zoom animation started - recording FPS...');
      },
    },
    {
      id: 'publications',
      title: 'Publications',
      description: 'Browse academic works and journals',
      icon: <BookOpen size={48} />,
      onClick: () => {
        startRecording();
        console.log('Zoom animation started - recording FPS...');
      },
    },
    {
      id: 'photos',
      title: 'Photos & Archives',
      description: 'View historical photographs',
      icon: <Image size={48} />,
      onClick: () => {
        startRecording();
        console.log('Zoom animation started - recording FPS...');
      },
    },
    {
      id: 'faculty',
      title: 'Faculty & Staff',
      description: 'Meet our educators and staff',
      icon: <Users size={48} />,
      onClick: () => {
        startRecording();
        console.log('Zoom animation started - recording FPS...');
      },
    },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Test Controls */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          zIndex: 9999,
          fontFamily: 'monospace',
          fontSize: '12px',
          maxWidth: '300px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
          Zoom Performance Test
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showMonitor}
              onChange={(e) => setShowMonitor(e.target.checked)}
            />
            Show Performance Monitor
          </label>
        </div>

        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.7 }}>
            Instructions:
          </div>
          <ol style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', lineHeight: '1.5' }}>
            <li>Click any room card</li>
            <li>Watch FPS during zoom</li>
            <li>Check results below</li>
          </ol>
        </div>

        {testResults && (
          <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>
              Last Test Results:
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
              <div>Min FPS: <span style={{ color: testResults.minFps >= 55 ? '#4ade80' : '#ef4444' }}>{testResults.minFps}</span></div>
              <div>Max FPS: <span style={{ color: '#69B3E7' }}>{testResults.maxFps}</span></div>
              <div>Avg FPS: <span style={{ color: testResults.avgFps >= 55 ? '#4ade80' : '#fbbf24' }}>{testResults.avgFps}</span></div>
              <div>Frame Drops: <span style={{ color: testResults.frameDrops === 0 ? '#4ade80' : '#ef4444' }}>{testResults.frameDrops}</span></div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', padding: '4px', background: testResults.minFps >= 55 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
              {testResults.minFps >= 55 ? '✓ PASS: Smooth 60fps animation' : '✗ FAIL: Frame drops detected'}
            </div>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '10px', opacity: 0.6 }}>
          Target: 60 FPS (≥55 acceptable)
        </div>
      </div>

      {/* Clue Board with Performance Monitor */}
      <ClueBoard showPerformanceMonitor={showMonitor}>
        <CentralBranding />
        <RoomCardGrid rooms={rooms} />
      </ClueBoard>
    </div>
  );
};
