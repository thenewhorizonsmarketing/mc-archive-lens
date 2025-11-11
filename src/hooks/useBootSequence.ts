import { useState, useEffect } from 'react';

interface BootSequenceState {
  isBooting: boolean;
  progress: number;
  message: string;
  bootTime: number | null;
  error: string | null;
}

interface BootStep {
  name: string;
  weight: number;
  action: () => Promise<void>;
}

export const useBootSequence = (steps: BootStep[]) => {
  const [state, setState] = useState<BootSequenceState>({
    isBooting: true,
    progress: 0,
    message: 'Initializing...',
    bootTime: null,
    error: null,
  });

  useEffect(() => {
    const bootStartTime = Date.now();
    let currentProgress = 0;

    const executeBootSequence = async () => {
      try {
        const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);

        for (const step of steps) {
          setState(prev => ({
            ...prev,
            message: step.name,
          }));

          await step.action();

          currentProgress += (step.weight / totalWeight) * 100;
          setState(prev => ({
            ...prev,
            progress: Math.min(currentProgress, 100),
          }));
        }

        const bootTime = Date.now() - bootStartTime;

        setState({
          isBooting: false,
          progress: 100,
          message: 'Ready',
          bootTime,
          error: null,
        });

        // Notify Electron that renderer is ready
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
          (window as any).electronAPI.rendererReady();
        }

        // Log boot time
        console.log(`Boot sequence completed in ${bootTime}ms`);
        if (bootTime > 5000) {
          console.warn(`Boot time exceeded 5-second target: ${bootTime}ms`);
        }
      } catch (error) {
        const bootTime = Date.now() - bootStartTime;
        setState({
          isBooting: false,
          progress: 0,
          message: 'Boot failed',
          bootTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error('Boot sequence failed:', error);
      }
    };

    executeBootSequence();
  }, [steps]);

  return state;
};

// Helper to create a delay step (for testing)
export const createDelayStep = (name: string, ms: number, weight: number = 1): BootStep => ({
  name,
  weight,
  action: () => new Promise(resolve => setTimeout(resolve, ms)),
});

// Helper to create an async step
export const createAsyncStep = (
  name: string,
  action: () => Promise<void>,
  weight: number = 1
): BootStep => ({
  name,
  weight,
  action,
});
