/**
 * Example: How to use KioskApp component
 * 
 * This file demonstrates how to integrate the KioskApp component
 * into your application. The KioskApp handles:
 * - Configuration loading
 * - WebGL detection
 * - Error boundaries
 * - State management initialization
 * - Idle timer management
 */

import { KioskApp } from './KioskApp';

/**
 * Example usage of KioskApp with render props pattern
 */
export const KioskAppExample = () => {
  return (
    <KioskApp>
      {({ config, isLoading, use3D, webGLAvailable }) => {
        // Show loading screen while initializing
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <div className="text-white text-2xl">Loading Kiosk...</div>
            </div>
          );
        }

        // Show error if config failed to load
        if (!config) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <div className="text-white text-2xl">Configuration Error</div>
            </div>
          );
        }

        // Render 3D or 2D based on capabilities
        if (use3D && webGLAvailable) {
          return (
            <div className="min-h-screen bg-gray-900">
              <h1 className="text-white text-4xl p-8">3D Mode Active</h1>
              <p className="text-white p-8">
                WebGL is available. Render your 3D scene here.
              </p>
              <pre className="text-white p-8 text-sm">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          );
        }

        // Fallback to 2D mode
        return (
          <div className="min-h-screen bg-gray-900">
            <h1 className="text-white text-4xl p-8">2D Fallback Mode</h1>
            <p className="text-white p-8">
              WebGL is not available or reduced motion is enabled.
              Render your 2D fallback here.
            </p>
            <pre className="text-white p-8 text-sm">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        );
      }}
    </KioskApp>
  );
};

/**
 * Alternative: Using KioskApp with separate components
 */
export const KioskAppWithComponents = () => {
  return (
    <KioskApp>
      {({ config, isLoading, use3D, webGLAvailable }) => {
        if (isLoading) return <LoadingScreen />;
        if (!config) return <ErrorScreen />;
        
        return use3D && webGLAvailable 
          ? <ThreeDBoard config={config} />
          : <TwoDFallback config={config} />;
      }}
    </KioskApp>
  );
};

// Example placeholder components
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-white text-2xl">Loading...</div>
  </div>
);

const ErrorScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-white text-2xl">Error loading configuration</div>
  </div>
);

const ThreeDBoard = ({ config }: { config: any }) => (
  <div className="min-h-screen bg-gray-900">
    <h1 className="text-white text-4xl p-8">3D Board</h1>
    <p className="text-white p-8">Rooms: {config.rooms.length}</p>
  </div>
);

const TwoDFallback = ({ config }: { config: any }) => (
  <div className="min-h-screen bg-gray-900">
    <h1 className="text-white text-4xl p-8">2D Fallback</h1>
    <p className="text-white p-8">Rooms: {config.rooms.length}</p>
  </div>
);
