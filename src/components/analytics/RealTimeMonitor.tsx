// Real-Time Analytics Monitor Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Search, MousePointer, Clock, TrendingUp } from 'lucide-react';
import { getAnalyticsEngine } from '@/lib/analytics/analytics-engine';

export interface RealTimeMonitorProps {
  updateInterval?: number;
  className?: string;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  updateInterval = 1000,
  className = ''
}) => {
  const [analytics] = useState(() => getAnalyticsEngine());
  const [sessionStats, setSessionStats] = useState(analytics.getCurrentSessionStats());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSessionStats(analytics.getCurrentSessionStats());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [analytics, updateInterval, isActive]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <Card className={`real-time-monitor ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-500" />
            Current Session
          </CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Live' : 'Paused'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <div className="text-xl font-bold">
              {formatDuration(sessionStats.duration)}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Searches</span>
            </div>
            <div className="text-xl font-bold">{sessionStats.searchCount}</div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
            <div className="text-xl font-bold">{sessionStats.clickCount}</div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">CTR</span>
            </div>
            <div className="text-xl font-bold">
              {sessionStats.clickThroughRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Session ID: <code className="text-xs">{sessionStats.sessionId}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
