// Performance Validation Component for Admin Panel
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';

interface PerformanceValidatorProps {
  searchManager: EnhancedSearchManager | null;
}

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  target: number; // Target time in ms
  status: 'pending' | 'running' | 'passed' | 'failed';
  actualTime?: number;
  resultCount?: number;
  error?: string;
}

interface PerformanceMetrics {
  averageQueryTime: number;
  minQueryTime: number;
  maxQueryTime: number;
  totalQueries: number;
  passedTests: number;
  failedTests: number;
  overallScore: number;
}

export const PerformanceValidator: React.FC<PerformanceValidatorProps> = ({
  searchManager
}) => {
  const [tests, setTests] = useState<PerformanceTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Initialize performance tests
  const initializeTests = useCallback(() => {
    const performanceTests: PerformanceTest[] = [
      {
        id: 'simple-search',
        name: 'Simple Search Performance',
        description: 'Single term search across all tables',
        target: 50,
        status: 'pending'
      },
      {
        id: 'complex-search',
        name: 'Complex Search Performance',
        description: 'Multi-term search with filters',
        target: 100,
        status: 'pending'
      },
      {
        id: 'large-result-search',
        name: 'Large Result Set Performance',
        description: 'Search returning many results',
        target: 150,
        status: 'pending'
      },
      {
        id: 'concurrent-search',
        name: 'Concurrent Search Performance',
        description: 'Multiple simultaneous searches',
        target: 200,
        status: 'pending'
      },
      {
        id: 'filter-search',
        name: 'Filtered Search Performance',
        description: 'Search with year and type filters',
        target: 75,
        status: 'pending'
      },
      {
        id: 'suggestion-performance',
        name: 'Search Suggestions Performance',
        description: 'Auto-complete suggestions generation',
        target: 25,
        status: 'pending'
      }
    ];

    setTests(performanceTests);
  }, []);

  // Run individual performance test
  const runPerformanceTest = async (test: PerformanceTest): Promise<PerformanceTest> => {
    if (!searchManager) {
      return {
        ...test,
        status: 'failed',
        error: 'Search manager not available'
      };
    }

    try {
      let startTime: number;
      let endTime: number;
      let results: any;

      switch (test.id) {
        case 'simple-search':
          startTime = performance.now();
          results = await searchManager.searchAll('student');
          endTime = performance.now();
          break;

        case 'complex-search':
          startTime = performance.now();
          results = await searchManager.searchAll('law review publication', {
            yearRange: { start: 2020, end: 2024 }
          });
          endTime = performance.now();
          break;

        case 'large-result-search':
          startTime = performance.now();
          results = await searchManager.searchAll('a', {}, { limit: 100 });
          endTime = performance.now();
          break;

        case 'concurrent-search':
          const queries = ['student', 'faculty', 'publication', 'photo', 'law'];
          startTime = performance.now();
          results = await Promise.all(
            queries.map(query => searchManager.searchAll(query))
          );
          endTime = performance.now();
          results = results.flat();
          break;

        case 'filter-search':
          startTime = performance.now();
          results = await searchManager.searchAll('class', {
            yearRange: { start: 1990, end: 2000 },
            publicationType: 'Law Review'
          });
          endTime = performance.now();
          break;

        case 'suggestion-performance':
          startTime = performance.now();
          results = await searchManager.getSearchSuggestions('law', 10);
          endTime = performance.now();
          break;

        default:
          throw new Error(`Unknown test: ${test.id}`);
      }

      const actualTime = endTime - startTime;
      const resultCount = Array.isArray(results) ? results.length : 1;

      return {
        ...test,
        status: actualTime <= test.target ? 'passed' : 'failed',
        actualTime,
        resultCount
      };
    } catch (error) {
      return {
        ...test,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Run all performance tests
  const runAllTests = async () => {
    if (!searchManager) return;

    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    const updatedTests: PerformanceTest[] = [];
    const results: string[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Update test status to running
      setTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));

      // Run the test
      const result = await runPerformanceTest(test);
      updatedTests.push(result);

      // Log result
      const resultMessage = result.status === 'passed' 
        ? `✓ ${result.name}: ${result.actualTime?.toFixed(1)}ms (target: ${result.target}ms)`
        : `✗ ${result.name}: ${result.actualTime?.toFixed(1) || 'N/A'}ms (target: ${result.target}ms) - ${result.error || 'Failed'}`;
      
      results.push(resultMessage);
      setTestResults(prev => [...prev, resultMessage]);

      // Update progress
      setProgress(((i + 1) / tests.length) * 100);

      // Update test status
      setTests(prev => prev.map(t => 
        t.id === test.id ? result : t
      ));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate overall metrics
    const validTests = updatedTests.filter(t => t.actualTime !== undefined);
    const queryTimes = validTests.map(t => t.actualTime!);
    
    const overallMetrics: PerformanceMetrics = {
      averageQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      minQueryTime: Math.min(...queryTimes),
      maxQueryTime: Math.max(...queryTimes),
      totalQueries: validTests.length,
      passedTests: updatedTests.filter(t => t.status === 'passed').length,
      failedTests: updatedTests.filter(t => t.status === 'failed').length,
      overallScore: (updatedTests.filter(t => t.status === 'passed').length / updatedTests.length) * 100
    };

    setMetrics(overallMetrics);
    setIsRunning(false);
  };

  // Reset all tests
  const resetTests = () => {
    initializeTests();
    setMetrics(null);
    setTestResults([]);
    setProgress(0);
  };

  // Initialize tests on component mount
  React.useEffect(() => {
    initializeTests();
  }, [initializeTests]);

  // Get status badge for test
  const getStatusBadge = (test: PerformanceTest) => {
    switch (test.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'running':
        return <Badge variant="default"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'passed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  // Get performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="performance-validator space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Validation</h2>
          <p className="text-muted-foreground">
            Test search system performance against target benchmarks
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={resetTests}
            disabled={isRunning}
          >
            Reset
          </Button>
          <Button
            onClick={runAllTests}
            disabled={isRunning || !searchManager}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running Performance Tests...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{metrics.averageQueryTime.toFixed(1)}ms</p>
                <p className="text-sm text-muted-foreground">Average Query Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{metrics.passedTests}/{metrics.totalQueries}</p>
                <p className="text-sm text-muted-foreground">Tests Passed</p>
              </div>
              <div className="text-3xl font-bold text-center">
                <p className={getScoreColor(metrics.overallScore)}>
                  {metrics.overallScore.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{metrics.maxQueryTime.toFixed(1)}ms</p>
                <p className="text-sm text-muted-foreground">Slowest Query</p>
              </div>
            </div>

            {/* Performance Status */}
            <div className="mt-4">
              {metrics.overallScore >= 90 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Excellent performance! All systems operating within optimal parameters.
                  </AlertDescription>
                </Alert>
              ) : metrics.overallScore >= 70 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Good performance with some areas for improvement. Consider optimizing slower queries.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Performance issues detected. Review failed tests and consider system optimization.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Performance Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{test.name}</h4>
                        {getStatusBadge(test)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {test.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>Target: {test.target}ms</span>
                        </div>
                        {test.actualTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className={test.actualTime <= test.target ? 'text-green-600' : 'text-red-600'}>
                              Actual: {test.actualTime.toFixed(1)}ms
                            </span>
                          </div>
                        )}
                        {test.resultCount !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3" />
                            <span>Results: {test.resultCount}</span>
                          </div>
                        )}
                      </div>
                      {test.error && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {test.error}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Log */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Test Results Log</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className={result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Recommendations */}
      {metrics && metrics.overallScore < 90 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {metrics.averageQueryTime > 75 && (
                <p>• Consider rebuilding search indexes to improve query performance</p>
              )}
              {metrics.maxQueryTime > 200 && (
                <p>• Some queries are taking too long - review complex search logic</p>
              )}
              {metrics.failedTests > 0 && (
                <p>• Failed tests indicate potential system issues - check error logs</p>
              )}
              <p>• Regular performance monitoring helps maintain optimal search experience</p>
              <p>• Consider implementing query result caching for frequently searched terms</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceValidator;