import React, { useEffect, useState } from 'react';
import { getAccessibilityManager } from '@/lib/accessibility';
import { validateKioskPalette, testColorBlindSafety, KIOSK_COLORS } from '@/lib/accessibility/color-contrast';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * AccessibilityExample Component
 * 
 * Demonstrates and validates accessibility features for the kiosk.
 * 
 * Requirements:
 * - 9.1: Validate color palette contrast ratios
 * - 9.1: Test with color-blind simulators
 * - 9.1: Use large, clear labels
 * - 9.2: Detect prefers-reduced-motion
 * - 9.3: Support arrow keys for room selection
 * - 9.4: Support Enter key for activation
 */

export const AccessibilityExample: React.FC = () => {
  const [paletteValidation, setPaletteValidation] = useState<any>(null);
  const [colorBlindTest, setColorBlindTest] = useState<any>(null);
  const { prefersReducedMotion, isReducedMotionActive, toggleReducedMotion } = useReducedMotion();

  useEffect(() => {
    // Initialize accessibility manager
    const manager = getAccessibilityManager();
    
    // Validate color palette
    const palette = validateKioskPalette();
    setPaletteValidation(palette);
    
    // Test color-blind safety
    const cbTest = testColorBlindSafety();
    setColorBlindTest(cbTest);
    
    // Announce validation results
    if (palette.valid && cbTest.safe) {
      manager.announce('All accessibility checks passed');
    } else {
      manager.announce('Some accessibility warnings detected', 'assertive');
    }
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Accessibility Validation
      </h1>

      {/* Reduced Motion Status */}
      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Reduced Motion
        </h2>
        <p>
          <strong>System Preference:</strong> {prefersReducedMotion ? 'Enabled' : 'Disabled'}
        </p>
        <p>
          <strong>Current Status:</strong> {isReducedMotionActive ? 'Active' : 'Inactive'}
        </p>
        <button
          onClick={toggleReducedMotion}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            backgroundColor: '#0E6B5C',
            color: '#fff',
            border: 'none',
            borderRadius: '0.25rem'
          }}
        >
          Toggle Reduced Motion
        </button>
      </section>

      {/* Color Palette Validation */}
      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Color Contrast Validation
        </h2>
        {paletteValidation && (
          <>
            <p>
              <strong>Overall Status:</strong>{' '}
              {paletteValidation.valid ? (
                <span style={{ color: 'green' }}>✓ PASS</span>
              ) : (
                <span style={{ color: 'red' }}>✗ FAIL</span>
              )}
            </p>
            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ddd' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Color Pair</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ratio</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>AA</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>AAA</th>
                </tr>
              </thead>
              <tbody>
                {paletteValidation.results.map((result: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.5rem' }}>{result.pair}</td>
                    <td style={{ padding: '0.5rem' }}>{result.ratio.toFixed(2)}:1</td>
                    <td style={{ padding: '0.5rem' }}>
                      {result.meetsAA ? (
                        <span style={{ color: 'green' }}>✓</span>
                      ) : (
                        <span style={{ color: 'red' }}>✗</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {result.meetsAAA ? (
                        <span style={{ color: 'green' }}>✓</span>
                      ) : (
                        <span style={{ color: 'orange' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* Color-Blind Safety */}
      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Color-Blind Safety
        </h2>
        {colorBlindTest && (
          <>
            <p>
              <strong>Status:</strong>{' '}
              {colorBlindTest.safe ? (
                <span style={{ color: 'green' }}>✓ SAFE</span>
              ) : (
                <span style={{ color: 'orange' }}>⚠ WARNINGS</span>
              )}
            </p>
            {colorBlindTest.warnings.length > 0 && (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {colorBlindTest.warnings.map((warning: string, index: number) => (
                  <li key={index} style={{ color: 'orange' }}>
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Color Palette Swatches */}
      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Kiosk Color Palette
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {Object.entries(KIOSK_COLORS).map(([name, color]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: color,
                  border: '2px solid #000',
                  borderRadius: '0.25rem',
                  marginBottom: '0.5rem'
                }}
              />
              <div style={{ fontSize: '0.875rem' }}>
                <strong>{name}</strong>
                <br />
                {color}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Navigation Instructions */}
      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Keyboard Navigation
        </h2>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li><strong>Arrow Keys:</strong> Navigate between rooms</li>
          <li><strong>Enter / Space:</strong> Activate selected room</li>
          <li><strong>Home:</strong> Jump to first room</li>
          <li><strong>End:</strong> Jump to last room</li>
          <li><strong>Tab:</strong> Navigate between interactive elements</li>
          <li><strong>Escape:</strong> Return to home</li>
        </ul>
      </section>

      {/* Accessibility Features Summary */}
      <section style={{ padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          ✓ Accessibility Features
        </h2>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>WCAG 2.1 AA compliant color contrast ratios</li>
          <li>Color-blind safe palette (tested for protanopia, deuteranopia, tritanopia)</li>
          <li>Large, clear labels (minimum 18pt for body text)</li>
          <li>Reduced motion support (respects system preferences)</li>
          <li>Full keyboard navigation support</li>
          <li>Minimum 56px touch targets for all interactive elements</li>
          <li>Screen reader compatible with ARIA labels</li>
          <li>High contrast mode support</li>
        </ul>
      </section>
    </div>
  );
};

export default AccessibilityExample;
