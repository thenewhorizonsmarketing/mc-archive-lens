import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KioskApp } from './KioskApp';
import { BoardScene } from '@/components/3d/BoardScene';
import { FallbackBoard } from '@/components/fallback/FallbackBoard';
import { LoadingScreen } from '@/components/system/LoadingScreen';
import { useKioskStore } from '@/store/kioskStore';
import { useIdleStore } from '@/store/idleStore';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * KioskBoardIntegration Component
 * 
 * Complete integration of 3D BoardScene and 2D FallbackBoard with routing.
 * Automatically switches between 3D and 2D based on WebGL availability
 * and reduced motion preferences.
 * 
 * Requirements:
 * - 11.1: Activate 2D fallback when WebGL unavailable
 * - 11.2: Activate 2D fallback when reduced motion enabled
 * - 11.3: Mirror board layout and routing between 3D and 2D
 */

export const KioskBoardIntegration: React.FC = () => {
  const navigate = useNavigate();
  const { startTransition, completeTransition, setRoute } = useKioskStore();
  const { recordActivity } = useIdleStore();

  // Handle room selection (works for both 3D and 2D)
  const handleRoomSelect = (roomId: string, rooms: RoomDefinition[]) => {
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      console.error('[KioskBoardIntegration] Room not found:', roomId);
      return;
    }

    console.log('[KioskBoardIntegration] Navigating to room:', room.title);
    
    // Record activity to reset idle timer
    recordActivity();
    
    // Start transition (locks input)
    startTransition(room.route);
    
    // For 3D: brass pulse (300ms) + camera dolly (500-700ms)
    // For 2D: cross-fade (300ms)
    const transitionDuration = 700; // Use max duration for consistency
    
    setTimeout(() => {
      // Navigate to the room route
      navigate(room.route);
      
      // Update kiosk state
      setRoute(room.route);
      
      // Complete transition (unlocks input)
      completeTransition();
    }, transitionDuration);
  };

  return (
    <KioskApp>
      {({ config, isLoading, use3D, webGLAvailable }) => {
        // Show loading screen while initializing
        if (isLoading) {
          return <LoadingScreen progress={0} />;
        }

        // Show error if config failed to load
        if (!config || !config.rooms || config.rooms.length === 0) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <div className="text-white text-2xl">
                Configuration Error: Unable to load room definitions
              </div>
            </div>
          );
        }

        // Render 3D board if WebGL is available and reduced motion is not enabled
        if (use3D && webGLAvailable) {
          console.log('[KioskBoardIntegration] Rendering 3D BoardScene');
          return (
            <BoardScene
              rooms={config.rooms}
              onRoomSelect={(roomId) => handleRoomSelect(roomId, config.rooms)}
              className="w-full h-screen"
            />
          );
        }

        // Fallback to 2D board
        console.log('[KioskBoardIntegration] Rendering 2D FallbackBoard');
        return (
          <FallbackBoard
            rooms={config.rooms}
            onRoomClick={(roomId) => handleRoomSelect(roomId, config.rooms)}
          />
        );
      }}
    </KioskApp>
  );
};

export default KioskBoardIntegration;
