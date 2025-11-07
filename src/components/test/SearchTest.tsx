// Quick test component to verify search functionality
import React, { useEffect, useState } from 'react';
import { useSearch } from '@/lib/search-context';
import { SearchResult } from '@/lib/database/types';

export const SearchTest: React.FC = () => {
  const { searchManager, isInitialized, error } = useSearch();
  const [testResults, setTestResults] = useState<SearchResult[]>([]);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    const runTest = async () => {
      if (!searchManager || !isInitialized) return;

      try {
        console.log('Running search test...');
        const results = await searchManager.searchAll('John', {}, { limit: 5 });
        console.log('Test results:', results);
        setTestResults(results);
        setTestError(null);
      } catch (err) {
        console.error('Test error:', err);
        setTestError(err instanceof Error ? err.message : 'Test failed');
      }
    };

    runTest();
  }, [searchManager, isInitialized]);

  if (!isInitialized) {
    return <div>Initializing search system...</div>;
  }

  if (error) {
    return <div>Search system error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-2">Search System Test</h3>
      
      {testError && (
        <div className="text-red-600 mb-2">Test Error: {testError}</div>
      )}
      
      <div className="mb-2">
        <strong>Status:</strong> {isInitialized ? 'Initialized' : 'Not initialized'}
      </div>
      
      <div className="mb-2">
        <strong>Test Query:</strong> "John"
      </div>
      
      <div className="mb-2">
        <strong>Results Count:</strong> {testResults.length}
      </div>
      
      {testResults.length > 0 && (
        <div>
          <strong>Sample Result:</strong>
          <pre className="text-xs bg-white p-2 rounded mt-1">
            {JSON.stringify(testResults[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SearchTest;