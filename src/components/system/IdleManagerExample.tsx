import React, { useState } from 'react';
import { IdleManager } from './IdleManager';
import { useKioskStore } from '@/store/kioskStore';
import { useIdleStore } from '@/store/idleStore';

/**
 * IdleManagerExample Component
 * 
 * Demonstrates how to integrate IdleManager with modal state management
 * and proper cleanup on auto-reset.
 * 
 * This example shows:
 * - How to track modal states
 * - How to clear modals on auto-reset
 * - How to handle idle and attract mode callbacks
 */

export const IdleManagerExample: React.FC = () => {
  // Example modal states that should be cleared on reset
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Kiosk and idle state
  const currentRoute = useKioskStore((state) => state.currentRoute);
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const isIdle = useIdleStore((state) => state.isIdle);

  /**
   * Handle idle state entry (45s)
   * Optional: Show subtle UI hints or start attract animations
   */
  const handleIdle = () => {
    console.log('[Example] User is idle - attract mode starting');
    // You could show a subtle hint like "Tap anywhere to continue"
  };

  /**
   * Handle attract mode entry (45s)
   * The attract loop animations are handled by AttractLoop component
   */
  const handleAttract = () => {
    console.log('[Example] Attract mode active - animations running');
  };

  /**
   * Handle auto-reset (120s)
   * Clear all modal states and return to clean home state
   */
  const handleReset = () => {
    console.log('[Example] Auto-reset triggered - clearing all modals');
    
    // Close all modals
    setIsAdminOpen(false);
    setIsSearchOpen(false);
    setIsDialogOpen(false);
    
    // Clear any other application state that should reset
    // Examples:
    // - Clear search queries
    // - Reset filters
    // - Close overlays
    // - Clear form data
    // - Reset zoom levels
    // - Clear selections
    
    console.log('[Example] All modals cleared - ready for next user');
  };

  return (
    <div className="relative w-full h-full">
      {/* IdleManager - handles all idle/attract/reset logic */}
      <IdleManager
        enabled={true}
        idleTimeout={45000} // 45 seconds
        attractTimeout={120000} // 120 seconds (2 minutes)
        onIdle={handleIdle}
        onAttract={handleAttract}
        onReset={handleReset}
      />

      {/* Main content */}
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Idle Manager Example</h1>
        
        {/* Status indicators */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Current Route:</span>
            <span className="px-2 py-1 bg-blue-100 rounded">{currentRoute}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold">Idle Status:</span>
            <span className={`px-2 py-1 rounded ${isIdle ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {isIdle ? 'Idle' : 'Active'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold">Attract Mode:</span>
            <span className={`px-2 py-1 rounded ${isInAttractMode ? 'bg-orange-100' : 'bg-gray-100'}`}>
              {isInAttractMode ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Example modals */}
        <div className="space-y-4">
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Admin Modal
          </button>
          
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
          >
            Toggle Search Modal
          </button>
          
          <button
            onClick={() => setIsDialogOpen(!isDialogOpen)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-2"
          >
            Toggle Dialog
          </button>
        </div>

        {/* Modal states */}
        <div className="mt-6 space-y-2">
          <div>Admin Modal: {isAdminOpen ? '✅ Open' : '❌ Closed'}</div>
          <div>Search Modal: {isSearchOpen ? '✅ Open' : '❌ Closed'}</div>
          <div>Dialog: {isDialogOpen ? '✅ Open' : '❌ Closed'}</div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open some modals using the buttons above</li>
            <li>Stop interacting with the page for 45 seconds</li>
            <li>Watch the "Idle Status" change to "Idle"</li>
            <li>Watch the "Attract Mode" change to "Active"</li>
            <li>Continue not interacting for another 75 seconds (120s total)</li>
            <li>All modals will automatically close and route will reset to home</li>
          </ol>
        </div>
      </div>

      {/* Example modals (simplified) */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Admin Modal</h2>
            <p>This will close on auto-reset</p>
            <button
              onClick={() => setIsAdminOpen(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Search Modal</h2>
            <p>This will close on auto-reset</p>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Dialog</h2>
            <p>This will close on auto-reset</p>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdleManagerExample;
