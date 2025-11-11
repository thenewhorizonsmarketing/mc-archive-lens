import React, { useState } from 'react';
import './TouchKeyboard.css';

export interface TouchKeyboardProps {
  onKeyPress: (key: string) => void;
  layout?: 'qwerty' | 'compact';
  theme?: 'light' | 'dark' | 'kiosk';
  className?: string;
}

interface KeyDefinition {
  label: string;
  value: string;
  width?: number; // multiplier of base width
  type?: 'character' | 'backspace' | 'space' | 'enter' | 'clear';
}

const QWERTY_LAYOUT: KeyDefinition[][] = [
  [
    { label: '1', value: '1', type: 'character' },
    { label: '2', value: '2', type: 'character' },
    { label: '3', value: '3', type: 'character' },
    { label: '4', value: '4', type: 'character' },
    { label: '5', value: '5', type: 'character' },
    { label: '6', value: '6', type: 'character' },
    { label: '7', value: '7', type: 'character' },
    { label: '8', value: '8', type: 'character' },
    { label: '9', value: '9', type: 'character' },
    { label: '0', value: '0', type: 'character' },
    { label: '-', value: '-', type: 'character' },
    { label: '=', value: '=', type: 'character' },
    { label: '⌫', value: 'Backspace', width: 1.5, type: 'backspace' },
  ],
  [
    { label: 'Q', value: 'Q', type: 'character' },
    { label: 'W', value: 'W', type: 'character' },
    { label: 'E', value: 'E', type: 'character' },
    { label: 'R', value: 'R', type: 'character' },
    { label: 'T', value: 'T', type: 'character' },
    { label: 'Y', value: 'Y', type: 'character' },
    { label: 'U', value: 'U', type: 'character' },
    { label: 'I', value: 'I', type: 'character' },
    { label: 'O', value: 'O', type: 'character' },
    { label: 'P', value: 'P', type: 'character' },
  ],
  [
    { label: 'A', value: 'A', type: 'character' },
    { label: 'S', value: 'S', type: 'character' },
    { label: 'D', value: 'D', type: 'character' },
    { label: 'F', value: 'F', type: 'character' },
    { label: 'G', value: 'G', type: 'character' },
    { label: 'H', value: 'H', type: 'character' },
    { label: 'J', value: 'J', type: 'character' },
    { label: 'K', value: 'K', type: 'character' },
    { label: 'L', value: 'L', type: 'character' },
  ],
  [
    { label: 'Z', value: 'Z', type: 'character' },
    { label: 'X', value: 'X', type: 'character' },
    { label: 'C', value: 'C', type: 'character' },
    { label: 'V', value: 'V', type: 'character' },
    { label: 'B', value: 'B', type: 'character' },
    { label: 'N', value: 'N', type: 'character' },
    { label: 'M', value: 'M', type: 'character' },
    { label: ',', value: ',', type: 'character' },
    { label: '.', value: '.', type: 'character' },
  ],
  [
    { label: 'Space', value: ' ', width: 4, type: 'space' },
    { label: 'Clear', value: 'Clear', width: 1.5, type: 'clear' },
    { label: 'Enter', value: 'Enter', width: 1.5, type: 'enter' },
  ],
];

export const TouchKeyboard: React.FC<TouchKeyboardProps> = ({
  onKeyPress,
  layout = 'qwerty',
  theme = 'kiosk',
  className = '',
}) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleKeyPress = (key: KeyDefinition) => {
    // Set pressed state for visual feedback
    setPressedKey(key.value);
    
    // Call the onKeyPress handler
    onKeyPress(key.value);
    
    // Remove pressed state after 50ms (visual feedback duration)
    setTimeout(() => {
      setPressedKey(null);
    }, 50);
  };

  const handleTouchStart = (e: React.TouchEvent, key: KeyDefinition) => {
    e.preventDefault();
    handleKeyPress(key);
  };

  const handleMouseDown = (e: React.MouseEvent, key: KeyDefinition) => {
    e.preventDefault();
    handleKeyPress(key);
  };

  return (
    <div 
      className={`touch-keyboard touch-keyboard--${theme} ${className}`}
      role="application"
      aria-label="Virtual keyboard"
    >
      <div className="touch-keyboard__container">
        {QWERTY_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="touch-keyboard__row">
            {row.map((key, keyIndex) => (
              <button
                key={`${rowIndex}-${keyIndex}`}
                className={`
                  touch-keyboard__key
                  touch-keyboard__key--${key.type || 'character'}
                  ${pressedKey === key.value ? 'touch-keyboard__key--pressed' : ''}
                  ${key.width ? `touch-keyboard__key--width-${key.width}` : ''}
                `}
                onTouchStart={(e) => handleTouchStart(e, key)}
                onMouseDown={(e) => handleMouseDown(e, key)}
                aria-label={key.type === 'backspace' ? 'Backspace' : key.label}
                type="button"
              >
                <span className="touch-keyboard__key-label">{key.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TouchKeyboard;
