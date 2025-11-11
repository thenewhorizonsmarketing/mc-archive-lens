import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallbackBoard } from './FallbackBoard';
import { useKioskStore } from '@/store/kioskStore';
import { useIdleStore } from '@/store/idleStore';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * FallbackBoardExample Component
 * 
 * Example integration of FallbackBoard with routing and navigation.
 * This demonstrates how to wire up the fallback board with the same
 * routing behavior as the 3D version.
 * 
 * Requirements:
 * - 11.3: Implement same routing as 3D version
 * - 9.3: Ensure accessibility compliance with keyboard navigation
 */

export interface FallbackBoardExampleProps {
  rooms: RoomDefinition[];
}

export const FallbackBoardExample: React.FC<FallbackBoardExampleProps> = ({ rooms }) => {
  const navigate = useNavigate();
  const { startTransition, completeTransition, setRoute } = useKioskStore();
  const { recordActivity } = useIdleStore();

  // Handle room selection with transition
  const handleRoomClick = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      console.error('[FallbackBoardExample] Room not found:', roomId);
      return;
    }

    console.log('[FallbackBoardExample] Navigating to room:', room.title);
    
    // Record activity to reset idle timer
    recordActivity();
    
    // Start transition (locks input)
    startTransition(room.route);
    
    // Simulate transition delay (cross-fade effect)
    setTimeout(() => {
      // Navigate to the room route
      navigate(room.route);
      
      // Update kiosk state
      setRoute(room.route);
      
      // Complete transition (unlocks input)
      completeTransition();
    }, 300); // 300ms cross-fade duration
  };

  // Record activity on mount
  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  return (
    <FallbackBoard
      rooms={rooms}
      onRoomClick={handleRoomClick}
    />
  );
};

export default FallbackBoardExample;
