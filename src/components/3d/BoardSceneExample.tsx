import React from 'react';
import { BoardScene } from './BoardScene';
import type { RoomDefinition } from '@/types/kiosk-config';

/**
 * BoardSceneExample Component
 * 
 * Example usage of the BoardScene component for testing and demonstration.
 * This shows how to integrate the 3D scene into the kiosk application.
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
    color: '#CDAF63'
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'View faculty information',
    icon: '/icons/faculty.svg',
    route: '/faculty',
    position: 'top-center',
    color: '#CDAF63'
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'Explore photo gallery',
    icon: '/icons/photos.svg',
    route: '/photos',
    position: 'top-right',
    color: '#CDAF63'
  },
  {
    id: 'publications',
    title: 'Publications',
    description: 'Read publications',
    icon: '/icons/publications.svg',
    route: '/publications',
    position: 'middle-left',
    color: '#CDAF63'
  },
  {
    id: 'history',
    title: 'History',
    description: 'Learn about our history',
    icon: '/icons/history.svg',
    route: '/history',
    position: 'middle-right',
    color: '#CDAF63'
  },
  {
    id: 'events',
    title: 'Events',
    description: 'View upcoming events',
    icon: '/icons/events.svg',
    route: '/events',
    position: 'bottom-left',
    color: '#CDAF63'
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Get in touch',
    icon: '/icons/contact.svg',
    route: '/contact',
    position: 'bottom-center',
    color: '#CDAF63'
  },
  {
    id: 'about',
    title: 'About',
    description: 'About the museum',
    icon: '/icons/about.svg',
    route: '/about',
    position: 'bottom-right',
    color: '#CDAF63'
  }
];

export const BoardSceneExample: React.FC = () => {
  const handleRoomSelect = (roomId: string) => {
    console.log('[BoardSceneExample] Room selected:', roomId);
    // In actual implementation, this would trigger navigation
  };

  return (
    <div className="w-full h-screen bg-black">
      <BoardScene
        rooms={exampleRooms}
        onRoomSelect={handleRoomSelect}
      />
      
      {/* Debug overlay */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm">
        <h3 className="font-bold mb-2">3D Scene Foundation - Task 6 Complete</h3>
        <ul className="space-y-1 text-xs">
          <li>✓ R3F Canvas configured</li>
          <li>✓ Orthographic camera system</li>
          <li>✓ Lighting setup (key + fill)</li>
          <li>✓ Performance monitoring</li>
        </ul>
      </div>
    </div>
  );
};

export default BoardSceneExample;
