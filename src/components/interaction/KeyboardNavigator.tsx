import React, { useEffect, useState, useCallback } from 'react';
import type { RoomDefinition } from '@/types/kiosk-config';
import { useKioskStore } from '@/store/kioskStore';

/**
 * KeyboardNavigator Component
 * 
 * Provides keyboard navigation support for the kiosk interface.
 * 
 * Requirements:
 * - 9.3: Support arrow keys for room selection
 * - 9.4: Support Enter key for activation
 * - 9.4: Ensure all rooms are focusable
 */

export interface KeyboardNavigatorProps {
  /** Room definitions for navigation */
  rooms: RoomDefinition[];
  /** Callback when a room is selected via keyboard */
  onRoomSelect: (roomId: string) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

// Grid position order for arrow key navigation (clockwise from top-left)
const navigationOrder = [
  'top-left',
  'top-center',
  'top-right',
  'middle-right',
  'bottom-right',
  'bottom-center',
  'bottom-left',
  'middle-left'
];

export const KeyboardNavigator: React.FC<KeyboardNavigatorProps> = ({
  rooms,
  onRoomSelect,
  enabled = true
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputLocked = useKioskStore((state) => state.inputLocked);
  
  // Filter to only navigable rooms (exclude center)
  const navigableRooms = rooms
    .filter(room => room.position !== 'center')
    .sort((a, b) => {
      const aIndex = navigationOrder.indexOf(a.position);
      const bIndex = navigationOrder.indexOf(b.position);
      return aIndex - bIndex;
    });

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle if disabled or input is locked
    if (!enabled || inputLocked || navigableRooms.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % navigableRooms.length);
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => 
          prev === 0 ? navigableRooms.length - 1 : prev - 1
        );
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        const selectedRoom = navigableRooms[selectedIndex];
        if (selectedRoom) {
          console.log('[KeyboardNavigator] Room activated via keyboard:', selectedRoom.id);
          onRoomSelect(selectedRoom.id);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setSelectedIndex(navigableRooms.length - 1);
        break;
    }
  }, [enabled, inputLocked, navigableRooms, selectedIndex, onRoomSelect]);

  // Set up keyboard event listener
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Expose selected room ID for visual feedback
  useEffect(() => {
    const selectedRoom = navigableRooms[selectedIndex];
    if (selectedRoom) {
      // Dispatch custom event for components to listen to
      const event = new CustomEvent('keyboard-room-focus', {
        detail: { roomId: selectedRoom.id }
      });
      window.dispatchEvent(event);
    }
  }, [selectedIndex, navigableRooms]);

  // Reset selection when rooms change
  useEffect(() => {
    setSelectedIndex(0);
  }, [rooms]);

  return null; // This is a logic-only component
};

export default KeyboardNavigator;
