// Search Test Page
import React from 'react';
import { SearchFunctionalityTest } from '@/components/test/SearchFunctionalityTest';

export const SearchTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Search System Test</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive test suite for the search functionality including name search, filters, and combined queries.
          </p>
        </div>
        
        <SearchFunctionalityTest />
      </div>
    </div>
  );
};

export default SearchTest;