import React, { useState } from 'react';
import { AdminOverlay } from './AdminOverlay';
import { AdminGestureDetector } from './AdminGestureDetector';
import type { KioskConfig } from '@/types/kiosk-config';

/**
 * AdminExample Component
 * 
 * Demonstrates how to integrate AdminOverlay and AdminGestureDetector
 * into the main KioskApp component
 * 
 * Usage in KioskApp:
 * ```tsx
 * import { AdminOverlay, AdminGestureDetector } from '@/components/admin';
 * 
 * function KioskApp() {
 *   const [isAdminOpen, setIsAdminOpen] = useState(false);
 *   const [config, setConfig] = useState<KioskConfig>({...});
 * 
 *   const handleConfigChange = (updates: Partial<KioskConfig>) => {
 *     setConfig(prev => ({ ...prev, ...updates }));
 *     // Optionally persist to localStorage or config file
 *   };
 * 
 *   return (
 *     <>
 *       <AdminGestureDetector
 *         adminPin={config.adminPin}
 *         onAdminAccess={() => setIsAdminOpen(true)}
 *         isAdminOpen={isAdminOpen}
 *       />
 *       
 *       <AdminOverlay
 *         isOpen={isAdminOpen}
 *         onClose={() => setIsAdminOpen(false)}
 *         config={config}
 *         onConfigChange={handleConfigChange}
 *       />
 *       
 *       {/* Rest of your kiosk app *\/}
 *     </>
 *   );
 * }
 * ```
 */

export const AdminExample: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [config, setConfig] = useState<KioskConfig>({
    rooms: [],
    idleTimeout: 45000,
    attractTimeout: 120000,
    adminPin: '1234',
    motionTier: 'auto',
    reducedMotion: false,
    autoTierEnabled: true
  });

  const handleConfigChange = (updates: Partial<KioskConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    console.log('[AdminExample] Config updated:', updates);
    
    // In a real app, you would persist this to localStorage or config file
    // localStorage.setItem('kioskConfig', JSON.stringify({ ...config, ...updates }));
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex items-center justify-center">
      {/* Admin Gesture Detector - always active */}
      <AdminGestureDetector
        adminPin={config.adminPin}
        onAdminAccess={() => setIsAdminOpen(true)}
        isAdminOpen={isAdminOpen}
      />
      
      {/* Admin Overlay - shown when gesture + PIN validated */}
      <AdminOverlay
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />
      
      {/* Demo content */}
      <div className="text-center text-slate-400 space-y-4">
        <h1 className="text-3xl font-bold text-slate-100">Admin System Demo</h1>
        <p className="text-lg">
          Tap and hold the upper-left corner for 3 seconds
        </p>
        <p className="text-sm">
          Default PIN: <span className="font-mono text-blue-400">1234</span>
        </p>
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-700 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Current Config</h2>
          <div className="text-left text-sm space-y-1">
            <p>Idle Timeout: {config.idleTimeout / 1000}s</p>
            <p>Attract Timeout: {config.attractTimeout / 1000}s</p>
            <p>Motion Tier: {config.motionTier}</p>
            <p>Reduced Motion: {config.reducedMotion ? 'Yes' : 'No'}</p>
            <p>Auto-Tier: {config.autoTierEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
