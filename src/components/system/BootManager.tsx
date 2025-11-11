import React, { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';
import { useBootSequence, createAsyncStep } from '@/hooks/useBootSequence';

interface BootManagerProps {
  children: React.ReactNode;
  onBootComplete?: (bootTime: number) => void;
}

export const BootManager: React.FC<BootManagerProps> = ({ children, onBootComplete }) => {
  const [electronBootTime, setElectronBootTime] = useState<number | null>(null);

  // Listen for Electron boot complete event
  useEffect(() => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      (window as any).electronAPI.onBootComplete((data: { bootTime: number }) => {
        setElectronBootTime(data.bootTime);
      });
    }
  }, []);

  // Define boot sequence steps
  const bootSteps = [
    createAsyncStep('Loading configuration...', async () => {
      // Configuration is already loaded via ConfigManager
      // This is a placeholder for any additional config loading
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 1),

    createAsyncStep('Initializing 3D engine...', async () => {
      // WebGL context will be initialized when Canvas mounts
      // This is a placeholder for any pre-initialization
      await new Promise(resolve => setTimeout(resolve, 200));
    }, 2),

    createAsyncStep('Loading assets...', async () => {
      // Assets will be loaded by AssetLoader component
      // This is a placeholder for critical asset preloading
      await new Promise(resolve => setTimeout(resolve, 300));
    }, 3),

    createAsyncStep('Preparing interface...', async () => {
      // Final preparations before showing the app
      await new Promise(resolve => setTimeout(resolve, 100));
    }, 1),
  ];

  const bootState = useBootSequence(bootSteps);

  useEffect(() => {
    if (!bootState.isBooting && bootState.bootTime !== null) {
      onBootComplete?.(bootState.bootTime);
    }
  }, [bootState.isBooting, bootState.bootTime, onBootComplete]);

  if (bootState.isBooting) {
    return (
      <LoadingScreen
        progress={bootState.progress}
        message={bootState.message}
        bootTime={electronBootTime}
        targetBootTime={5000}
      />
    );
  }

  if (bootState.error) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Boot Error</h1>
          <p className="mb-4">{bootState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-red-900 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BootManager;
