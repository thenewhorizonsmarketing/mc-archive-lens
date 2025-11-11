import React, { useState } from 'react';
import { TouchKeyboard } from './TouchKeyboard';

/**
 * Example component demonstrating TouchKeyboard usage
 */
export const TouchKeyboardExample: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (key: string) => {
    if (key === 'Backspace') {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (key === 'Clear') {
      setInputValue('');
    } else if (key === 'Enter') {
      console.log('Search query:', inputValue);
      // Handle search submission
    } else {
      setInputValue((prev) => prev + key);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        flex: 1, 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#0C2340' }}>
          Touch Keyboard Demo
        </h1>
        <input
          type="text"
          value={inputValue}
          readOnly
          placeholder="Type using the keyboard below..."
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '20px',
            fontSize: '24px',
            border: '2px solid #C99700',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: 'white',
            color: '#0C2340'
          }}
        />
        <p style={{ marginTop: '20px', color: '#666' }}>
          Characters entered: {inputValue.length}
        </p>
      </div>
      
      <TouchKeyboard 
        onKeyPress={handleKeyPress}
        theme="kiosk"
      />
    </div>
  );
};

export default TouchKeyboardExample;
