/**
 * BoardTest Page
 * 
 * Test page for validating the 3D Clue Board with all 8 room tiles.
 * Used for hit target validation and interaction testing.
 */

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ClueBoard3D } from '@/components/3d/ClueBoard3D';
import { TouchHandler } from '@/components/interaction/TouchHandler';
import { HitTargetValidator } from '@/components/interaction/HitTargetValidator';
import type { RoomDefinition } from '@/types/kiosk-config';

// Load rooms from configuration
const loadRooms = async (): Promise<RoomDefinition[]> => {
  try {
    const response = await fetch('/config/rooms.json');
    const data = await response.json();
    return data.rooms;
  } catch (error) {
    console.error('Failed to load rooms:', error);
    // Return default rooms if config fails
    return [
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
  }
};

export default function BoardTest() {
  const [rooms, setRooms] = useState<RoomDefinition[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadRooms().then(setRooms);
  }, []);

  const handleRoomTap = (roomId: string) => {
    console.log('[BoardTest] Room tapped:', roomId);
    setSelectedRoom(roomId);
    
    // Simulate transition
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };

  if (rooms.length === 0) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: 'white'
      }}>
        Loading rooms...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#1a1a1a' }}>
      {/* Info Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 1000
        }}
      >
        <div><strong>3D Board Test</strong></div>
        <div>Rooms: {rooms.length}</div>
        <div>Selected: {selectedRoom || 'None'}</div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
          Check console for validation results
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
        onCreated={({ gl, scene, camera }) => {
          // Expose scene and camera for validation
          (gl.domElement as any).__THREE__ = scene;
          (gl.domElement as any).__CAMERA__ = camera;
          console.log('[BoardTest] Canvas created, scene and camera exposed');
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
          isTransitioning={isTransitioning}
        >
          {/* Clue Board */}
          <ClueBoard3D
            rooms={rooms}
            onTileClick={handleRoomTap}
            isTransitioning={isTransitioning}
            motionTier="full"
          />
        </TouchHandler>

        {/* Hit Target Validator */}
        <HitTargetValidator
          minSize={56}
          debug={false}
          verbose={true}
        />

        {/* Orbit Controls for debugging */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
