// System Status Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Search, 
  HardDrive,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';

interface SystemStatusProps {
  searchManager: EnhancedSearchManager | null;
}

interface StatusCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  details?: string;
  lastChecked: Date;
}

interface SystemMetrics {
  databaseSize: string;
  totalRecords: number;
  searchIndexSize: string;
  averageQueryTime: number;
  uptime: string;
  memoryUsage: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  searchManager
}) => {
  const [statusChecks, setStatusChecks] = useState<StatusCheck[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize status checks
  useEffect(() => {
    performStatusChecks();
    loadSystemMetrics();
  }, [searchManager]);

  // Perform system status checks
  const performStatusChecks = async () => {
    setIsRefreshing(true);
    
    const checks: StatusCheck[] = [
      {
        name: 'Database Connection',
        status: 'checking',
        message: 'Checking database connectivity...',
        lastChecked: new Date()
      },
      {
        name: 'Search Index',
        status: 'checking',
        message: 'Verifying search index integrity...',
        lastChecked: new Date()
      },
      {
        name: 'FTS5 Extension',
        status: 'checking',
        message: 'Checking FTS5 extension availability...',
        lastChecked: new Date()
      },
      {
        name: 'Data Integrity',
        status: 'checking',
        message: 'Validating data consistency...',
        lastChecked: new Date()
      }
    ];

    setStatusChecks(checks);

    // Simulate status checks with delays
    setTimeout(() => {
      setStatusChecks(prev => prev.map(check => {
        if (check.name === 'Database Connection') {
          return {
            ...check,
            status: searchManager ? 'healthy' : 'error',
            message: searchManager ? 'Database connection active' : 'Database connection failed',
            details: searchManager ? 'Connected to SQLite database' : 'Unable to establish database connection'
          };
        }
        return check;
      }));
    }, 500);

    setTimeout(() => {
      setStatusChecks(prev => prev.map(check => {
        if (check.name === 'Search Index') {
          return {
            ...check,
            status: 'healthy',
            message: 'Search index operational',
            details: 'FTS5 indexes are built and accessible'
          };
        }
        return check;
      }));
    }, 1000);

    setTimeout(() => {
      setStatusChecks(prev => prev.map(check => {
        if (check.name === 'FTS5 Extension') {
          return {
            ...check,
            status: 'healthy',
            message: 'FTS5 extension loaded',
            details: 'Full-text search capabilities available'
          };
        }
        return check;
      }));
    }, 1500);

    setTimeout(() => {
      setStatusChecks(prev => prev.map(check => {
        if (check.name === 'Data Integrity') {
          return {
            ...check,
            status: 'warning',
            message: 'Minor data inconsistencies detected',
            details: '3 records have missing metadata fields'
          };
        }
        return check;
      }));
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }, 2000);
  };

  // Load system metrics
  const loadSystemMetrics = () => {
    // Mock system metrics
    const metrics: SystemMetrics = {
      databaseSize: '47.3 MB',
      totalRecords: 5420,
      searchIndexSize: '12.8 MB',
      averageQueryTime: 23.5,
      uptime: '7 days, 14 hours',
      memoryUsage: '156 MB'
    };
    setSystemMetrics(metrics);
  };

  // Get status icon
  const getStatusIcon = (status: StatusCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: StatusCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  // Get overall system status
  const getOverallStatus = () => {
    if (statusChecks.some(check => check.status === 'checking')) return 'checking';
    if (statusChecks.some(check => check.status === 'error')) return 'error';
    if (statusChecks.some(check => check.status === 'warning')) return 'warning';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="system-status space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
              {getStatusBadge(overallStatus)}
              <Button
                variant="outline"
                size="sm"
                onClick={performStatusChecks}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Last checked: {lastRefresh.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Status Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statusChecks.map((check, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                {getStatusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{check.name}</h4>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {check.message}
                  </p>
                  {check.details && (
                    <p className="text-xs text-muted-foreground">
                      {check.details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {check.lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>System Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.databaseSize}</p>
                <p className="text-sm text-muted-foreground">Database Size</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <HardDrive className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Search className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.searchIndexSize}</p>
                <p className="text-sm text-muted-foreground">Index Size</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.averageQueryTime}ms</p>
                <p className="text-sm text-muted-foreground">Avg Query Time</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.uptime.split(',')[0]}</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold">{systemMetrics.memoryUsage}</p>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      <div className="space-y-3">
        {statusChecks.filter(check => check.status === 'warning' || check.status === 'error').map((check, index) => (
          <Alert key={index} variant={check.status === 'error' ? 'destructive' : 'default'}>
            {check.status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <strong>{check.name}:</strong> {check.message}
              {check.details && <div className="mt-1 text-sm">{check.details}</div>}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;