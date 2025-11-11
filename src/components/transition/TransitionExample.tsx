import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ClueBoard3D } from '@/components/3d/ClueBoard3D';
import { CameraController } from '@/components/3d/CameraController';
import { TouchHandler } from '@/components/interaction/TouchHandler';
import { RouteTransition } from './RouteTransition';
import { useKioskStore } from '@/store/kioskStore';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * TransitionExample Component
 * 
 * Demonstrates the complete navigation transition flow:
 * 1. User taps room tile
 * 2. Input is locked (requirement 5.1)
 * 3. Brass plaque pulses for 300ms (requirement 5.2)
 * 4. Camera dollies in 500-700ms (requirement 5.3)
 * 5. Cross-fade to new route (requirement 5.4, 5.5)
 * 6. Input is unlocked when complete
 */

// Example room definitions
const exampleRooms: RoomDefinition[] = [
  {
    id: 'alumni',
    title: 'Alumni',
    description: 'Browse alumni records',
    icon: '/icons/alumni.svg',
    route: '/alumni',
    position: 'top-left',
    color: '#0E6B5C'
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'View faculty information',
    icon: '/icons/faculty.svg',
    route: '/faculty',
    position: 'top-center',
    color: '#0E6B5C'
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'Explore photo gallery',
    icon: '/icons/photos.svg',
    route: '/photos',
    position: 'top-right',
    color: '#0E6B5C'
  },
  {
    id: 'publications',
    title: 'Publications',
    description: 'Read publications',
    icon: '/icons/publications.svg',
    route: '/publications',
    position: 'middle-left',
    color: '#0E6B5C'
  }
];

export const TransitionExample: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  const {
    currentRoute,
    isTransitioning,
    inputLocked,
    startTransition,
    completeTransition
  } = useKioskStore();

  const handleRoomTap = (roomId: string) => {
    console.log('[TransitionExample] Room tapped:', roomId);
    
    // Start transition (this locks input automatically)
    startTransition(roomId);
    setSelectedRoom(roomId);
  };

  const handleTransitionComplete = () => {
    console.log('[TransitionExample] Transition complete');
    // The store automatically unlocks input in completeTransition
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <RouteTransition
        isTransitioning={isTransitioning}
        onComplete={handleTransitionComplete}
      >
        {currentRoute === 'home' ? (
          <Canvas>
            <CameraController
              isTransitioning={isTransitioning}
              targetRoom={selectedRoom}
              rooms={exampleRooms}
              motionTier="full"
            />
            
            <TouchHandler
              onRoomTap={handleRoomTap}
              isTransitioning={isTransitioning}
            >
              <ClueBoard3D
                rooms={exampleRooms}
                onTileClick={handleRoomTap}
                isTransitioning={isTransitioning}
                motionTier="full"
              />
            </TouchHandler>
          </Canvas>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '2rem'
          }}>
            <div>
              <h1>Room: {currentRoute}</h1>
              <p>Content for {currentRoute} would go here</p>
              <button
                onClick={() => startTransition('home')}
                disabled={inputLocked}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  cursor: inputLocked ? 'not-allowed' : 'pointer',
                  opacity: inputLocked ? 0.5 : 1
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </RouteTransition>

      {/* Debug overlay */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        borderRadius: '4px'
      }}>
        <div>Route: {currentRoute}</div>
        <div>Transitioning: {isTransitioning ? 'YES' : 'NO'}</div>
        <div>Input Locked: {inputLocked ? 'YES' : 'NO'}</div>
        <div>Selected Room: {selectedRoom || 'none'}</div>
      </div>
    </div>
  );
};

export default TransitionExample;
