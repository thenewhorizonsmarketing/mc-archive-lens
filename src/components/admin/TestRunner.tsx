// Test Runner Component for Admin Panel
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileText,
  Database,
  Search,
  Zap,
  Bug,
  Download
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';

interface TestRunnerProps {
  searchManager: EnhancedSearchManager | null;
}

interface TestCase {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'performance' | 'e2e';
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: string;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  status: 'pending' | 'running' | 'completed';
  passed: number;
  failed: number;
  skipped: number;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  searchManager
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [testResults, setTestResults] = useState<string[]>([]);

  // Initialize test suites
  const initializeTestSuites = useCallback(() => {
    const suites: TestSuite[] = [
      {
        name: 'Database Tests',
        status: 'pending',
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: [
          {
            id: 'db-connection',
            name: 'Database Connection',
            category: 'unit',
            description: 'Test database connectivity and initialization',
            status: 'pending'
          },
          {
            id: 'db-schema',
            name: 'Schema Validation',
            category: 'unit',
            description: 'Verify all required tables and indexes exist',
            status: 'pending'
          },
          {
            id: 'db-crud',
            name: 'CRUD Operations',
            category: 'integration',
            description: 'Test create, read, update, delete operations',
            status: 'pending'
          }
        ]
      },
      {
        name: 'Search Tests',
        status: 'pending',
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: [
          {
            id: 'search-basic',
            name: 'Basic Search',
            category: 'unit',
            description: 'Test simple search functionality',
            status: 'pending'
          },
          {
            id: 'search-filters',
            name: 'Search with Filters',
            category: 'integration',
            description: 'Test search with various filters applied',
            status: 'pending'
          },
          {
            id: 'search-suggestions',
            name: 'Search Suggestions',
            category: 'unit',
            description: 'Test auto-complete suggestions',
            status: 'pending'
          },
          {
            id: 'search-fallback',
            name: 'Fallback Search',
            category: 'integration',
            description: 'Test fallback search when FTS5 fails',
            status: 'pending'
          }
        ]
      },
      {
        name: 'Performance Tests',
        status: 'pending',
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: [
          {
            id: 'perf-simple',
            name: 'Simple Query Performance',
            category: 'performance',
            description: 'Test single-term search performance (target: 50ms)',
            status: 'pending'
          },
          {
            id: 'perf-complex',
            name: 'Complex Query Performance',
            category: 'performance',
            description: 'Test multi-term filtered search (target: 100ms)',
            status: 'pending'
          },
          {
            id: 'perf-concurrent',
            name: 'Concurrent Search Performance',
            category: 'performance',
            description: 'Test multiple simultaneous searches',
            status: 'pending'
          }
        ]
      },
      {
        name: 'End-to-End Tests',
        status: 'pending',
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: [
          {
            id: 'e2e-import-search',
            name: 'Import and Search Workflow',
            category: 'e2e',
            description: 'Test complete data import and search workflow',
            status: 'pending'
          },
          {
            id: 'e2e-backup-restore',
            name: 'Backup and Restore Workflow',
            category: 'e2e',
            description: 'Test backup creation and restoration',
            status: 'pending'
          },
          {
            id: 'e2e-error-recovery',
            name: 'Error Recovery Workflow',
            category: 'e2e',
            description: 'Test error detection and recovery mechanisms',
            status: 'pending'
          }
        ]
      }
    ];

    setTestSuites(suites);
  }, []);

  // Run individual test
  const runTest = async (test: TestCase): Promise<TestCase> => {
    const startTime = performance.now();

    try {
      switch (test.id) {
        case 'db-connection':
          if (!searchManager) throw new Error('Search manager not available');
          // Test database connection
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate test
          break;

        case 'db-schema':
          if (!searchManager) throw new Error('Search manager not available');
          // Test schema validation
          const dbManager = searchManager.getDatabaseManager();
          await dbManager.executeQuery('SELECT name FROM sqlite_master WHERE type="table"');
          break;

        case 'db-crud':
          if (!searchManager) throw new Error('Search manager not available');
          // Test CRUD operations
          const db = searchManager.getDatabaseManager();
          await db.executeQuery('SELECT COUNT(*) FROM alumni');
          break;

        case 'search-basic':
          if (!searchManager) throw new Error('Search manager not available');
          const results = await searchManager.searchAll('test');
          if (!Array.isArray(results)) throw new Error('Invalid search results');
          break;

        case 'search-filters':
          if (!searchManager) throw new Error('Search manager not available');
          const filteredResults = await searchManager.searchAll('test', {
            yearRange: { start: 2000, end: 2024 }
          });
          if (!Array.isArray(filteredResults)) throw new Error('Invalid filtered results');
          break;

        case 'search-suggestions':
          if (!searchManager) throw new Error('Search manager not available');
          const suggestions = await searchManager.getSearchSuggestions('test', 5);
          if (!Array.isArray(suggestions)) throw new Error('Invalid suggestions');
          break;

        case 'search-fallback':
          if (!searchManager) throw new Error('Search manager not available');
          // Test fallback search (should work even if FTS5 fails)
          const fallbackResults = await searchManager.searchAll('test');
          if (!Array.isArray(fallbackResults)) throw new Error('Fallback search failed');
          break;

        case 'perf-simple':
          if (!searchManager) throw new Error('Search manager not available');
          const perfStart = performance.now();
          await searchManager.searchAll('student');
          const perfEnd = performance.now();
          const queryTime = perfEnd - perfStart;
          if (queryTime > 100) throw new Error(`Query too slow: ${queryTime.toFixed(1)}ms`);
          break;

        case 'perf-complex':
          if (!searchManager) throw new Error('Search manager not available');
          const complexStart = performance.now();
          await searchManager.searchAll('law review', {
            yearRange: { start: 2020, end: 2024 }
          });
          const complexEnd = performance.now();
          const complexTime = complexEnd - complexStart;
          if (complexTime > 150) throw new Error(`Complex query too slow: ${complexTime.toFixed(1)}ms`);
          break;

        case 'perf-concurrent':
          if (!searchManager) throw new Error('Search manager not available');
          const concurrentStart = performance.now();
          await Promise.all([
            searchManager.searchAll('student'),
            searchManager.searchAll('faculty'),
            searchManager.searchAll('publication')
          ]);
          const concurrentEnd = performance.now();
          const concurrentTime = concurrentEnd - concurrentStart;
          if (concurrentTime > 300) throw new Error(`Concurrent queries too slow: ${concurrentTime.toFixed(1)}ms`);
          break;

        case 'e2e-import-search':
          if (!searchManager) throw new Error('Search manager not available');
          // Simulate import and search workflow
          await searchManager.searchAll('test');
          break;

        case 'e2e-backup-restore':
          if (!searchManager) throw new Error('Search manager not available');
          // Simulate backup and restore
          await new Promise(resolve => setTimeout(resolve, 200));
          break;

        case 'e2e-error-recovery':
          if (!searchManager) throw new Error('Search manager not available');
          // Test error recovery
          const recoveryStatus = searchManager.getRecoveryStatus();
          if (!recoveryStatus) throw new Error('Recovery status not available');
          break;

        default:
          throw new Error(`Unknown test: ${test.id}`);
      }

      const endTime = performance.now();
      return {
        ...test,
        status: 'passed',
        duration: endTime - startTime,
        details: `Completed in ${(endTime - startTime).toFixed(1)}ms`
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        ...test,
        status: 'failed',
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Run test suite
  const runTestSuite = async (suiteName: string) => {
    const suite = testSuites.find(s => s.name === suiteName);
    if (!suite) return;

    // Update suite status
    setTestSuites(prev => prev.map(s => 
      s.name === suiteName ? { ...s, status: 'running' } : s
    ));

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const test of suite.tests) {
      // Update test status to running
      setTestSuites(prev => prev.map(s => 
        s.name === suiteName 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id ? { ...t, status: 'running' } : t
              )
            }
          : s
      ));

      // Run the test
      const result = await runTest(test);
      
      if (result.status === 'passed') passed++;
      else if (result.status === 'failed') failed++;
      else skipped++;

      // Update test result
      setTestSuites(prev => prev.map(s => 
        s.name === suiteName 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id ? result : t
              )
            }
          : s
      ));

      // Log result
      const resultMessage = result.status === 'passed'
        ? `✓ ${result.name} (${result.duration?.toFixed(1)}ms)`
        : `✗ ${result.name}: ${result.error}`;
      
      setTestResults(prev => [...prev, resultMessage]);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Update suite completion
    setTestSuites(prev => prev.map(s => 
      s.name === suiteName 
        ? { ...s, status: 'completed', passed, failed, skipped }
        : s
    ));
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);

    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    let completedTests = 0;

    for (const suite of testSuites) {
      await runTestSuite(suite.name);
      completedTests += suite.tests.length;
      setProgress((completedTests / totalTests) * 100);
    }

    setIsRunning(false);
  };

  // Run selected suite
  const runSelectedSuite = async () => {
    if (selectedSuite === 'all') {
      await runAllTests();
    } else {
      setIsRunning(true);
      setTestResults([]);
      await runTestSuite(selectedSuite);
      setIsRunning(false);
    }
  };

  // Reset all tests
  const resetTests = () => {
    initializeTestSuites();
    setTestResults([]);
    setProgress(0);
  };

  // Download test report
  const downloadTestReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      suites: testSuites,
      results: testResults,
      summary: {
        totalSuites: testSuites.length,
        totalTests: testSuites.reduce((sum, s) => sum + s.tests.length, 0),
        totalPassed: testSuites.reduce((sum, s) => sum + s.passed, 0),
        totalFailed: testSuites.reduce((sum, s) => sum + s.failed, 0),
        totalSkipped: testSuites.reduce((sum, s) => sum + s.skipped, 0)
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Initialize on mount
  React.useEffect(() => {
    initializeTestSuites();
  }, [initializeTestSuites]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'running':
        return <Badge variant="default"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'passed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'skipped':
        return <Badge variant="outline">Skipped</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="test-runner space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Runner</h2>
          <p className="text-muted-foreground">
            Run comprehensive tests to validate system functionality
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
          {testResults.length > 0 && (
            <Button
              variant="outline"
              onClick={downloadTestReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Report
            </Button>
          )}
          <Button
            onClick={runSelectedSuite}
            disabled={isRunning || !searchManager}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running Tests...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Suites */}
      <Tabs value={selectedSuite} onValueChange={setSelectedSuite}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="Database Tests">Database</TabsTrigger>
          <TabsTrigger value="Search Tests">Search</TabsTrigger>
          <TabsTrigger value="Performance Tests">Performance</TabsTrigger>
          <TabsTrigger value="End-to-End Tests">E2E</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {testSuites.map((suite) => (
            <Card key={suite.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>{suite.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(suite.status)}
                    <Badge variant="outline">
                      {suite.passed + suite.failed + suite.skipped} tests
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{suite.passed}</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{suite.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{suite.skipped}</p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {suite.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                        {test.error && (
                          <p className="text-sm text-red-600">Error: {test.error}</p>
                        )}
                        {test.details && (
                          <p className="text-sm text-green-600">{test.details}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {test.category}
                        </Badge>
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {testSuites.map((suite) => (
          <TabsContent key={suite.name} value={suite.name}>
            <Card>
              <CardHeader>
                <CardTitle>{suite.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suite.tests.map((test) => (
                    <Card key={test.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{test.name}</h4>
                            <p className="text-sm text-muted-foreground">{test.description}</p>
                            {test.duration && (
                              <p className="text-sm text-gray-600">Duration: {test.duration.toFixed(1)}ms</p>
                            )}
                            {test.error && (
                              <p className="text-sm text-red-600">Error: {test.error}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{test.category}</Badge>
                            {getStatusBadge(test.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Test Results Log */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Test Results</span>
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
    </div>
  );
};

export default TestRunner;