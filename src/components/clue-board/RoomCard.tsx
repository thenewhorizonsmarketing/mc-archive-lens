import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './RoomCard.css';

export interface RoomCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isZooming?: boolean;
  onZoomStart?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  title,
  description,
  icon,
  onClick,
  position = 'top-left',
  isZooming = false,
  onZoomStart
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  const handleClick = () => {
    if (onZoomStart) {
      onZoomStart();
    }
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Touch event handlers for better mobile interaction
  const handleTouchStart = () => {
    setTouchStartTime(Date.now());
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime;
    // Prevent accidental double-taps (debounce)
    if (touchDuration < 50) {
      e.preventDefault();
      return;
    }
    // Normal tap - proceed with click
    if (touchDuration < 500) {
      handleClick();
    }
  };

  return (
    <motion.div 
      className={`room-card room-card-${position}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title}. ${description}`}
      aria-describedby={`card-desc-${title.replace(/\s+/g, '-').toLowerCase()}`}
      onKeyDown={handleKeyDown}
      animate={isZooming ? {
        scale: shouldReduceMotion ? 1 : 1.5,
        z: shouldReduceMotion ? 0 : 100,
        opacity: 1
      } : {
        scale: 1,
        z: 0,
        opacity: 1
      }}
      whileHover={!isZooming && !shouldReduceMotion ? {
        scale: 1.05,
        y: -8,
      } : undefined}
      whileTap={!isZooming && !shouldReduceMotion ? {
        scale: 0.98,
      } : undefined}
      transition={shouldReduceMotion ? {
        duration: 0.01
      } : isZooming ? {
        duration: 0.65,
        ease: [0.34, 1.56, 0.64, 1]
      } : {
        duration: 0.35,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <div className="card-glass">
        <div className="card-icon" aria-hidden="true">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-description" id={`card-desc-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          {description}
        </p>
        <div className="card-shine" aria-hidden="true" />
      </div>
    </motion.div>
  );
};
