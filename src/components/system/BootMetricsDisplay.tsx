/**
 * Boot Metrics Display Component
 * 
 * Displays boot performance metrics for validation
 * Requirements: 8.1, 13.1
 */

import React, { useEffect, useState } from 'react';

interface BootMetrics {
  processStart: number;
  electronReady: number;
  windowCreated: number;
  contentLoaded: number;
  readyToShow: number;
  total: number;
  meetsTarget: boolean;
  target: number;
}

export const BootMetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState<BootMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
          const bootMetrics = await (window as any).electronAPI.getBootMetrics();
          setMetrics(bootMetrics);
        } else {
          setError('Not running in Electron environment');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load boot metrics');
      }
    };

    loadMetrics();
  }, []);

  if (error) {
    return (
      <div className="boot-metrics-error">
        <p>Boot metrics unavailable: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="boot-metrics-loading">
        <p>Loading boot metrics...</p>
      </div>
    );
  }

  const percentage = (metrics.total / metrics.target) * 100;
  const isGood = metrics.meetsTarget;
  const isWarning = !isGood && percentage < 110;
  const isCritical = percentage >= 110;

  return (
    <div className="boot-metrics-display">
      <h3>Boot Performance Metrics</h3>
      
      <div className={`boot-status ${isGood ? 'good' : isWarning ? 'warning' : 'critical'}`}>
        <div className="status-indicator" />
        <div className="status-text">
          {isGood && '✓ Boot time within target'}
          {isWarning && '⚠️ Boot time approaching limit'}
          {isCritical && '❌ Boot time exceeds target'}
        </div>
      </div>

      <div className="metrics-summary">
        <div className="metric-total">
          <span className="metric-label">Total Boot Time:</span>
          <span className={`metric-value ${!isGood ? 'metric-warning' : ''}`}>
            {metrics.total}ms
          </span>
        </div>
        <div className="metric-target">
          <span className="metric-label">Target:</span>
          <span className="metric-value">{metrics.target}ms</span>
        </div>
        <div className="metric-percentage">
          <span className="metric-label">Percentage:</span>
          <span className={`metric-value ${!isGood ? 'metric-warning' : ''}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="metrics-breakdown">
        <h4>Breakdown</h4>
        <div className="metric-item">
          <span className="metric-name">Electron Ready:</span>
          <span className="metric-time">{metrics.electronReady}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-name">Window Created:</span>
          <span className="metric-time">{metrics.windowCreated}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-name">Content Loaded:</span>
          <span className="metric-time">{metrics.contentLoaded}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-name">Ready to Show:</span>
          <span className="metric-time">{metrics.readyToShow}ms</span>
        </div>
      </div>

      <style>{`
        .boot-metrics-display {
          padding: 1rem;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          color: #fff;
          font-family: monospace;
          font-size: 14px;
        }

        .boot-metrics-display h3 {
          margin: 0 0 1rem 0;
          font-size: 16px;
          font-weight: 600;
        }

        .boot-metrics-display h4 {
          margin: 1rem 0 0.5rem 0;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.8;
        }

        .boot-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .boot-status.good {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.5);
        }

        .boot-status.warning {
          background: rgba(255, 152, 0, 0.2);
          border: 1px solid rgba(255, 152, 0, 0.5);
        }

        .boot-status.critical {
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid rgba(244, 67, 54, 0.5);
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .boot-status.good .status-indicator {
          background: #4caf50;
        }

        .boot-status.warning .status-indicator {
          background: #ff9800;
        }

        .boot-status.critical .status-indicator {
          background: #f44336;
        }

        .status-text {
          font-weight: 600;
        }

        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .metric-total,
        .metric-target,
        .metric-percentage {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-size: 12px;
          opacity: 0.7;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 600;
        }

        .metric-warning {
          color: #ff9800;
        }

        .metrics-breakdown {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric-item:last-child {
          border-bottom: none;
        }

        .metric-name {
          opacity: 0.8;
        }

        .metric-time {
          font-weight: 600;
        }

        .boot-metrics-error,
        .boot-metrics-loading {
          padding: 1rem;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          color: #fff;
          font-family: monospace;
        }

        .boot-metrics-error {
          border: 1px solid rgba(244, 67, 54, 0.5);
        }
      `}</style>
    </div>
  );
};
