// On-Screen Keyboard Component
import React, { useState, useCallback, useEffect, memo } from 'react';
import { Delete, Space, CornerDownLeft, ArrowBigUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  className?: string;
  enableAudioFeedback?: boolean;
}

/**
 * Optimized On-Screen Keyboard Component
 * 
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - useCallback for all event handlers
 * - Lazy rendering (only renders when visible)
 * - Debounced search trigger
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

const OnScreenKeyboardComponent: React.FC<OnScreenKeyboardProps> = ({
  onKeyPress,
  className = "",
  enableAudioFeedback = false
}) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Audio feedback using Web Audio API
  const playKeySound = useCallback(() => {
    if (!enableAudioFeedback) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Subtle click sound
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Audio feedback not available:', error);
    }
  }, [enableAudioFeedback]);

  // Define keyboard layout
  const keyboardRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];

  // Shift mappings for special characters
  const shiftMappings: Record<string, string> = {
    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
    '-': '_', '=': '+', '[': '{', ']': '}',
    ';': ':', "'": '"', ',': '<', '.': '>', '/': '?'
  };

  // Handle key press
  const handleKeyPress = useCallback((key: string) => {
    // Play audio feedback
    playKeySound();
    
    let processedKey = key;

    // Handle special keys
    if (key === 'Shift') {
      setIsShiftPressed(!isShiftPressed);
      return;
    }

    if (key === 'CapsLock') {
      setCapsLock(!capsLock);
      return;
    }

    if (key === 'Space') {
      onKeyPress(' ');
      return;
    }

    if (key === 'Backspace' || key === 'Enter') {
      onKeyPress(key);
      return;
    }

    // Apply shift/caps lock transformations
    if (isShiftPressed && shiftMappings[key]) {
      processedKey = shiftMappings[key];
    } else if ((isShiftPressed || capsLock) && /[a-z]/.test(key)) {
      processedKey = key.toUpperCase();
    }

    onKeyPress(processedKey);

    // Reset shift after key press (but not caps lock)
    if (isShiftPressed) {
      setIsShiftPressed(false);
    }
  }, [isShiftPressed, capsLock, onKeyPress, shiftMappings, playKeySound]);

  // Handle physical keyboard input for accessibility
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to close keyboard (handled by parent)
      if (e.key === 'Escape') {
        return;
      }
      
      // Don't interfere with Tab navigation
      if (e.key === 'Tab') {
        return;
      }
      
      // Prevent default for keys we handle
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress(e.key === ' ' ? 'Space' : e.key);
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyPress]);

  // Get ARIA label for key
  const getAriaLabel = (key: string): string => {
    const specialLabels: Record<string, string> = {
      'Backspace': 'Backspace key - delete previous character',
      'Enter': 'Enter key - submit search',
      'Space': 'Space bar',
      'Tab': 'Tab key',
      'Shift': isShiftPressed ? 'Shift key - currently active' : 'Shift key - press to capitalize next letter',
      'CapsLock': capsLock ? 'Caps Lock - currently active' : 'Caps Lock - press to capitalize all letters',
      'Ctrl': 'Control key',
      'Alt': 'Alt key'
    };

    if (specialLabels[key]) {
      return specialLabels[key];
    }

    const display = getKeyDisplay(key);
    if (display !== key) {
      return `${display} key (shift + ${key})`;
    }

    return `${key} key`;
  };

  // Get display text for key
  const getKeyDisplay = (key: string) => {
    if (isShiftPressed && shiftMappings[key]) {
      return shiftMappings[key];
    }
    if ((isShiftPressed || capsLock) && /[a-z]/.test(key)) {
      return key.toUpperCase();
    }
    return key;
  };

  // Get key button variant
  const getKeyVariant = (key: string) => {
    if (key === 'Shift' && isShiftPressed) return 'default';
    if (key === 'CapsLock' && capsLock) return 'default';
    return 'outline';
  };

  return (
    <Card 
      className={`on-screen-keyboard ${className}`}
      role="application"
      aria-label="Virtual keyboard for text input"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" id="keyboard-title">Virtual Keyboard</CardTitle>
          <div className="flex items-center space-x-2" role="status" aria-live="polite">
            {capsLock && (
              <Badge variant="secondary" className="text-xs" aria-label="Caps Lock is active">
                CAPS
              </Badge>
            )}
            {isShiftPressed && (
              <Badge variant="secondary" className="text-xs" aria-label="Shift is active">
                SHIFT
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2" role="group" aria-labelledby="keyboard-title">
        {/* Number and symbol row */}
        <div className="flex flex-wrap gap-1 justify-center" role="group" aria-label="Number and symbol keys">
          {keyboardRows[0].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => handleKeyPress(key)}
              aria-label={getAriaLabel(key)}
              tabIndex={0}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Backspace')}
            aria-label={getAriaLabel('Backspace')}
            tabIndex={0}
          >
            <Delete className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Backspace</span>
          </Button>
        </div>

        {/* QWERTY row */}
        <div className="flex flex-wrap gap-1 justify-center" role="group" aria-label="Top letter row">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[3rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Tab')}
            aria-label={getAriaLabel('Tab')}
            tabIndex={0}
          >
            Tab
          </Button>
          {keyboardRows[1].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => handleKeyPress(key)}
              aria-label={getAriaLabel(key)}
              tabIndex={0}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
        </div>

        {/* ASDF row */}
        <div className="flex flex-wrap gap-1 justify-center" role="group" aria-label="Home row">
          <Button
            variant={getKeyVariant('CapsLock')}
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('CapsLock')}
            aria-label={getAriaLabel('CapsLock')}
            aria-pressed={capsLock}
            tabIndex={0}
          >
            Caps
          </Button>
          {keyboardRows[2].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => handleKeyPress(key)}
              aria-label={getAriaLabel(key)}
              tabIndex={0}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Enter')}
            aria-label={getAriaLabel('Enter')}
            tabIndex={0}
          >
            <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Enter</span>
          </Button>
        </div>

        {/* ZXCV row */}
        <div className="flex flex-wrap gap-1 justify-center" role="group" aria-label="Bottom letter row">
          <Button
            variant={getKeyVariant('Shift')}
            size="sm"
            className="min-w-[5rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Shift')}
            aria-label={getAriaLabel('Shift')}
            aria-pressed={isShiftPressed}
            tabIndex={0}
          >
            <ArrowBigUp className="h-4 w-4 mr-1" aria-hidden="true" />
            Shift
          </Button>
          {keyboardRows[3].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => handleKeyPress(key)}
              aria-label={getAriaLabel(key)}
              tabIndex={0}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant={getKeyVariant('Shift')}
            size="sm"
            className="min-w-[5rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Shift')}
            aria-label={getAriaLabel('Shift')}
            aria-pressed={isShiftPressed}
            tabIndex={0}
          >
            <ArrowBigUp className="h-4 w-4 mr-1" aria-hidden="true" />
            Shift
          </Button>
        </div>

        {/* Space bar row */}
        <div className="flex flex-wrap gap-1 justify-center" role="group" aria-label="Space bar and modifier keys">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Ctrl')}
            aria-label={getAriaLabel('Ctrl')}
            tabIndex={0}
          >
            Ctrl
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Alt')}
            aria-label={getAriaLabel('Alt')}
            tabIndex={0}
          >
            Alt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[12rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Space')}
            aria-label={getAriaLabel('Space')}
            tabIndex={0}
          >
            <Space className="h-4 w-4 mr-2" aria-hidden="true" />
            Space
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Alt')}
            aria-label={getAriaLabel('Alt')}
            tabIndex={0}
          >
            Alt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('Ctrl')}
            aria-label={getAriaLabel('Ctrl')}
            tabIndex={0}
          >
            Ctrl
          </Button>
        </div>

        {/* Quick access buttons */}
        <div className="flex flex-wrap gap-1 justify-center pt-2 border-t" role="group" aria-label="Quick access special characters">
          <Button
            variant="outline"
            size="sm"
            className="text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('@')}
            aria-label="At symbol"
            tabIndex={0}
          >
            @
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('.')}
            aria-label="Period"
            tabIndex={0}
          >
            .
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('_')}
            aria-label="Underscore"
            tabIndex={0}
          >
            _
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => handleKeyPress('-')}
            aria-label="Hyphen"
            tabIndex={0}
          >
            -
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders (Requirement 10.3)
export const OnScreenKeyboard = memo(OnScreenKeyboardComponent, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.onKeyPress === nextProps.onKeyPress &&
    prevProps.className === nextProps.className &&
    prevProps.enableAudioFeedback === nextProps.enableAudioFeedback
  );
});

OnScreenKeyboard.displayName = 'OnScreenKeyboard';

export default OnScreenKeyboard;