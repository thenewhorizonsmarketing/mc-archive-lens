import React, { useState } from 'react';
import { useKioskStore } from '@/store/kioskStore';
import { useIdleStore } from '@/store/idleStore';
import type { RoomDefinition, GridPosition } from '@/types/kiosk-config';
import './FallbackBoard.css';

/**
 * FallbackBoard Component
 * 
 * 2D CSS version of the Clue board for when WebGL is unavailable
 * or reduced motion is enabled.
 * 
 * Requirements:
 * - 11.1: Automatically activate when WebGL is not available
 * - 11.2: Automatically activate when reduced motion preference is enabled
 * - 11.3: Mirror the board layout and links from the 3D version
 */

export interface FallbackBoardProps {
  rooms: RoomDefinition[];
  onRoomClick: (roomId: string) => void;
}

// Grid position mapping to CSS grid areas
const gridPositionMap: Record<GridPosition, string> = {
  'top-left': '1 / 1 / 2 / 2',
  'top-center': '1 / 2 / 2 / 3',
  'top-right': '1 / 3 / 2 / 4',
  'middle-left': '2 / 1 / 3 / 2',
  'center': '2 / 2 / 3 / 3',
  'middle-right': '2 / 3 / 3 / 4',
  'bottom-left': '3 / 1 / 4 / 2',
  'bottom-center': '3 / 2 / 4 / 3',
  'bottom-right': '3 / 3 / 4 / 4'
};

export const FallbackBoard: React.FC<FallbackBoardProps> = ({ rooms, onRoomClick }) => {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [focusedRoom, setFocusedRoom] = useState<string | null>(null);
  const isTransitioning = useKioskStore((state) => state.isTransitioning);
  const inputLocked = useKioskStore((state) => state.inputLocked);
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);

  const handleRoomClick = (roomId: string) => {
    // Guard against input during transitions (requirement 5.6)
    if (inputLocked || isTransitioning) {
      console.log('[FallbackBoard] Input locked, ignoring click');
      return;
    }

    console.log('[FallbackBoard] Room clicked:', roomId);
    onRoomClick(roomId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, roomId: string) => {
    // Support Enter and Space for activation (requirement 9.3, 9.4)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRoomClick(roomId);
    }
  };

  // Listen for keyboard focus events
  React.useEffect(() => {
    const handleKeyboardFocus = (event: Event) => {
      const customEvent = event as CustomEvent<{ roomId: string }>;
      setFocusedRoom(customEvent.detail.roomId);
    };

    window.addEventListener('keyboard-room-focus', handleKeyboardFocus);
    return () => {
      window.removeEventListener('keyboard-room-focus', handleKeyboardFocus);
    };
  }, []);

  // Separate center tile from room tiles
  const centerTile = rooms.find(room => room.position === 'center');
  const roomTiles = rooms.filter(room => room.position !== 'center');

  return (
    <div className="fallback-board-container">
      <div className="fallback-board-frame">
        <div className="fallback-board-glass" />
        
        <div className="fallback-board-grid">
          {/* Room tiles */}
          {roomTiles.map((room) => (
            <div
              key={room.id}
              className={`fallback-room-tile ${hoveredRoom === room.id ? 'hovered' : ''} ${focusedRoom === room.id ? 'focused' : ''} ${isInAttractMode ? 'attract-mode' : ''}`}
              style={{
                gridArea: gridPositionMap[room.position],
                '--room-color': room.color
              } as React.CSSProperties}
              onClick={() => handleRoomClick(room.id)}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => setHoveredRoom(null)}
              onFocus={() => setFocusedRoom(room.id)}
              onBlur={() => setFocusedRoom(null)}
              onKeyDown={(e) => handleKeyDown(e, room.id)}
              tabIndex={0}
              role="button"
              aria-label={`Navigate to ${room.title}: ${room.description}`}
            >
              <div className="fallback-tile-floor" />
              <div className="fallback-tile-nameplate">
                <span className="fallback-tile-title">{room.title}</span>
              </div>
            </div>
          ))}

          {/* Center logo tile */}
          {centerTile && (
            <div
              className="fallback-center-tile"
              style={{
                gridArea: gridPositionMap[centerTile.position]
              }}
            >
              <div className="fallback-center-logo">
                <span className="fallback-center-text">MC Law</span>
                <span className="fallback-center-subtitle">Museum & Archives</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessibility message */}
      <div className="fallback-accessibility-message" role="status" aria-live="polite">
        {isInAttractMode && (
          <p>Touch any room to begin exploring</p>
        )}
      </div>
    </div>
  );
};

export default FallbackBoard;
