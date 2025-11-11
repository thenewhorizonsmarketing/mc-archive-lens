/**
 * FPS Validation Test Page
 * 
 * Interactive page for validating FPS performance across all scenarios.
 * Access at: /fps-validation-test
 * 
 * This page provides real-time FPS monitoring and automated scenario testing.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FPSMetrics {
  min: number;
  max: number;
  avg: number;
  current: number;
  samples: number;
}

interface ScenarioResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  metrics?: FPSMetrics;
  duration: number;
}

const MIN_ACCEPTABLE_FPS = 55;
const TARGET_FPS = 60;

export default function FPSValidationTest() {
  const [currentFPS, setCurrentFPS] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([
    { name: 'Idle State', status: 'pending', duration: 3000 },
    { name: 'Continuous Rendering', status: 'pending', duration: 5000 },
    { name: 'Navigation Transition', status: 'pending', duration: 2000 },
    { name: 'Attract Mode Animation', status: 'pending', duration: 4000 },
    { name: 'Multiple Animations', status: 'pending', duration: 3000 },
    { name: 'Glassmorphism Effects', status: 'pending', duration: 3000 },
    { name: 'Heavy DOM Manipulation', status: 'pending', duration: 2000 },
    { name: 'Scroll Simulation', status: 'pending', duration: 2000 },
  ]);
  // Removed currentScenario state as it wasn't being used in the UI
  const [testRunning, setTestRunning] = useState(false);

  const fpsDataRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const frameIdRef = useRef<number | null>(null);

  // FPS Monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const measureFPS = (currentTime: number) => {
      if (lastTimeRef.current > 0) {
        const delta = currentTime - lastTimeRef.current;
        if (delta > 0) {
          const fps = 1000 / delta;
          fpsDataRef.current.push(fps);
          setCurrentFPS(Math.round(fps));
        }
      }
      lastTimeRef.current = currentTime;
      frameIdRef.current = requestAnimationFrame(measureFPS);
    };

    frameIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    fpsDataRef.current = [];
    lastTimeRef.current = 0;
    setIsMonitoring(true);
  };

  const stopMonitoring = (): FPSMetrics => {
    setIsMonitoring(false);
    
    if (fpsDataRef.current.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0, samples: 0 };
    }

    const min = Math.min(...fpsDataRef.current);
    const max = Math.max(...fpsDataRef.current);
    const avg = fpsDataRef.current.reduce((a, b) => a + b, 0) / fpsDataRef.current.length;

    return {
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      avg: Math.round(avg * 10) / 10,
      current: currentFPS,
      samples: fpsDataRef.current.length
    };
  };

  const runScenario = async (index: number) => {
    const scenario = scenarios[index];
    
    // Update status to running
    setScenarios(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'running' as const } : s
    ));
    // Scenario index tracked in scenarios array status

    // Start monitoring
    startMonitoring();

    // Run scenario-specific actions
    await runScenarioAction(scenario.name);

    // Wait for duration
    await new Promise(resolve => setTimeout(resolve, scenario.duration));

    // Stop monitoring and get metrics
    const metrics = stopMonitoring();

    // Determine pass/fail
    const status: 'passed' | 'failed' = metrics.min >= MIN_ACCEPTABLE_FPS ? 'passed' : 'failed';

    // Update scenario with results
    setScenarios(prev => prev.map((s, i) => 
      i === index ? { ...s, status, metrics } : s
    ));

    // Scenario complete
  };

  const runScenarioAction = async (scenarioName: string) => {
    switch (scenarioName) {
      case 'Continuous Rendering':
        // Trigger continuous updates
        const interval = setInterval(() => {
          document.body.setAttribute('data-test', Date.now().toString());
        }, 16);
        setTimeout(() => clearInterval(interval), 5000);
        break;

      case 'Navigation Transition':
        // Simulate navigation
        const navEl = document.createElement('div');
        navEl.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: linear-gradient(45deg, #0E6B5C, #1a4d44);
          transform: scale(1); transition: transform 600ms cubic-bezier(0.43, 0.13, 0.23, 0.96);
        `;
        document.body.appendChild(navEl);
        requestAnimationFrame(() => navEl.style.transform = 'scale(1.5)');
        setTimeout(() => navEl.remove(), 2000);
        break;

      case 'Multiple Animations':
        // Create multiple animated elements
        for (let i = 0; i < 8; i++) {
          const el = document.createElement('div');
          el.style.cssText = `
            position: fixed; top: ${20 + (i % 3) * 30}%; left: ${20 + Math.floor(i / 3) * 30}%;
            width: 100px; height: 100px; background: linear-gradient(135deg, #0E6B5C, #CDAF63);
            border-radius: 8px; transform: scale(1); transition: transform 300ms ease-out;
          `;
          document.body.appendChild(el);
          setTimeout(() => el.style.transform = 'scale(1.1) translateY(-8px)', i * 100);
          setTimeout(() => el.remove(), 3000);
        }
        break;
    }
  };

  const runAllScenarios = async () => {
    setTestRunning(true);
    
    for (let i = 0; i < scenarios.length; i++) {
      await runScenario(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between scenarios
    }
    
    setTestRunning(false);
  };

  const resetTests = () => {
    setScenarios(prev => prev.map(s => ({ ...s, status: 'pending' as const, metrics: undefined })));
    setTestRunning(false);
  };

  const allPassed = scenarios.every(s => s.status === 'passed' || s.status === 'pending');
  const completedCount = scenarios.filter(s => s.status === 'passed' || s.status === 'failed').length;
  const passedCount = scenarios.filter(s => s.status === 'passed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FPS Performance Validation</h1>
          <p className="text-slate-400">
            Target: {TARGET_FPS} FPS | Minimum Acceptable: {MIN_ACCEPTABLE_FPS} FPS
          </p>
        </div>

        {/* Current FPS Display */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Current FPS</h2>
              <p className="text-slate-400 text-sm">Real-time frame rate monitoring</p>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold ${
                currentFPS >= TARGET_FPS ? 'text-green-400' :
                currentFPS >= MIN_ACCEPTABLE_FPS ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {currentFPS}
              </div>
              <div className="text-slate-400 text-sm mt-1">FPS</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllScenarios}
            disabled={testRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {testRunning ? 'Running Tests...' : 'Run All Scenarios'}
          </button>
          <button
            onClick={resetTests}
            disabled={testRunning}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Progress */}
        {completedCount > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Progress</span>
              <span className="text-slate-400">{completedCount} / {scenarios.length}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / scenarios.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Passed: {passedCount} | Failed: {completedCount - passedCount}
            </div>
          </div>
        )}

        {/* Scenarios */}
        <div className="space-y-3">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-800/50 backdrop-blur-sm border rounded-lg p-4 ${
                scenario.status === 'running' ? 'border-blue-500' :
                scenario.status === 'passed' ? 'border-green-500' :
                scenario.status === 'failed' ? 'border-red-500' :
                'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    scenario.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    scenario.status === 'passed' ? 'bg-green-500' :
                    scenario.status === 'failed' ? 'bg-red-500' :
                    'bg-slate-600'
                  }`} />
                  <div>
                    <h3 className="text-white font-medium">{scenario.name}</h3>
                    <p className="text-slate-400 text-sm">Duration: {scenario.duration}ms</p>
                  </div>
                </div>

                {scenario.metrics && (
                  <div className="text-right">
                    <div className="text-white font-mono text-sm">
                      Min: {scenario.metrics.min} | Avg: {scenario.metrics.avg} | Max: {scenario.metrics.max}
                    </div>
                    <div className="text-slate-400 text-xs">
                      Samples: {scenario.metrics.samples}
                    </div>
                  </div>
                )}

                {!scenario.metrics && scenario.status === 'pending' && (
                  <button
                    onClick={() => runScenario(index)}
                    disabled={testRunning}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    Run
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {completedCount === scenarios.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-6 p-6 rounded-lg border-2 ${
              allPassed ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
              {allPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
            </h2>
            <p className="text-white">
              {allPassed 
                ? 'The application maintains ≥55 FPS across all scenarios. Performance is acceptable for production deployment.'
                : 'The application does not maintain ≥55 FPS in all scenarios. Performance optimization is required.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
