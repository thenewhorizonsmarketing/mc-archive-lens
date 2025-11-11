import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RoomCard } from './RoomCard';
import { useZoomAnimation } from '../../hooks/useZoomAnimation';
import './RoomCardGrid.css';

export interface RoomData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface RoomCardGridProps {
  rooms: RoomData[];
}

export const RoomCardGrid: React.FC<RoomCardGridProps> = ({ rooms }) => {
  const [zoomingCard, setZoomingCard] = useState<string | null>(null);
  const { startZoom } = useZoomAnimation();
  const shouldReduceMotion = useReducedMotion();

  const handleCardClick = (roomId: string, onClick: () => void) => {
    setZoomingCard(roomId);
    startZoom(onClick);
  };

  return (
    <div className="room-card-grid-container">
      <nav aria-labelledby="page-title" className="room-card-grid">
        {rooms.map((room, index) => {
          const positions: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = [
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right'
          ];
          
          const isZooming = zoomingCard === room.id;
          const isSibling = zoomingCard !== null && zoomingCard !== room.id;
          
          return (
            <motion.div
              key={room.id}
              animate={{
                opacity: isSibling && !shouldReduceMotion ? 0 : 1,
                scale: isSibling && !shouldReduceMotion ? 0.9 : 1
              }}
              transition={shouldReduceMotion ? {
                duration: 0.01
              } : {
                duration: 0.45,
                ease: [0.4, 0, 1, 1]
              }}
            >
              <RoomCard
                title={room.title}
                description={room.description}
                icon={room.icon}
                onClick={() => handleCardClick(room.id, room.onClick)}
                position={positions[index]}
                isZooming={isZooming}
                onZoomStart={() => setZoomingCard(room.id)}
              />
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
};
