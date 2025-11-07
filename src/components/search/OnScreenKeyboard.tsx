// On-Screen Keyboard Component
import React, { useState } from 'react';
import { Delete, Space, CornerDownLeft, ArrowBigUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  className?: string;
}

export const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  onKeyPress,
  className = ""
}) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

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
  const handleKeyPress = (key: string) => {
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
    <Card className={`on-screen-keyboard ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Virtual Keyboard</CardTitle>
          <div className="flex items-center space-x-2">
            {capsLock && (
              <Badge variant="secondary" className="text-xs">
                CAPS
              </Badge>
            )}
            {isShiftPressed && (
              <Badge variant="secondary" className="text-xs">
                SHIFT
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Number and symbol row */}
        <div className="flex flex-wrap gap-1 justify-center">
          {keyboardRows[0].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono"
              onClick={() => handleKeyPress(key)}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Backspace')}
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>

        {/* QWERTY row */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[3rem] h-10 text-xs"
            onClick={() => handleKeyPress('Tab')}
          >
            Tab
          </Button>
          {keyboardRows[1].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono"
              onClick={() => handleKeyPress(key)}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
        </div>

        {/* ASDF row */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Button
            variant={getKeyVariant('CapsLock')}
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('CapsLock')}
          >
            Caps
          </Button>
          {keyboardRows[2].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono"
              onClick={() => handleKeyPress(key)}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Enter')}
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* ZXCV row */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Button
            variant={getKeyVariant('Shift')}
            size="sm"
            className="min-w-[5rem] h-10 text-xs"
            onClick={() => handleKeyPress('Shift')}
          >
            <ArrowBigUp className="h-4 w-4 mr-1" />
            Shift
          </Button>
          {keyboardRows[3].map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="min-w-[2.5rem] h-10 text-sm font-mono"
              onClick={() => handleKeyPress(key)}
            >
              {getKeyDisplay(key)}
            </Button>
          ))}
          <Button
            variant={getKeyVariant('Shift')}
            size="sm"
            className="min-w-[5rem] h-10 text-xs"
            onClick={() => handleKeyPress('Shift')}
          >
            <ArrowBigUp className="h-4 w-4 mr-1" />
            Shift
          </Button>
        </div>

        {/* Space bar row */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Ctrl')}
          >
            Ctrl
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Alt')}
          >
            Alt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[12rem] h-10 text-xs"
            onClick={() => handleKeyPress('Space')}
          >
            <Space className="h-4 w-4 mr-2" />
            Space
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Alt')}
          >
            Alt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[4rem] h-10 text-xs"
            onClick={() => handleKeyPress('Ctrl')}
          >
            Ctrl
          </Button>
        </div>

        {/* Quick access buttons */}
        <div className="flex flex-wrap gap-1 justify-center pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleKeyPress('@')}
          >
            @
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleKeyPress('.')}
          >
            .
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleKeyPress('_')}
          >
            _
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleKeyPress('-')}
          >
            -
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnScreenKeyboard;