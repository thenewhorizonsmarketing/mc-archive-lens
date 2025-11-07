// Search Error Recovery Component
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSearch } from '@/lib/search-context';

export interface SearchErrorRecoveryProps {
  className?: string;
}

export const SearchErrorRecovery: React.FC<SearchErrorRecoveryProps> = ({
  className = ""
}) => {
  const { errorRecoveryState, attemptRecovery, healthStatus } = useSearch();
  const [isAttemptingRecovery, setIsAttemptingRecovery] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleRecoveryAttempt = async () => {
    setIsAttemptingRecovery(true);
    setRecoveryProgress(0);
    setRecoveryMessage('Initializing recovery...');

    try {
      // Simulate recovery progress
      const steps = [
        'Clearing cache...',
        'Reinitializing database...',
        'Testing connection...',
        'Verifying search functionality...',
        'Recovery complete!'
      ];

      for (let i = 0; i < steps.length; i++) {
        setRecoveryMessage(steps[i]);
        setRecoveryProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const success = await attemptRecovery();
      
      if (success) {
        setRecoveryMessage('Recovery successful!');
        setRecoveryProgress(100);
      } else {
        setRecoveryMessage('Recovery failed. Please try again or contact support.');
        setRecoveryProgress(0);
      }
    } catch (error) {
      setRecoveryMessage('Recovery failed with error. Please contact support.');
      setRecoveryProgress(0);
    } finally {
      setTimeout(() => {
        setIsAttemptingRecovery(false);
        setRecoveryProgress(0);
        setRecoveryMessage('');
      }, 2000);
    }
  };

  const getErrorTypeIcon = () => {
    switch (errorRecoveryState.errorType) {
      case 'TIMEOUT':
        return <Clock className="h-4 w-4" />;
      case 'CONNECTION':
        return <XCircle className="h-4 w-4" />;
      case 'MEMORY':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorTypeColor = () => {
    switch (errorRecoveryState.errorType) {
      case 'TIMEOUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONNECTION':
        return 'bg-red-100 text-red-800';
      case 'MEMORY':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!errorRecoveryState.hasError && healthStatus.isHealthy) {
    return (
      <Card className={`search-error-recovery ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Search system is healthy</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`search-error-recovery ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Search System Issue Detected</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Type */}
        {errorRecoveryState.errorType && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getErrorTypeColor()}>
              <div className="flex items-center space-x-1">
                {getErrorTypeIcon()}
                <span>{errorRecoveryState.errorType}</span>
              </div>
            </Badge>
          </div>
        )}

        {/* Health Status */}
        {!healthStatus.isHealthy && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{healthStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Recovery Progress */}
        {isAttemptingRecovery && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Attempting Recovery</span>
            </div>
            <Progress value={recoveryProgress} className="w-full" />
            {recoveryMessage && (
              <p className="text-xs text-gray-600">{recoveryMessage}</p>
            )}
          </div>
        )}

        {/* Recovery Actions */}
        {errorRecoveryState.canRecover && !isAttemptingRecovery && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Available Recovery Actions</span>
            </h4>
            
            <ul className="text-sm space-y-1 text-gray-600">
              {errorRecoveryState.recoveryActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleRecoveryAttempt}
              disabled={isAttemptingRecovery || errorRecoveryState.isRecovering}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Attempt Auto-Recovery
            </Button>
          </div>
        )}

        {/* Manual Recovery Instructions */}
        {!errorRecoveryState.canRecover && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Automatic recovery is not available. Manual intervention may be required.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm space-y-2">
              <p className="font-medium">Manual Recovery Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Refresh the page to restart the search system</li>
                <li>Clear your browser cache and cookies</li>
                <li>Check your internet connection</li>
                <li>Contact system administrator if issues persist</li>
              </ol>
            </div>
          </div>
        )}

        {/* Last Check Time */}
        <div className="text-xs text-gray-500 border-t pt-2">
          Last checked: {healthStatus.lastCheck.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchErrorRecovery;