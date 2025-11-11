// ============================================================================
// 3D CLUE BOARD KIOSK - LOADING SCREEN COMPONENT
// ============================================================================

import React, { useEffect, useState } from 'react';
import type { AssetLoadProgress } from '@/lib/assets/AssetLoader';

/**
 * Props for LoadingScreen component
 */
export interface LoadingScreenProps {
  /** Current loading progress */
  progress: AssetLoadProgress;
  /** Boot start time for metrics */
  bootStartTime?: number;
  /** Whether to show detailed metrics */
  showMetrics?: boolean;
}

/**
 * LoadingScreen displays boot progress and asset loading status
 * 
 * Requirements:
 * - 8.1: Boot to full-screen within 5 seconds
 * - 13.1: Display boot time metrics
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  bootStartTime = Date.now(),
  showMetrics = false,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - bootStartTime);
    }, 100);

    return () => clearInterval(interval);
  }, [bootStartTime]);

  const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
  const isSlowBoot = elapsedTime > 5000;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Logo/Branding */}
        <div className="loading-logo">
          <div className="logo-icon">MC</div>
          <h1 className="logo-text">Museum & Archives</h1>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.percentage}%
          </div>
        </div>

        {/* Loading Status */}
        <div className="loading-status">
          <div className="status-phase">
            {getPhaseLabel(progress.phase)}
          </div>
          {progress.currentAsset && (
            <div className="status-asset">
              {progress.currentAsset}
            </div>
          )}
          <div className="status-count">
            {progress.loaded} / {progress.total} assets
          </div>
        </div>

        {/* Boot Metrics */}
        {showMetrics && (
          <div className="loading-metrics">
            <div className={`metric-time ${isSlowBoot ? 'metric-warning' : ''}`}>
              Boot Time: {elapsedSeconds}s
              {isSlowBoot && ' (exceeds 5s target)'}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0E6B5C 0%, #1a4d44 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          font-family: 'Cinzel', serif;
        }

        .loading-content {
          max-width: 600px;
          width: 90%;
          text-align: center;
        }

        .loading-logo {
          margin-bottom: 3rem;
        }

        .logo-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 1.5rem;
          background: #6B3F2B;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          color: #F5E6C8;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .logo-text {
          font-size: 32px;
          font-weight: 600;
          color: #F5E6C8;
          margin: 0;
          letter-spacing: 2px;
        }

        .loading-progress {
          margin-bottom: 2rem;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(245, 230, 200, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #CDAF63 0%, #F5E6C8 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 0 12px rgba(205, 175, 99, 0.5);
        }

        .progress-text {
          font-size: 24px;
          font-weight: 600;
          color: #F5E6C8;
          margin-top: 0.5rem;
        }

        .loading-status {
          color: #F5E6C8;
          opacity: 0.9;
        }

        .status-phase {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-transform: capitalize;
        }

        .status-asset {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 0.5rem;
          font-family: monospace;
        }

        .status-count {
          font-size: 14px;
          opacity: 0.7;
        }

        .loading-metrics {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(245, 230, 200, 0.2);
        }

        .metric-time {
          font-size: 14px;
          color: #F5E6C8;
          opacity: 0.8;
        }

        .metric-warning {
          color: #ff9800;
          font-weight: 600;
        }

        /* Animation */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .status-phase {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Get human-readable label for loading phase
 */
function getPhaseLabel(phase: AssetLoadProgress['phase']): string {
  switch (phase) {
    case 'models':
      return 'Loading 3D Models';
    case 'textures':
      return 'Loading Textures';
    case 'fonts':
      return 'Loading Fonts';
    case 'complete':
      return 'Complete';
    default:
      return 'Loading';
  }
}

/**
 * Minimal loading screen for quick boot
 */
export const MinimalLoadingScreen: React.FC = () => {
  return (
    <div className="minimal-loading-screen">
      <div className="minimal-spinner" />
      <style>{`
        .minimal-loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0E6B5C;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .minimal-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(245, 230, 200, 0.2);
          border-top-color: #CDAF63;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
