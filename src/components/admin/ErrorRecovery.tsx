// Error Recovery Component for Admin Panel
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Database, 
  Search,
  Wrench,
  FileText,
  Download
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';

interface ErrorRecoveryProps {
  searchManager: EnhancedSearchManager | null;
}

interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  isRunning: boolean;
  isCompleted: boolean;
  error?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  searchManager
}) => {
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [isRunningRecovery, setIsRunningRecovery] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize recovery actions
  useEffect(() => {
    try {
      const actions: RecoveryAction[] = [
        {
          id: 'rebuild-indexes',
          name: 'Rebuild Search Indexes',
          description: 'Rebuild all FTS5 search indexes to fix corruption issues',
          icon: <Database className="h-4 w-4" />,
          action: async () => {
            if (searchManager && typeof searchManager.rebuildIndexes === 'function') {
              await searchManager.rebuildIndexes();
            } else {
              throw new Error('Search manager not available or method not found');
            }
          },
          isRunning: false,
          isCompleted: false
        },
        {
          id: 'test-connection',
          name: 'Test Database Connection',
          description: 'Verify database connectivity and basic operations',
          icon: <Search className="h-4 w-4" />,
          action: async () => {
            if (searchManager && typeof searchManager.searchAll === 'function') {
              await searchManager.searchAll('test', {}, { limit: 1 });
            } else {
              throw new Error('Search manager not available or method not found');
            }
          },
          isRunning: false,
          isCompleted: false
        },
        {
          id: 'clear-cache',
          name: 'Clear Search Cache',
          description: 'Clear all cached search results and force fresh queries',
          icon: <RefreshCw className="h-4 w-4" />,
          action: async () => {
            // Clear localStorage cache
            localStorage.removeItem('searchCache');
            localStorage.removeItem('recentSearches');
          },
          isRunning: false,
          isCompleted: false
        },
        {
          id: 'validate-data',
          name: 'Validate Data Integrity',
          description: 'Check for data consistency and missing records',
          icon: <CheckCircle className="h-4 w-4" />,
          action: async () => {
            if (searchManager && typeof searchManager.getDatabaseManager === 'function') {
              const dbManager = searchManager.getDatabaseManager();
              // Perform basic data validation queries
              await dbManager.executeQuery('SELECT COUNT(*) FROM alumni');
              await dbManager.executeQuery('SELECT COUNT(*) FROM publications');
              await dbManager.executeQuery('SELECT COUNT(*) FROM photos');
              await dbManager.executeQuery('SELECT COUNT(*) FROM faculty');
            } else {
              throw new Error('Search manager not available or method not found');
            }
          },
          isRunning: false,
          isCompleted: false
        }
      ];

      setRecoveryActions(actions);
      setInitError(null);
    } catch (error) {
      console.error('Failed to initialize recovery actions:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
    }
  }, [searchManager]);

  // Load error logs from localStorage
  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('searchErrors') || '[]');
      setErrorLogs(logs);
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  }, []);

  // Run individual recovery action
  const runRecoveryAction = async (actionId: string) => {
    setRecoveryActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, isRunning: true, error: undefined }
        : action
    ));

    try {
      const action = recoveryActions.find(a => a.id === actionId);
      if (action) {
        await action.action();
        
        setRecoveryActions(prev => prev.map(a => 
          a.id === actionId 
            ? { ...a, isRunning: false, isCompleted: true }
            : a
        ));
      }
    } catch (error) {
      setRecoveryActions(prev => prev.map(a => 
        a.id === actionId 
          ? { 
              ...a, 
              isRunning: false, 
              isCompleted: false, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : a
      ));
    }
  };

  // Run all recovery actions
  const runAllRecoveryActions = async () => {
    setIsRunningRecovery(true);
    setRecoveryProgress(0);

    for (let i = 0; i < recoveryActions.length; i++) {
      const action = recoveryActions[i];
      setRecoveryProgress((i / recoveryActions.length) * 100);
      
      try {
        await runRecoveryAction(action.id);
        // Wait a bit between actions
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Recovery action ${action.id} failed:`, error);
      }
    }

    setRecoveryProgress(100);
    setIsRunningRecovery(false);
  };

  // Reset all actions
  const resetActions = () => {
    setRecoveryActions(prev => prev.map(action => ({
      ...action,
      isRunning: false,
      isCompleted: false,
      error: undefined
    })));
    setRecoveryProgress(0);
  };

  // Download error logs
  const downloadErrorLogs = () => {
    const logsText = JSON.stringify(errorLogs, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_error_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear error logs
  const clearErrorLogs = () => {
    localStorage.removeItem('searchErrors');
    setErrorLogs([]);
  };

  // Get recovery status from search manager
  const getRecoveryStatus = () => {
    try {
      if (searchManager && typeof searchManager.getRecoveryStatus === 'function') {
        return searchManager.getRecoveryStatus();
      }
    } catch (error) {
      console.error('Failed to get recovery status:', error);
    }
    return {
      hasError: false,
      canRecover: false,
      recoveryActions: [],
      isRecovering: false
    };
  };

  const recoveryStatus = getRecoveryStatus();

  // Show initialization error if present
  if (initError) {
    return (
      <div className="error-recovery space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Initialization Error:</strong> {initError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state if search manager is not available
  if (!searchManager) {
    return (
      <div className="error-recovery space-y-6">
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Waiting for search manager to initialize...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="error-recovery space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>System Recovery Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recoveryStatus.hasError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Error Type:</strong> {recoveryStatus.errorType}
                  </p>
                  {recoveryStatus.canRecover && (
                    <p>
                      <strong>Recovery Available:</strong> Yes
                    </p>
                  )}
                  {recoveryStatus.recoveryActions.length > 0 && (
                    <div>
                      <strong>Suggested Actions:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {recoveryStatus.recoveryActions.map((action, index) => (
                          <li key={index} className="text-sm">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Search system is operating normally. No errors detected.
              </AlertDescription>
            </Alert>
          )}

          {recoveryStatus.isRecovering && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                System is currently attempting automatic recovery...
              </p>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Recovery in progress</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Recovery Actions</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetActions}
                disabled={isRunningRecovery}
              >
                Reset
              </Button>
              <Button
                onClick={runAllRecoveryActions}
                disabled={isRunningRecovery || !searchManager}
              >
                {isRunningRecovery ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Run All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRunningRecovery && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(recoveryProgress)}%</span>
              </div>
              <Progress value={recoveryProgress} />
            </div>
          )}

          <div className="space-y-3">
            {recoveryActions.map((action) => (
              <Card key={action.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      {action.icon}
                      <div>
                        <h4 className="font-medium">{action.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                        {action.error && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {action.error}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {action.isCompleted && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      
                      {action.error && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runRecoveryAction(action.id)}
                        disabled={action.isRunning || isRunningRecovery || !searchManager}
                      >
                        {action.isRunning ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Run'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Error Logs</span>
              <Badge variant="secondary">{errorLogs.length}</Badge>
            </CardTitle>
            <div className="flex space-x-2">
              {errorLogs.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorLogs}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearErrorLogs}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errorLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No error logs found
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errorLogs.slice(-10).reverse().map((log, index) => (
                <Card key={index} className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-red-800">{log.message}</h4>
                        <Badge variant="outline" className="text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </Badge>
                      </div>
                      {log.stack && (
                        <pre className="text-xs text-red-700 bg-white p-2 rounded border overflow-x-auto">
                          {log.stack.split('\n').slice(0, 3).join('\n')}
                        </pre>
                      )}
                      <div className="text-xs text-red-600">
                        <p>URL: {log.url}</p>
                        <p>User Agent: {log.userAgent?.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorRecovery;