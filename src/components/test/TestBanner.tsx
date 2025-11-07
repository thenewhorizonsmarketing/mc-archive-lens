// Test Banner Component - Shows link to test page
import React from 'react';
import { Link } from 'react-router-dom';
import { TestTube, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const TestBanner: React.FC = () => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 bg-blue-50 border-blue-200 shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <TestTube className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Search Tests Available
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Run automated tests to verify search functionality
          </p>
          <Link to="/search-test">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Run Tests
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default TestBanner;