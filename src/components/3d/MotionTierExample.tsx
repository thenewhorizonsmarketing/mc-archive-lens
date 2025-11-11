import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ClueBoard3D } from './ClueBoard3D';
import { Lighting } from './Lighting';
import type { RoomDefinition, MotionTier } from '@/types/kiosk-config';

/**
 * MotionTierExample Component
 * 
 * Example component demonstrating the three motion tier modes:
 * - Full: board tilt + parallax + emissive pulses
 * - Lite: parallax only, no tilt
 * - Static: cross-fade highlights only
 * 
 * This component is for testing and demonstration purposes.
 */

const SAMPLE_ROOMS: RoomDefinition[] = [
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
    id: 'publications',
    title: 'Publications',
    description: 'Access publications',
    icon: '/icons/publications.svg',
    route: '/publications',
    position: 'top-right',
    color: '#0E6B5C'
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'View photo gallery',
    icon: '/icons/photos.svg',
    route: '/photos',
    position: 'middle-left',
    color: '#0E6B5C'
  },
  {
    id: 'history',
    title: 'History',
    description: 'Learn about our history',
    icon: '/icons/history.svg',
    route: '/history',
    position: 'middle-right',
    color: '#0E6B5C'
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Upcoming events',
    icon: '/icons/events.svg',
    route: '/events',
    position: 'bottom-left',
    color: '#0E6B5C'
  },
  {
    id: 'awards',
    title: 'Awards',
    description: 'View awards and honors',
    icon: '/icons/awards.svg',
    route: '/awards',
    position: 'bottom-center',
    color: '#0E6B5C'
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Get in touch',
    icon: '/icons/contact.svg',
    route: '/contact',
    position: 'bottom-right',
    color: '#0E6B5C'
  }
];

export const MotionTierExample: React.FC = () => {
  const [motionTier, setMotionTier] = useState<MotionTier>('full');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTileClick = (roomId: string) => {
    console.log('[MotionTierExample] Tile clicked:', roomId);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  return (
    <div className="w-full h-screen bg-black">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 p-4 rounded-lg text-white">
        <h2 className="text-lg font-bold mb-3">Motion Tier Demo</h2>
        
        <div className="space-y-2">
          <button
            onClick={() => setMotionTier('full')}
            className={`w-full px-4 py-2 rounded ${
              motionTier === 'full'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Full Tier
          </button>
          <button
            onClick={() => setMotionTier('lite')}
            className={`w-full px-4 py-2 rounded ${
              motionTier === 'lite'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Lite Tier
          </button>
          <button
            onClick={() => setMotionTier('static')}
            className={`w-full px-4 py-2 rounded ${
              motionTier === 'static'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Static Tier
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-600 text-sm">
          <h3 className="font-semibold mb-2">Current Features:</h3>
          {motionTier === 'full' && (
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Board tilt (breathing)</li>
              <li>Parallax on hover</li>
              <li>Full emissive pulses</li>
              <li>Tile lift on hover</li>
            </ul>
          )}
          {motionTier === 'lite' && (
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Parallax on hover</li>
              <li>Reduced emissive pulses</li>
              <li>No board tilt</li>
              <li>No tile lift</li>
            </ul>
          )}
          {motionTier === 'static' && (
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Cross-fade highlights</li>
              <li>No animations</li>
              <li>Minimal emissive</li>
              <li>Best performance</li>
            </ul>
          )}
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 50
        }}
        gl={{
          antialias: true,
          alpha: false
        }}
        shadows={motionTier === 'full'}
      >
        <Lighting enableShadows={motionTier === 'full'} />
        
        {/* OrbitControls for testing */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
        />

        <ClueBoard3D
          rooms={SAMPLE_ROOMS}
          onTileClick={handleTileClick}
          isTransitioning={isTransitioning}
          motionTier={motionTier}
        />
      </Canvas>
    </div>
  );
};

export default MotionTierExample;
