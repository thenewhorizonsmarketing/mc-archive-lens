// Cached Data Warning Component
// Displays a warning when showing cached data during errors
import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CachedDataWarningProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
  errorMessage?: string;
  lastUpdated?: Date;
  isRetrying?: boolean;
}

/**
 * CachedDataWarning Component
 * 
 * Displays a warning banner when showing cached data due to errors
 * Provides manual refresh option
 * 
 * Requirements: 9.3, 9.5
 */
export function CachedDataWarning({
  onRefresh,
  onDismiss,
  errorMessage,
  lastUpdated,
  isRetrying = false
}: CachedDataWarningProps) {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div 
      className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isRetrying ? (
            <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" aria-hidden="true" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            {isRetrying ? 'Reconnecting...' : 'Showing Cached Data'}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
            {isRetrying ? (
              'Attempting to reconnect to the database. The data shown may be outdated.'
            ) : (
              'Unable to fetch latest data. Showing previously loaded content.'
            )}
          </p>
          
          {errorMessage && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-mono">
              Error: {errorMessage}
            </p>
          )}
          
          {lastUpdated && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {onRefresh && !isRetrying && (
              <Button
                onClick={onRefresh}
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
                Try Again
              </Button>
            )}
            
            {onDismiss && !isRetrying && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OfflineWarning Component
 * 
 * Displays a warning when the application is offline
 * Requirements: 9.3
 */
export function OfflineWarning() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div 
      className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            No Internet Connection
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            You are currently offline. Some features may not be available.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * StaleDataIndicator Component
 * 
 * Small indicator for stale data in the UI
 * Requirements: 9.3
 */
export function StaleDataIndicator({ 
  lastUpdated,
  className = ''
}: { 
  lastUpdated: Date;
  className?: string;
}) {
  const isStale = new Date().getTime() - lastUpdated.getTime() > 300000; // 5 minutes

  if (!isStale) return null;

  return (
    <div 
      className={`inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ${className}`}
      role="status"
      aria-label="Data may be outdated"
    >
      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
      <span>Data may be outdated</span>
    </div>
  );
}

/**
 * ConnectionStatusIndicator Component
 * 
 * Shows current connection status
 * Requirements: 9.3
 */
export function ConnectionStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
        isOnline 
          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' 
          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" aria-hidden="true" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" aria-hidden="true" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

export default CachedDataWarning;
