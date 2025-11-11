/**
 * Accessibility Module
 * 
 * Provides utilities and managers for WCAG 2.1 AA compliance,
 * color contrast validation, and color-blind safety.
 */

export {
  AccessibilityManager,
  getAccessibilityManager
} from './accessibility-manager';

export type {
  AccessibilityOptions,
  AccessibilityState
} from './accessibility-manager';

export {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastRequirement,
  validateColorPair,
  validateKioskPalette,
  simulateColorBlindness,
  testColorBlindSafety,
  logAccessibilityValidation,
  ContrastLevel,
  KIOSK_COLORS
} from './color-contrast';
