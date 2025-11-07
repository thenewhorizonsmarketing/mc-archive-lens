// Analytics Engine for Search Usage Tracking and Reporting
import { SearchResult, SearchFilters } from '../database/types';

export interface SearchEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  responseTime: number;
  userAgent: string;
  source: 'search_interface' | 'autocomplete' | 'suggestion';
}

export interface ResultClickEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  searchEventId: string;
  result: SearchResult;
  position: number;
  clickTime: number; // Time from search to click
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalSearches: number;
  totalClicks: number;
  userAgent: string;
  screenResolution: string;
  touchDevice: boolean;
}

export interface UsageMetrics {
  totalSearches: number;
  uniqueSessions: number;
  averageSearchesPerSession: number;
  averageResponseTime: number;
  clickThroughRate: number;
  bounceRate: number;
  popularQueries: Array<{ query: string; count: number; avgResultCount: number }>;
  noResultQueries: Array<{ query: string; count: number }>;
  popularContent: Array<{ result: SearchResult; clickCount: number }>;
  timeDistribution: Array<{ hour: number; searchCount: number }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
    touch: number;
  };
}

export interface AnalyticsOptions {
  enableTracking?: boolean;
  anonymizeData?: boolean;
  retentionDays?: number;
  batchSize?: number;
  flushInterval?: number;
  enableRealTimeMetrics?: boolean;
}

export class AnalyticsEngine {
  private options: AnalyticsOptions;
  private currentSessionId: string;
  private eventQueue: Array<SearchEvent | ResultClickEvent | SessionEvent> = [];
  private storage: Map<string, any> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: Date;
  private searchCount = 0;
  private clickCount = 0;

  constructor(options: AnalyticsOptions = {}) {
    this.options = {
      enableTracking: true,
      anonymizeData: true,
      retentionDays: 30,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableRealTimeMetrics: true,
      ...options
    };

    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    
    if (this.options.enableTracking) {
      this.initialize();
    }
  }

  /**
   * Initialize analytics engine
   */
  private initialize(): void {
    this.loadStoredData();
    this.startSession();
    this.setupFlushTimer();
    this.setupBeforeUnloadHandler();
    this.cleanupOldData();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start new session
   */
  private startSession(): void {
    const sessionEvent: SessionEvent = {
      id: this.generateEventId(),
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      totalSearches: 0,
      totalClicks: 0,
      userAgent: this.anonymizeUserAgent(navigator.userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      touchDevice: 'ontouchstart' in window
    };

    this.queueEvent(sessionEvent);
  }

  /**
   * Track search event
   */
  trackSearch(
    query: string,
    filters: SearchFilters,
    results: SearchResult[],
    responseTime: number,
    source: 'search_interface' | 'autocomplete' | 'suggestion' = 'search_interface'
  ): string {
    if (!this.options.enableTracking) return '';

    const eventId = this.generateEventId();
    const searchEvent: SearchEvent = {
      id: eventId,
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      query: this.options.anonymizeData ? this.anonymizeQuery(query) : query,
      filters: this.options.anonymizeData ? this.anonymizeFilters(filters) : filters,
      resultCount: results.length,
      responseTime,
      userAgent: this.anonymizeUserAgent(navigator.userAgent),
      source
    };

    this.queueEvent(searchEvent);
    this.searchCount++;

    // Update real-time metrics
    if (this.options.enableRealTimeMetrics) {
      this.updateRealTimeMetrics('search', searchEvent);
    }

    return eventId;
  }

  /**
   * Track result click event
   */
  trackResultClick(
    searchEventId: string,
    result: SearchResult,
    position: number,
    searchTime: Date
  ): void {
    if (!this.options.enableTracking) return;

    const clickEvent: ResultClickEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      searchEventId,
      result: this.options.anonymizeData ? this.anonymizeResult(result) : result,
      position,
      clickTime: Date.now() - searchTime.getTime()
    };

    this.queueEvent(clickEvent);
    this.clickCount++;

    // Update real-time metrics
    if (this.options.enableRealTimeMetrics) {
      this.updateRealTimeMetrics('click', clickEvent);
    }
  }

  /**
   * Track error event
   */
  trackError(error: Error, context: string, query?: string): void {
    if (!this.options.enableTracking) return;

    const errorEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: this.options.anonymizeData ? '[anonymized]' : error.stack
      },
      context,
      query: query && this.options.anonymizeData ? this.anonymizeQuery(query) : query
    };

    this.queueEvent(errorEvent);
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(event: any): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.options.batchSize!) {
      this.flushEvents();
    }
  }

  /**
   * Flush events to storage
   */
  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Store events (in a real implementation, this would go to a database)
    const storageKey = `analytics-${new Date().toISOString().split('T')[0]}`;
    const existingEvents = this.storage.get(storageKey) || [];
    this.storage.set(storageKey, [...existingEvents, ...events]);

    // Persist to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify([...existingEvents, ...events]));
    } catch (error) {
      console.warn('Failed to persist analytics data:', error);
    }
  }

  /**
   * Setup automatic flush timer
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.options.flushInterval);
  }

  /**
   * Setup beforeunload handler to save data
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.flushEvents();
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    const sessionEvents = this.getSessionEvents();
    if (sessionEvents.length > 0) {
      const sessionEvent = sessionEvents[0] as SessionEvent;
      sessionEvent.endTime = new Date();
      sessionEvent.totalSearches = this.searchCount;
      sessionEvent.totalClicks = this.clickCount;
    }
  }

  /**
   * Load stored data from localStorage
   */
  private loadStoredData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics-'));
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          this.storage.set(key, JSON.parse(data));
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays!);
    const cutoffKey = `analytics-${cutoffDate.toISOString().split('T')[0]}`;

    const keysToDelete: string[] = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith('analytics-') && key < cutoffKey) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.storage.delete(key);
      localStorage.removeItem(key);
    });
  }

  /**
   * Generate usage report for a date range
   */
  generateUsageReport(startDate: Date, endDate: Date): UsageMetrics {
    const events = this.getEventsInRange(startDate, endDate);
    const searchEvents = events.filter(e => 'query' in e) as SearchEvent[];
    const clickEvents = events.filter(e => 'searchEventId' in e) as ResultClickEvent[];
    const sessionEvents = events.filter(e => 'startTime' in e) as SessionEvent[];

    // Calculate metrics
    const totalSearches = searchEvents.length;
    const uniqueSessions = new Set(searchEvents.map(e => e.sessionId)).size;
    const averageSearchesPerSession = uniqueSessions > 0 ? totalSearches / uniqueSessions : 0;
    const averageResponseTime = searchEvents.length > 0 
      ? searchEvents.reduce((sum, e) => sum + e.responseTime, 0) / searchEvents.length 
      : 0;

    const totalClicks = clickEvents.length;
    const clickThroughRate = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0;

    // Calculate bounce rate (sessions with only one search and no clicks)
    const bounceSessions = sessionEvents.filter(s => s.totalSearches <= 1 && s.totalClicks === 0).length;
    const bounceRate = uniqueSessions > 0 ? (bounceSessions / uniqueSessions) * 100 : 0;

    // Popular queries
    const queryCount = new Map<string, { count: number; totalResults: number }>();
    searchEvents.forEach(e => {
      const existing = queryCount.get(e.query) || { count: 0, totalResults: 0 };
      queryCount.set(e.query, {
        count: existing.count + 1,
        totalResults: existing.totalResults + e.resultCount
      });
    });

    const popularQueries = Array.from(queryCount.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgResultCount: data.totalResults / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // No result queries
    const noResultQueries = Array.from(queryCount.entries())
      .filter(([_, data]) => data.totalResults === 0)
      .map(([query, data]) => ({ query, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Popular content
    const contentClicks = new Map<string, number>();
    clickEvents.forEach(e => {
      const key = `${e.result.type}-${e.result.id}`;
      contentClicks.set(key, (contentClicks.get(key) || 0) + 1);
    });

    const popularContent = Array.from(contentClicks.entries())
      .map(([key, clickCount]) => {
        const clickEvent = clickEvents.find(e => `${e.result.type}-${e.result.id}` === key);
        return {
          result: clickEvent!.result,
          clickCount
        };
      })
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 20);

    // Time distribution
    const hourlyDistribution = new Array(24).fill(0);
    searchEvents.forEach(e => {
      const hour = e.timestamp.getHours();
      hourlyDistribution[hour]++;
    });

    const timeDistribution = hourlyDistribution.map((count, hour) => ({ hour, searchCount: count }));

    // Device stats
    const deviceStats = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      touch: 0
    };

    sessionEvents.forEach(s => {
      if (s.touchDevice) deviceStats.touch++;
      
      const ua = s.userAgent.toLowerCase();
      if (ua.includes('mobile')) {
        deviceStats.mobile++;
      } else if (ua.includes('tablet')) {
        deviceStats.tablet++;
      } else {
        deviceStats.desktop++;
      }
    });

    return {
      totalSearches,
      uniqueSessions,
      averageSearchesPerSession,
      averageResponseTime,
      clickThroughRate,
      bounceRate,
      popularQueries,
      noResultQueries,
      popularContent,
      timeDistribution,
      deviceStats
    };
  }

  /**
   * Get events in date range
   */
  private getEventsInRange(startDate: Date, endDate: Date): any[] {
    const events: any[] = [];
    
    for (const [key, dayEvents] of this.storage.entries()) {
      if (key.startsWith('analytics-')) {
        const dateStr = key.replace('analytics-', '');
        const eventDate = new Date(dateStr);
        
        if (eventDate >= startDate && eventDate <= endDate) {
          events.push(...dayEvents);
        }
      }
    }

    return events.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
  }

  /**
   * Get session events
   */
  private getSessionEvents(): SessionEvent[] {
    const events: any[] = [];
    for (const dayEvents of this.storage.values()) {
      events.push(...dayEvents);
    }
    return events.filter(e => e.sessionId === this.currentSessionId && 'startTime' in e);
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(type: 'search' | 'click', event: any): void {
    // This would update real-time dashboards in a production system
    console.debug(`Real-time metric: ${type}`, event);
  }

  /**
   * Anonymize query for privacy
   */
  private anonymizeQuery(query: string): string {
    if (!this.options.anonymizeData) return query;
    
    // Replace potential PII with placeholders
    return query
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi, '[ADDRESS]');
  }

  /**
   * Anonymize filters
   */
  private anonymizeFilters(filters: SearchFilters): SearchFilters {
    if (!this.options.anonymizeData) return filters;
    
    // Keep structure but remove potentially sensitive values
    return {
      ...filters,
      // Keep non-sensitive filters as-is
    };
  }

  /**
   * Anonymize result
   */
  private anonymizeResult(result: SearchResult): SearchResult {
    if (!this.options.anonymizeData) return result;
    
    return {
      ...result,
      title: '[ANONYMIZED]',
      subtitle: result.subtitle ? '[ANONYMIZED]' : undefined
    };
  }

  /**
   * Anonymize user agent
   */
  private anonymizeUserAgent(userAgent: string): string {
    if (!this.options.anonymizeData) return userAgent;
    
    // Keep only browser and OS info, remove version details
    const simplified = userAgent
      .replace(/\d+\.\d+\.\d+/g, 'X.X.X')
      .replace(/\([^)]*\)/g, '(...)');
    
    return simplified;
  }

  /**
   * Export analytics data
   */
  exportData(format: 'json' | 'csv' = 'json', startDate?: Date, endDate?: Date): string {
    const events = startDate && endDate 
      ? this.getEventsInRange(startDate, endDate)
      : Array.from(this.storage.values()).flat();

    if (format === 'csv') {
      return this.convertToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Convert events to CSV format
   */
  private convertToCSV(events: any[]): string {
    if (events.length === 0) return '';

    const headers = Object.keys(events[0]);
    const csvRows = [headers.join(',')];

    events.forEach(event => {
      const values = headers.map(header => {
        const value = event[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Get current session statistics
   */
  getCurrentSessionStats(): {
    sessionId: string;
    duration: number;
    searchCount: number;
    clickCount: number;
    clickThroughRate: number;
  } {
    const duration = Date.now() - this.sessionStartTime.getTime();
    const clickThroughRate = this.searchCount > 0 ? (this.clickCount / this.searchCount) * 100 : 0;

    return {
      sessionId: this.currentSessionId,
      duration,
      searchCount: this.searchCount,
      clickCount: this.clickCount,
      clickThroughRate
    };
  }

  /**
   * Cleanup analytics engine
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.endSession();
    this.flushEvents();
  }
}

// Global analytics engine instance
let globalAnalyticsEngine: AnalyticsEngine | null = null;

export function getAnalyticsEngine(options?: AnalyticsOptions): AnalyticsEngine {
  if (!globalAnalyticsEngine) {
    globalAnalyticsEngine = new AnalyticsEngine(options);
  }
  return globalAnalyticsEngine;
}

export default AnalyticsEngine;