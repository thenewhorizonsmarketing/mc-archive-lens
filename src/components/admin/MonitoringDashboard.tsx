// Comprehensive Monitoring Dashboard for System Health and Performance
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Shield, 
  Zap, 
  TrendingUp,
  RefreshCw,
  Download,
  Settings,
  Eye,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface SystemMetrics {
  performance: {
    averageQueryTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    activeQueries: number;
    slowQueries: number;
  };
  security: {
    totalViolations: number;
    blockedIPs: number;
    recentThreats: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  database: {
    size: number;
    recordCount: number;
    indexHealth: 'good' | 'warning' | 'critical';
    lastBackup: Date | null;
  };
  analytics: {
    totalSearches: number;
    uniqueSessions: number;
    errorRate: number;
    popularQueries: Array<{ query: string; count: number }>;
  };
  system: {
    uptime: number;
    cpuUsage: number;
    diskSpace: number;
    networkLatency: number;
  };
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface MonitoringDashboardProps {
  searchManager?: any;
  refreshInterval?: number;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  searchManager,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch system metrics
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);

      // Simulate fetching metrics from various systems
      // In a real implementation, these would come from actual monitoring services
      const mockMetrics: SystemMetrics = {
        performance: {
          averageQueryTime: Math.random() * 100 + 20,
          cacheHitRate: Math.random() * 40 + 60,
          memoryUsage: Math.random() * 30 + 40,
          activeQueries: Math.floor(Math.random() * 10),
          slowQueries: Math.floor(Math.random() * 5)
        },
        security: {
          totalViolations: Math.floor(Math.random() * 50),
          blockedIPs: Math.floor(Math.random() * 10),
          recentThreats: Math.floor(Math.random() * 3),
          riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
        },
        database: {
          size: Math.random() * 100 + 50, // MB
          recordCount: Math.floor(Math.random() * 10000 + 5000),
          indexHealth: Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'warning' : 'good',
          lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        },
        analytics: {
          totalSearches: Math.floor(Math.random() * 1000 + 500),
          uniqueSessions: Math.floor(Math.random() * 200 + 100),
          errorRate: Math.random() * 5,
          popularQueries: [
            { query: 'graduation', count: Math.floor(Math.random() * 100 + 50) },
            { query: 'faculty', count: Math.floor(Math.random() * 80 + 30) },
            { query: 'law review', count: Math.floor(Math.random() * 60 + 20) }
          ]
        },
        system: {
          uptime: Math.random() * 30 + 1, // days
          cpuUsage: Math.random() * 50 + 10,
          diskSpace: Math.random() * 30 + 70,
          networkLatency: Math.random() * 50 + 10
        }
      };

      setMetrics(mockMetrics);
      setLastUpdate(new Date());

      // Generate alerts based on metrics
      generateAlerts(mockMetrics);

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate alerts based on current metrics
   */
  const generateAlerts = (currentMetrics: SystemMetrics) => {
    const newAlerts: Alert[] = [];

    // Performance alerts
    if (currentMetrics.performance.averageQueryTime > 100) {
      newAlerts.push({
        id: `perf-${Date.now()}`,
        type: 'warning',
        title: 'Slow Query Performance',
        message: `Average query time is ${currentMetrics.performance.averageQueryTime.toFixed(1)}ms`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Security alerts
    if (currentMetrics.security.riskLevel === 'high') {
      newAlerts.push({
        id: `sec-${Date.now()}`,
        type: 'error',
        title: 'High Security Risk',
        message: `${currentMetrics.security.recentThreats} recent threats detected`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Database alerts
    if (currentMetrics.database.indexHealth === 'critical') {
      newAlerts.push({
        id: `db-${Date.now()}`,
        type: 'critical',
        title: 'Database Index Issues',
        message: 'Critical database index problems detected',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // System alerts
    if (currentMetrics.system.diskSpace < 20) {
      newAlerts.push({
        id: `sys-${Date.now()}`,
        type: 'warning',
        title: 'Low Disk Space',
        message: `Only ${currentMetrics.system.diskSpace.toFixed(1)}% disk space remaining`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    setAlerts(prev => [...newAlerts, ...prev.slice(0, 10)]); // Keep last 10 alerts
  };

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  /**
   * Get status color based on value and thresholds
   */
  const getStatusColor = (value: number, good: number, warning: number): string => {
    if (value <= good) return 'text-green-600';
    if (value <= warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get status badge variant
   */
  const getStatusBadge = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'good': case 'low': return 'default';
      case 'warning': case 'medium': return 'secondary';
      case 'critical': case 'high': return 'destructive';
      default: return 'default';
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh, refreshInterval]);

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system metrics...</span>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Active Alerts ({alerts.filter(a => !a.acknowledged).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.filter(a => !a.acknowledged).slice(0, 5).map(alert => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-l-red-500' :
                alert.type === 'error' ? 'border-l-red-400' :
                alert.type === 'warning' ? 'border-l-yellow-400' :
                'border-l-blue-400'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <div className="flex-1">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{alert.title}</strong>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.performance.averageQueryTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
            <Progress 
              value={Math.min(100, (metrics?.performance.averageQueryTime || 0) / 2)} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.performance.cacheHitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cache efficiency
            </p>
            <Progress 
              value={metrics?.performance.cacheHitRate || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={getStatusBadge(metrics?.security.riskLevel || 'low')}>
                {metrics?.security.riskLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.security.totalViolations} total violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CheckCircle className="h-6 w-6 text-green-500 inline" />
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {metrics?.system.uptime.toFixed(1)} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Query Time</span>
                  <span className={getStatusColor(metrics?.performance.averageQueryTime || 0, 50, 100)}>
                    {metrics?.performance.averageQueryTime.toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Queries</span>
                  <span>{metrics?.performance.activeQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slow Queries</span>
                  <span className={getStatusColor(metrics?.performance.slowQueries || 0, 0, 2)}>
                    {metrics?.performance.slowQueries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Rate</span>
                  <span className={getStatusColor(100 - (metrics?.performance.cacheHitRate || 0), 20, 40)}>
                    {metrics?.performance.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Usage</span>
                    <span>{metrics?.performance.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics?.performance.memoryUsage || 0} />
                  <p className="text-xs text-muted-foreground">
                    Memory usage should stay below 80%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Risk Level</span>
                  <Badge variant={getStatusBadge(metrics?.security.riskLevel || 'low')}>
                    {metrics?.security.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Violations</span>
                  <span>{metrics?.security.totalViolations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blocked IPs</span>
                  <span>{metrics?.security.blockedIPs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Threats</span>
                  <span className={getStatusColor(metrics?.security.recentThreats || 0, 0, 2)}>
                    {metrics?.security.recentThreats}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  View Security Log
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Security Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Database Size</span>
                  <span>{metrics?.database.size.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Record Count</span>
                  <span>{metrics?.database.recordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Index Health</span>
                  <Badge variant={getStatusBadge(metrics?.database.indexHealth || 'good')}>
                    {metrics?.database.indexHealth.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup</span>
                  <span className="text-sm">
                    {metrics?.database.lastBackup?.toLocaleDateString() || 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rebuild Indexes
                </Button>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Database Statistics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Searches</span>
                  <span>{metrics?.analytics.totalSearches.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unique Sessions</span>
                  <span>{metrics?.analytics.uniqueSessions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className={getStatusColor(metrics?.analytics.errorRate || 0, 1, 5)}>
                    {metrics?.analytics.errorRate.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.analytics.popularQueries.map((query, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="truncate">{query.query}</span>
                      <span className="text-sm text-muted-foreground">{query.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>CPU Usage</span>
                    <span>{metrics?.system.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics?.system.cpuUsage || 0} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Disk Space</span>
                    <span>{metrics?.system.diskSpace.toFixed(1)}% free</span>
                  </div>
                  <Progress value={metrics?.system.diskSpace || 0} />
                </div>
                <div className="flex justify-between">
                  <span>Network Latency</span>
                  <span>{metrics?.system.networkLatency.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span>{metrics?.system.uptime.toFixed(1)} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View System Logs
                </Button>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Services
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export System Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;