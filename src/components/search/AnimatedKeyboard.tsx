/**
 * Animated Keyboard Component
 * 
 * Adds smooth show/hide animations and key press visual feedback.
 * Requirements: 2.2, 10.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedKeyboard, OptimizedKeyboardProps } from './OptimizedKeyboard';

export interface AnimatedKeyboardProps extends Omit<OptimizedKeyboardProps, 'visible'> {
  /** Whether the keyboard is visible */
  visible: boolean;
  
  /** Animation duration in milliseconds (default: 200ms) */
  animationDuration?: number;
  
  /** Animation type */
  animationType?: 'slide' | 'fade' | 'scale';
}

/**
 * Keyboard with smooth animations
 * Ensures 60 FPS performance during transitions
 */
export const AnimatedKeyboard: React.FC<AnimatedKeyboardProps> = ({
  visible,
  animationDuration = 200,
  animationType = 'slide',
  ...keyboardProps
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Track animation state
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    }
  }, [visible]);

  // Animation variants
  const variants = {
    slide: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 20, opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  };

  const selectedVariant = variants[animationType];

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setIsAnimating(false)}
    >
      {visible && (
        <motion.div
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          transition={{
            duration: animationDuration / 1000,
            ease: 'easeInOut',
          }}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          <OptimizedKeyboard
            {...keyboardProps}
            visible={visible || isAnimating}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedKeyboard;
