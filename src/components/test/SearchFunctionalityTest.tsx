// Comprehensive Search Functionality Test Component
import React, { useEffect, useState } from 'react';
import { useSearch } from '@/lib/search-context';
import { SearchResult } from '@/lib/database/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface TestCase {
  name: string;
  description: string;
  query: string;
  filters?: any;
  expectedResults: number;
  expectedNames?: string[];
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  actualResults?: number;
  actualNames?: string[];
}

export const SearchFunctionalityTest: React.FC = () => {
  const { searchManager, isInitialized, error: contextError } = useSearch();
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      name: 'Test 1: Search by first name "John"',
      description: 'Should find John Smith',
      query: 'John',
      expectedResults: 1,
      expectedNames: ['John Smith'],
      status: 'pending'
    },
    {
      name: 'Test 2: Search by last name "Smith"',
      description: 'Should find John Smith',
      query: 'Smith',
      expectedResults: 1,
      expectedNames: ['John Smith'],
      status: 'pending'
    },
    {
      name: 'Test 3: Search by full name "Sarah Johnson"',
      description: 'Should find Sarah Johnson with high relevance',
      query: 'Sarah Johnson',
      expectedResults: 1,
      expectedNames: ['Sarah Johnson'],
      status: 'pending'
    },
    {
      name: 'Test 4: Search by department "Engineering"',
      description: 'Should find alumni with Engineering in their profile',
      query: 'Engineering',
      expectedResults: 2, // Sarah Johnson (Electrical) and possibly others
      status: 'pending'
    },
    {
      name: 'Test 5: Filter by Alumni type',
      description: 'Should return only alumni records',
      query: '',
      filters: { type: 'alumni' },
      expectedResults: 8, // All 8 alumni we added
      status: 'pending'
    },
    {
      name: 'Test 6: Name filter "Johnson"',
      description: 'Should find Sarah Johnson using name filter',
      query: '',
      filters: { type: 'alumni', name: 'Johnson' },
      expectedResults: 1,
      expectedNames: ['Sarah Johnson'],
      status: 'pending'
    },
    {
      name: 'Test 7: Year range filter 2015-2018',
      description: 'Should find alumni from 2015-2018',
      query: '',
      filters: { type: 'alumni', yearRange: { start: 2015, end: 2018 } },
      expectedResults: 3, // John Smith (2015), Sarah Johnson (2018), Michael Chen (2016)
      status: 'pending'
    },
    {
      name: 'Test 8: Combined search and filter',
      description: 'Search "Computer" with Alumni type filter',
      query: 'Computer',
      filters: { type: 'alumni' },
      expectedResults: 1,
      expectedNames: ['John Smith'],
      status: 'pending'
    },
    {
      name: 'Test 9: Search by partial name "Dav"',
      description: 'Should find David Martinez',
      query: 'Dav',
      expectedResults: 1,
      expectedNames: ['David Martinez'],
      status: 'pending'
    },
    {
      name: 'Test 10: Department filter',
      description: 'Filter by Law department',
      query: '',
      filters: { type: 'alumni', department: 'Law' },
      expectedResults: 1,
      expectedNames: ['Emily Davis'],
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<number>(-1);

  const runTests = async () => {
    if (!searchManager || !isInitialized) {
      alert('Search system not initialized yet. Please wait...');
      return;
    }

    setIsRunning(true);
    const updatedTests = [...testCases];

    for (let i = 0; i < updatedTests.length; i++) {
      setCurrentTest(i);
      const test = updatedTests[i];
      test.status = 'running';
      setTestCases([...updatedTests]);

      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visibility

        const results = await searchManager.searchAll(
          test.query,
          test.filters || {},
          { limit: 50 }
        );

        test.actualResults = results.length;
        test.actualNames = results.map(r => r.title);

        // Check if test passed
        let passed = true;
        let errorMsg = '';

        // Check result count
        if (test.expectedResults !== undefined) {
          if (results.length < test.expectedResults) {
            passed = false;
            errorMsg = `Expected at least ${test.expectedResults} results, got ${results.length}`;
          }
        }

        // Check expected names
        if (test.expectedNames && test.expectedNames.length > 0) {
          const foundNames = results.map(r => r.title);
          const missingNames = test.expectedNames.filter(name => !foundNames.includes(name));
          
          if (missingNames.length > 0) {
            passed = false;
            errorMsg = `Missing expected names: ${missingNames.join(', ')}`;
          }
        }

        test.status = passed ? 'passed' : 'failed';
        test.error = errorMsg || undefined;

      } catch (error) {
        test.status = 'failed';
        test.error = error instanceof Error ? error.message : 'Unknown error';
        test.actualResults = 0;
      }

      setTestCases([...updatedTests]);
    }

    setIsRunning(false);
    setCurrentTest(-1);
  };

  const resetTests = () => {
    setTestCases(testCases.map(test => ({
      ...test,
      status: 'pending',
      error: undefined,
      actualResults: undefined,
      actualNames: undefined
    })));
  };

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestCase['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-600">Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-600">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedTests = testCases.filter(t => t.status === 'passed').length;
  const failedTests = testCases.filter(t => t.status === 'failed').length;
  const totalTests = testCases.length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Functionality Test Suite</span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={runTests}
                disabled={isRunning || !isInitialized}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run All Tests'
                )}
              </Button>
              <Button
                onClick={resetTests}
                disabled={isRunning}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">System Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Initialized:</span>{' '}
                <Badge variant={isInitialized ? 'default' : 'destructive'}>
                  {isInitialized ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Error:</span>{' '}
                {contextError ? (
                  <span className="text-red-600">{contextError}</span>
                ) : (
                  <span className="text-green-600">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Test Results Summary */}
          {(passedTests > 0 || failedTests > 0) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results Summary</h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{passedTests}</span>
                  <span className="text-gray-600">Passed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-bold text-red-600">{failedTests}</span>
                  <span className="text-gray-600">Failed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-600">
                    {passedTests + failedTests}/{totalTests}
                  </span>
                  <span className="text-gray-600">Completed</span>
                </div>
              </div>
              {failedTests === 0 && passedTests === totalTests && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">All tests passed! 🎉</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Cases */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Cases</h3>
            {testCases.map((test, index) => (
              <Card
                key={index}
                className={`${
                  currentTest === index ? 'border-blue-500 border-2' : ''
                } ${test.status === 'failed' ? 'border-red-300' : ''} ${
                  test.status === 'passed' ? 'border-green-300' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{test.name}</h4>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                        
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Query:</span>{' '}
                            <code className="bg-gray-100 px-2 py-1 rounded">
                              {test.query || '(empty)'}
                            </code>
                          </div>
                          {test.filters && Object.keys(test.filters).length > 0 && (
                            <div>
                              <span className="font-medium">Filters:</span>{' '}
                              <code className="bg-gray-100 px-2 py-1 rounded">
                                {JSON.stringify(test.filters)}
                              </code>
                            </div>
                          )}
                          {test.actualResults !== undefined && (
                            <div>
                              <span className="font-medium">Results:</span>{' '}
                              <span className={test.status === 'passed' ? 'text-green-600' : 'text-red-600'}>
                                {test.actualResults} found
                              </span>
                              {test.expectedResults !== undefined && (
                                <span className="text-gray-500">
                                  {' '}(expected: {test.expectedResults})
                                </span>
                              )}
                            </div>
                          )}
                          {test.actualNames && test.actualNames.length > 0 && (
                            <div>
                              <span className="font-medium">Found:</span>{' '}
                              <span className="text-gray-700">
                                {test.actualNames.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {test.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {test.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchFunctionalityTest;