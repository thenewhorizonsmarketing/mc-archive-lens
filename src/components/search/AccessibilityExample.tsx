// Example Usage of Accessible Search Interface
import React from 'react';
import { AccessibleSearchInterface } from './AccessibleSearchInterface';
import { SearchResult } from '@/lib/database/types';

export const AccessibilityExample: React.FC = () => {
  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected result:', result);
    // Navigate to result detail page or open modal
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Accessible Search Interface Example
      </h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Features Demonstrated:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>WCAG 2.1 AA compliant search interface</li>
          <li>High contrast mode for low vision users</li>
          <li>Large text mode for better readability</li>
          <li>Screen reader support with ARIA labels</li>
          <li>Keyboard navigation with shortcuts</li>
          <li>Touch-optimized with 44px minimum targets</li>
          <li>Audio feedback for interactions</li>
          <li>Reduced motion for motion-sensitive users</li>
        </ul>
      </div>

      {/* Accessible Search Interface with all features enabled */}
      <AccessibleSearchInterface
        onResultSelect={handleResultSelect}
        placeholder="Search for alumni, publications, photos, or faculty..."
        showFilters={true}
        showSuggestions={true}
        showKeyboard={false}
        maxResults={50}
        debounceMs={300}
        enableAccessibilityControls={true}
        initialAccessibilityOptions={{
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          screenReaderMode: false,
          keyboardNavigation: true,
          audioFeedback: false
        }}
      />

      {/* Accessibility Information */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Accessibility Features</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Keyboard Shortcuts:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+S</kbd> Focus search</div>
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+F</kbd> Focus filters</div>
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+R</kbd> Focus results</div>
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+H</kbd> Toggle high contrast</div>
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+T</kbd> Toggle large text</div>
              <div><kbd className="px-2 py-1 bg-white border rounded">Alt+A</kbd> Toggle audio</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Screen Reader Support:</h4>
            <ul className="text-sm space-y-1">
              <li>• All interactive elements have descriptive ARIA labels</li>
              <li>• Search results announced via live regions</li>
              <li>• Semantic HTML structure for proper navigation</li>
              <li>• Status updates communicated to assistive technology</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Visual Accessibility:</h4>
            <ul className="text-sm space-y-1">
              <li>• Color contrast ratios meet WCAG AA standards (4.5:1 minimum)</li>
              <li>• High contrast mode available for enhanced visibility</li>
              <li>• Text can be resized up to 200% without loss of functionality</li>
              <li>• Focus indicators clearly visible on all interactive elements</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Touch Accessibility:</h4>
            <ul className="text-sm space-y-1">
              <li>• All touch targets minimum 44x44 pixels</li>
              <li>• Adequate spacing between interactive elements</li>
              <li>• Touch gestures have keyboard alternatives</li>
              <li>• Visual feedback for all touch interactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">Keyboard Navigation Test:</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Press Tab to navigate through interactive elements</li>
              <li>Verify focus indicators are clearly visible</li>
              <li>Use Alt+S to jump to search input</li>
              <li>Use Alt+F to jump to filters</li>
              <li>Press Escape to clear focus</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium">Screen Reader Test:</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Enable NVDA (Windows) or VoiceOver (Mac)</li>
              <li>Navigate through the interface with arrow keys</li>
              <li>Verify all elements are announced correctly</li>
              <li>Perform a search and listen for result announcements</li>
              <li>Check that filter changes are communicated</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium">Visual Accessibility Test:</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Click the Accessibility button in the top right</li>
              <li>Enable High Contrast mode and verify readability</li>
              <li>Enable Large Text mode and check layout</li>
              <li>Zoom browser to 200% and verify functionality</li>
              <li>Check color contrast with browser DevTools</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium">Touch Accessibility Test:</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Use touch device or browser touch emulation</li>
              <li>Verify all buttons are easy to tap (44x44px minimum)</li>
              <li>Check spacing between interactive elements</li>
              <li>Test with different finger sizes</li>
              <li>Verify touch feedback is provided</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityExample;
