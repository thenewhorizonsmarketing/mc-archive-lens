// Accessible Search Interface Wrapper with WCAG 2.1 AA Compliance
import React, { useEffect, useState, useCallback } from 'react';
import { SearchInterface, SearchInterfaceProps } from './SearchInterface';
import { getAccessibilityManager, AccessibilityOptions } from '@/lib/accessibility/accessibility-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Type, 
  Volume2, 
  VolumeX, 
  Keyboard as KeyboardIcon,
  Settings,
  X,
  Check,
  Contrast,
  ZoomIn
} from 'lucide-react';

export interface AccessibleSearchInterfaceProps extends SearchInterfaceProps {
  enableAccessibilityControls?: boolean;
  initialAccessibilityOptions?: AccessibilityOptions;
}

export const AccessibleSearchInterface: React.FC<AccessibleSearchInterfaceProps> = ({
  enableAccessibilityControls = true,
  initialAccessibilityOptions,
  ...searchProps
}) => {
  const [accessibilityManager] = useState(() => getAccessibilityManager());
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [accessibilityState, setAccessibilityState] = useState(accessibilityManager.getState());

  // Initialize accessibility options
  useEffect(() => {
    if (initialAccessibilityOptions) {
      accessibilityManager.updateOptions(initialAccessibilityOptions);
    }
    
    // Load saved options
    accessibilityManager.loadSavedOptions();
    setAccessibilityState(accessibilityManager.getState());
  }, [accessibilityManager, initialAccessibilityOptions]);

  // Update state when options change
  const updateAccessibilityState = useCallback(() => {
    setAccessibilityState(accessibilityManager.getState());
  }, [accessibilityManager]);

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    const newValue = !accessibilityState.options.highContrast;
    accessibilityManager.updateOptions({ highContrast: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Toggle large text
  const toggleLargeText = useCallback(() => {
    const newValue = !accessibilityState.options.largeText;
    accessibilityManager.updateOptions({ largeText: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`Large text mode ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Toggle audio feedback
  const toggleAudioFeedback = useCallback(() => {
    const newValue = !accessibilityState.options.audioFeedback;
    accessibilityManager.updateOptions({ audioFeedback: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`Audio feedback ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Toggle keyboard navigation
  const toggleKeyboardNavigation = useCallback(() => {
    const newValue = !accessibilityState.options.keyboardNavigation;
    accessibilityManager.updateOptions({ keyboardNavigation: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`Keyboard navigation ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Toggle reduced motion
  const toggleReducedMotion = useCallback(() => {
    const newValue = !accessibilityState.options.reducedMotion;
    accessibilityManager.updateOptions({ reducedMotion: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Toggle screen reader mode
  const toggleScreenReaderMode = useCallback(() => {
    const newValue = !accessibilityState.options.screenReaderMode;
    accessibilityManager.updateOptions({ screenReaderMode: newValue });
    updateAccessibilityState();
    accessibilityManager.announce(`Screen reader mode ${newValue ? 'enabled' : 'disabled'}`);
  }, [accessibilityManager, accessibilityState, updateAccessibilityState]);

  // Open accessibility panel
  const openAccessibilityPanel = useCallback(() => {
    setShowAccessibilityPanel(true);
    accessibilityManager.announce('Accessibility settings panel opened');
  }, [accessibilityManager]);

  // Close accessibility panel
  const closeAccessibilityPanel = useCallback(() => {
    setShowAccessibilityPanel(false);
    accessibilityManager.announce('Accessibility settings panel closed');
  }, [accessibilityManager]);

  return (
    <div className="accessible-search-interface relative">
      {/* Accessibility Controls Button */}
      {enableAccessibilityControls && (
        <div className="absolute top-0 right-0 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={openAccessibilityPanel}
            className="flex items-center gap-2"
            aria-label="Open accessibility settings"
            aria-expanded={showAccessibilityPanel}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
            {Object.values(accessibilityState.options).filter(Boolean).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(accessibilityState.options).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Accessibility Settings Panel */}
      {showAccessibilityPanel && (
        <Card 
          className="absolute top-12 right-0 z-20 w-80 shadow-lg"
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="true"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Accessibility Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeAccessibilityPanel}
                aria-label="Close accessibility settings"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* High Contrast */}
              <Button
                variant={accessibilityState.options.highContrast ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleHighContrast}
                aria-pressed={accessibilityState.options.highContrast}
                style={{ minHeight: '44px' }}
              >
                <Contrast className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">High Contrast Mode</span>
                {accessibilityState.options.highContrast && <Check className="h-4 w-4" />}
              </Button>

              {/* Large Text */}
              <Button
                variant={accessibilityState.options.largeText ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleLargeText}
                aria-pressed={accessibilityState.options.largeText}
                style={{ minHeight: '44px' }}
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">Large Text</span>
                {accessibilityState.options.largeText && <Check className="h-4 w-4" />}
              </Button>

              {/* Audio Feedback */}
              <Button
                variant={accessibilityState.options.audioFeedback ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleAudioFeedback}
                aria-pressed={accessibilityState.options.audioFeedback}
                style={{ minHeight: '44px' }}
              >
                {accessibilityState.options.audioFeedback ? (
                  <Volume2 className="h-4 w-4 mr-2" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-2" />
                )}
                <span className="flex-1 text-left">Audio Feedback</span>
                {accessibilityState.options.audioFeedback && <Check className="h-4 w-4" />}
              </Button>

              {/* Keyboard Navigation */}
              <Button
                variant={accessibilityState.options.keyboardNavigation ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleKeyboardNavigation}
                aria-pressed={accessibilityState.options.keyboardNavigation}
                style={{ minHeight: '44px' }}
              >
                <KeyboardIcon className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">Keyboard Navigation</span>
                {accessibilityState.options.keyboardNavigation && <Check className="h-4 w-4" />}
              </Button>

              {/* Screen Reader Mode */}
              <Button
                variant={accessibilityState.options.screenReaderMode ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleScreenReaderMode}
                aria-pressed={accessibilityState.options.screenReaderMode}
                style={{ minHeight: '44px' }}
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">Screen Reader Mode</span>
                {accessibilityState.options.screenReaderMode && <Check className="h-4 w-4" />}
              </Button>

              {/* Reduced Motion */}
              <Button
                variant={accessibilityState.options.reducedMotion ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={toggleReducedMotion}
                aria-pressed={accessibilityState.options.reducedMotion}
                style={{ minHeight: '44px' }}
              >
                <Type className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">Reduced Motion</span>
                {accessibilityState.options.reducedMotion && <Check className="h-4 w-4" />}
              </Button>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Alt+S</kbd> Focus search</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Alt+F</kbd> Focus filters</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Alt+R</kbd> Focus results</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Alt+H</kbd> Toggle high contrast</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Alt+T</kbd> Toggle large text</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Clear focus</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Search Interface */}
      <SearchInterface
        {...searchProps}
        className={`
          ${searchProps.className || ''}
          ${accessibilityState.options.highContrast ? 'high-contrast' : ''}
          ${accessibilityState.options.largeText ? 'large-text' : ''}
          ${accessibilityState.options.reducedMotion ? 'reduced-motion' : ''}
        `}
      />

      {/* Screen Reader Status Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {accessibilityState.announcements[accessibilityState.announcements.length - 1]}
      </div>
    </div>
  );
};

export default AccessibleSearchInterface;
