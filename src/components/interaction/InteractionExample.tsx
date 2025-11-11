import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ClueBoard3D } from '@/components/3d/ClueBoard3D';
import { TouchHandler } from './TouchHandler';
import { HitTargetValidator } from './HitTargetValidator';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * InteractionExample Component
 * 
 * Example component demonstrating touch interaction and hit target validation
 * for the 3D Clue Board.
 * 
 * This component can be used to:
 * - Test touch gestures
 * - Validate hit target sizes
 * - Debug interaction issues
 */

// Sample room data for testing
const sampleRooms: RoomDefinition[] = [
  {
    id: 'alumni',
    title: 'Alumni',
    description: 'Browse alumni records',
    icon: '/assets/icons/alumni.svg',
    route: '/alumni',
    position: 'top-left',
    color: '#0E6B5C'
  },
  {
    id: 'publications',
    title: 'Publications',
    description: 'Explore publications',
    icon: '/assets/icons/publications.svg',
    route: '/publications',
    position: 'top-center',
    color: '#6B3F2B'
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'View photo collections',
    icon: '/assets/icons/photos.svg',
    route: '/photos',
    position: 'top-right',
    color: '#CDAF63'
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'Meet our faculty',
    icon: '/assets/icons/faculty.svg',
    route: '/faculty',
    position: 'middle-left',
    color: '#F5E6C8'
  },
  {
    id: 'history',
    title: 'History',
    description: 'Discover our history',
    icon: '/assets/icons/history.svg',
    route: '/history',
    position: 'middle-right',
    color: '#8B4513'
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'Notable achievements',
    icon: '/assets/icons/achievements.svg',
    route: '/achievements',
    position: 'bottom-left',
    color: '#DAA520'
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Past and upcoming events',
    icon: '/assets/icons/events.svg',
    route: '/events',
    position: 'bottom-center',
    color: '#2F4F4F'
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Library resources',
    icon: '/assets/icons/resources.svg',
    route: '/resources',
    position: 'bottom-right',
    color: '#556B2F'
  }
];

export const InteractionExample: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [adminGestureDetected, setAdminGestureDetected] = useState(false);
  const [backGestureDetected, setBackGestureDetected] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);

  const handleRoomTap = (roomId: string) => {
    console.log('[InteractionExample] Room tapped:', roomId);
    setSelectedRoom(roomId);
    
    // Simulate transition
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };

  const handleAdminGesture = () => {
    console.log('[InteractionExample] Admin gesture detected');
    setAdminGestureDetected(true);
    setTimeout(() => setAdminGestureDetected(false), 2000);
  };

  const handleBackGesture = () => {
    console.log('[InteractionExample] Back gesture detected');
    setBackGestureDetected(true);
    setSelectedRoom(null);
    setTimeout(() => setBackGestureDetected(false), 2000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Info Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '400px'
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Touch Interaction Test</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Selected Room:</strong> {selectedRoom || 'None'}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Transitioning:</strong> {isTransitioning ? 'Yes' : 'No'}
        </div>
        
        {adminGestureDetected && (
          <div style={{ color: '#FFD700', marginBottom: '10px' }}>
            ⚠️ Admin gesture detected!
          </div>
        )}
        
        {backGestureDetected && (
          <div style={{ color: '#4CAF50', marginBottom: '10px' }}>
            ← Back gesture detected!
          </div>
        )}
        
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #444' }}>
          <strong>Gestures:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Tap tile: Navigate to room</li>
            <li>Hold upper-left 3s: Admin overlay</li>
            <li>Two-finger tap: Go back</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #444' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={validationEnabled}
              onChange={(e) => setValidationEnabled(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable Hit Target Validation
          </label>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 15, 15],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[-10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[10, 5, -5]}
          intensity={0.3}
        />

        {/* Touch Handler */}
        <TouchHandler
          onRoomTap={handleRoomTap}
          onAdminGesture={handleAdminGesture}
          onBackGesture={handleBackGesture}
          isTransitioning={isTransitioning}
        >
          {/* Clue Board */}
          <ClueBoard3D
            rooms={sampleRooms}
            onTileClick={handleRoomTap}
            isTransitioning={isTransitioning}
            motionTier="full"
          />
        </TouchHandler>

        {/* Hit Target Validator */}
        {validationEnabled && (
          <HitTargetValidator
            minSize={56}
            debug={false}
            verbose={true}
          />
        )}

        {/* Orbit Controls for debugging */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {/* Room Count Display */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000
        }}
      >
        <div><strong>Total Rooms:</strong> {sampleRooms.length}</div>
        <div><strong>Min Hit Target:</strong> 56px</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          Check console for validation results
        </div>
      </div>
    </div>
  );
};

export default InteractionExample;
