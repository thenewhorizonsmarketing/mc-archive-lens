/**
 * Keyboard Configuration Types
 * 
 * Defines configuration interfaces for the on-screen keyboard system.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export type KeyboardPosition = 'below' | 'floating' | 'modal';
export type KeyboardLayout = 'qwerty' | 'azerty' | 'qwertz' | 'compact';
export type KeySize = 'small' | 'medium' | 'large';

export interface KeyboardConfig {
  /** Whether the keyboard is enabled globally */
  enabled: boolean;
  
  /** Position mode for the keyboard */
  position: KeyboardPosition;
  
  /** Keyboard layout type */
  layout: KeyboardLayout;
  
  /** Size of keyboard keys */
  keySize: KeySize;
  
  /** Whether to show keyboard automatically on input focus */
  autoShow: boolean;
  
  /** Whether to hide keyboard automatically on input blur */
  autoHide: boolean;
  
  /** Whether to enable audio feedback for key presses */
  audioFeedback: boolean;
  
  /** Whether to enable haptic feedback (if supported) */
  hapticFeedback: boolean;
  
  /** Whether to auto-capitalize first letter */
  autoCapitalize: boolean;
  
  /** Whether to show quick access special characters */
  showQuickAccess: boolean;
  
  /** Custom CSS class for styling */
  customClassName?: string;
  
  /** Minimum touch target size in pixels */
  minTouchTarget: number;
  
  /** Animation duration in milliseconds */
  animationDuration: number;
  
  /** Debounce delay for search trigger in milliseconds */
  searchDebounce: number;
}

export interface KeyboardComponentConfig extends Partial<KeyboardConfig> {
  /** Override global config for this specific component */
  override?: boolean;
}

export const DEFAULT_KEYBOARD_CONFIG: KeyboardConfig = {
  enabled: true,
  position: 'below',
  layout: 'qwerty',
  keySize: 'medium',
  autoShow: true,
  autoHide: true,
  audioFeedback: false,
  hapticFeedback: true,
  autoCapitalize: true,
  showQuickAccess: true,
  minTouchTarget: 44,
  animationDuration: 200,
  searchDebounce: 300,
};

export const KEY_SIZE_MAP: Record<KeySize, { width: string; height: string; fontSize: string }> = {
  small: {
    width: '2rem',
    height: '2rem',
    fontSize: '0.75rem',
  },
  medium: {
    width: '2.5rem',
    height: '2.5rem',
    fontSize: '0.875rem',
  },
  large: {
    width: '3rem',
    height: '3rem',
    fontSize: '1rem',
  },
};

export const POSITION_STYLES: Record<KeyboardPosition, string> = {
  below: 'relative mt-2',
  floating: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl',
  modal: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
};
