/**
 * Color Contrast and Accessibility Utilities
 * 
 * Provides utilities for validating color contrast ratios and
 * ensuring color-blind safe palettes.
 * 
 * Requirements:
 * - 9.1: Validate color palette contrast ratios
 * - 9.1: Test with color-blind simulators
 * - 9.1: Use large, clear labels
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.warn('[ColorContrast] Invalid color format:', color1, color2);
    return 1;
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 Contrast Requirements
 */
export enum ContrastLevel {
  AAA_LARGE = 4.5, // AAA for large text (18pt+)
  AA_NORMAL = 4.5, // AA for normal text
  AA_LARGE = 3.0, // AA for large text (18pt+)
  AAA_NORMAL = 7.0 // AAA for normal text
}

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function meetsContrastRequirement(
  ratio: number,
  level: ContrastLevel
): boolean {
  return ratio >= level;
}

/**
 * Validate a color pair for accessibility
 */
export function validateColorPair(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendation: string;
} {
  const ratio = getContrastRatio(foreground, background);
  const requiredAA = isLargeText ? ContrastLevel.AA_LARGE : ContrastLevel.AA_NORMAL;
  const requiredAAA = isLargeText ? ContrastLevel.AAA_LARGE : ContrastLevel.AAA_NORMAL;

  const meetsAA = meetsContrastRequirement(ratio, requiredAA);
  const meetsAAA = meetsContrastRequirement(ratio, requiredAAA);

  let recommendation = '';
  if (!meetsAA) {
    recommendation = `Contrast ratio ${ratio.toFixed(2)}:1 is too low. Minimum required: ${requiredAA}:1`;
  } else if (!meetsAAA) {
    recommendation = `Meets AA but not AAA. Consider improving to ${requiredAAA}:1 for better accessibility.`;
  } else {
    recommendation = 'Excellent contrast! Meets AAA standards.';
  }

  return { ratio, meetsAA, meetsAAA, recommendation };
}

/**
 * Kiosk Color Palette (from requirements)
 */
export const KIOSK_COLORS = {
  walnut: '#6B3F2B',
  brass: '#CDAF63',
  boardTeal: '#0E6B5C',
  accent: '#F5E6C8',
  white: '#FFFFFF',
  black: '#000000'
};

/**
 * Validate the entire kiosk color palette
 */
export function validateKioskPalette(): {
  valid: boolean;
  results: Array<{
    pair: string;
    ratio: number;
    meetsAA: boolean;
    meetsAAA: boolean;
  }>;
} {
  const results = [
    // Text on brass nameplates (dark text on brass)
    {
      pair: 'Brass nameplate text',
      ...validateColorPair(KIOSK_COLORS.walnut, KIOSK_COLORS.brass, true)
    },
    // Text on board (light text on teal)
    {
      pair: 'Board text on teal',
      ...validateColorPair(KIOSK_COLORS.accent, KIOSK_COLORS.boardTeal, true)
    },
    // White text on teal
    {
      pair: 'White text on teal',
      ...validateColorPair(KIOSK_COLORS.white, KIOSK_COLORS.boardTeal, true)
    },
    // Accent text on walnut frame
    {
      pair: 'Accent on walnut',
      ...validateColorPair(KIOSK_COLORS.accent, KIOSK_COLORS.walnut, true)
    }
  ];

  const valid = results.every((r) => r.meetsAA);

  return { valid, results };
}

/**
 * Simulate color blindness types
 * Returns adjusted color for different types of color blindness
 */
export function simulateColorBlindness(
  hex: string,
  type: 'protanopia' | 'deuteranopia' | 'tritanopia'
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  let { r, g, b } = rgb;

  // Simplified color blindness simulation matrices
  // Based on Brettel, Viénot and Mollon JPEG algorithm
  switch (type) {
    case 'protanopia': // Red-blind
      r = 0.567 * r + 0.433 * g;
      g = 0.558 * r + 0.442 * g;
      b = 0.242 * g + 0.758 * b;
      break;
    case 'deuteranopia': // Green-blind
      r = 0.625 * r + 0.375 * g;
      g = 0.7 * r + 0.3 * g;
      b = 0.3 * g + 0.7 * b;
      break;
    case 'tritanopia': // Blue-blind
      r = 0.95 * r + 0.05 * g;
      g = 0.433 * g + 0.567 * b;
      b = 0.475 * g + 0.525 * b;
      break;
  }

  // Clamp values
  r = Math.round(Math.max(0, Math.min(255, r)));
  g = Math.round(Math.max(0, Math.min(255, g)));
  b = Math.round(Math.max(0, Math.min(255, b)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Test color palette for color-blind safety
 */
export function testColorBlindSafety(): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Test key color pairs under different color blindness types
  const types: Array<'protanopia' | 'deuteranopia' | 'tritanopia'> = [
    'protanopia',
    'deuteranopia',
    'tritanopia'
  ];

  types.forEach((type) => {
    const simulatedBrass = simulateColorBlindness(KIOSK_COLORS.brass, type);
    const simulatedTeal = simulateColorBlindness(KIOSK_COLORS.boardTeal, type);

    // Check if colors remain distinguishable
    const ratio = getContrastRatio(simulatedBrass, simulatedTeal);
    if (ratio < 1.5) {
      warnings.push(
        `${type}: Brass and teal may be difficult to distinguish (ratio: ${ratio.toFixed(2)}:1)`
      );
    }
  });

  return {
    safe: warnings.length === 0,
    warnings
  };
}

/**
 * Log accessibility validation results
 */
export function logAccessibilityValidation(): void {
  console.group('[Accessibility] Color Validation');

  // Validate palette
  const paletteValidation = validateKioskPalette();
  console.log('Palette Valid:', paletteValidation.valid);
  paletteValidation.results.forEach((result) => {
    const status = result.meetsAAA ? '✓ AAA' : result.meetsAA ? '✓ AA' : '✗ FAIL';
    console.log(`${status} ${result.pair}: ${result.ratio.toFixed(2)}:1`);
  });

  // Test color-blind safety
  const colorBlindTest = testColorBlindSafety();
  console.log('\nColor-Blind Safety:', colorBlindTest.safe ? '✓ SAFE' : '⚠ WARNINGS');
  if (colorBlindTest.warnings.length > 0) {
    colorBlindTest.warnings.forEach((warning) => console.warn(warning));
  }

  console.groupEnd();
}
