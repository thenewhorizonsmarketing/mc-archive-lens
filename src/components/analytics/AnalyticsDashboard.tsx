// Analytics Dashboard Component for Search Usage Tracking
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Search, 
  MousePointer, 
  Users, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { getAnalyticsEngine, UsageMetrics } from '@/lib/analytics/analytics-engine';

export interface AnalyticsDashboardProps {
  dateRange?: { start: Date; end: Date };
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dateRange,
  autoRefresh = false,
  refreshInterval = 60000,
  className = ''
}) => {
  const [analytics] = useState(() => getAnalyticsEngine());
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Calculate date range
  const effectiveDateRange = useMemo(() => {
    if (dateRange) return dateRange;
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days by default
    
    return { start, end };
  }, [dateRange]);

  // Load metrics
  const loadMetrics = React.useCallback(() => {
    setIsLoading(true);
    try {
      const report = analytics.generateUsageReport(
        effectiveDateRange.start,
        effectiveDateRange.end
      );
      setMetrics(report);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analytics, effectiveDateRange]);

  // Initial load
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMetrics]);

  // Export data
  const handleExport = (format: 'json' | 'csv') => {
    const data = analytics.exportData(
      format,
      effectiveDateRange.start,
      effectiveDateRange.end
    );
    
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !metrics) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-lg font-medium">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Search Analytics</h2>
          <p className="text-muted-foreground">
            {effectiveDateRange.start.toLocaleDateString()} - {effectiveDateRange.end.toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Search className="h-4 w-4 mr-2 text-blue-500" />
              Total Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.averageSearchesPerSession.toFixed(1)} per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-500" />
              Unique Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.uniqueSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MousePointer className="h-4 w-4 mr-2 text-purple-500" />
              Click-Through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.clickThroughRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Result engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(metrics.averageResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Search performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="queries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queries">
            <Search className="h-4 w-4 mr-2" />
            Search Queries
          </TabsTrigger>
          <TabsTrigger value="content">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular Content
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <BarChart3 className="h-4 w-4 mr-2" />
            Usage Patterns
          </TabsTrigger>
          <TabsTrigger value="devices">
            <PieChart className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
        </TabsList>

        {/* Popular Queries Tab */}
        <TabsContent value="queries" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Popular Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Search Queries</CardTitle>
                <CardDescription>Most frequently searched terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.popularQueries.slice(0, 10).map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{query.query}</p>
                          <p className="text-xs text-muted-foreground">
                            {query.avgResultCount.toFixed(0)} avg results
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{query.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* No Results Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                  No Results Queries
                </CardTitle>
                <CardDescription>Searches that returned no results</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.noResultQueries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    All searches returned results!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {metrics.noResultQueries.map((query, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <p className="font-medium truncate flex-1">{query.query}</p>
                        </div>
                        <Badge variant="destructive">{query.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Popular Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Most Clicked Content</CardTitle>
              <CardDescription>Content that users engage with most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.popularContent.slice(0, 15).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{item.result.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.result.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Score: {item.result.relevanceScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{item.clickCount}</div>
                      <div className="text-xs text-muted-foreground">clicks</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Search Activity by Hour</CardTitle>
              <CardDescription>When users search most frequently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.timeDistribution.map((hour) => {
                  const maxCount = Math.max(...metrics.timeDistribution.map(h => h.searchCount));
                  const percentage = maxCount > 0 ? (hour.searchCount / maxCount) * 100 : 0;
                  
                  return (
                    <div key={hour.hour} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-muted-foreground">
                        {hour.hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-sm font-medium">
                            {hour.searchCount} searches
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>How users access the search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Desktop</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.deviceStats.desktop} sessions
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ 
                          width: `${(metrics.deviceStats.desktop / metrics.uniqueSessions) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mobile</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.deviceStats.mobile} sessions
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ 
                          width: `${(metrics.deviceStats.mobile / metrics.uniqueSessions) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tablet</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.deviceStats.tablet} sessions
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ 
                          width: `${(metrics.deviceStats.tablet / metrics.uniqueSessions) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Touch Devices</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.deviceStats.touch} sessions
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all"
                        style={{ 
                          width: `${(metrics.deviceStats.touch / metrics.uniqueSessions) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>User behavior statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{metrics.bounceRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sessions with no engagement
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Searches per Session</span>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {metrics.averageSearchesPerSession.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average search activity
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Click-Through Rate</span>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{metrics.clickThroughRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users clicking on results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
