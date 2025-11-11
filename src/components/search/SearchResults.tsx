// Search Results Display Component
import React, { useState, useMemo } from 'react';
import { Grid, List, Clock, TrendingUp, AlertCircle, FileText, Users, Camera, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResult, SearchPerformanceMetrics } from '@/lib/database/types';
import { ResultFormatter } from '@/lib/database/result-formatter';
import { ResultCard } from './ResultCard';
import { ResultList } from './ResultList';

export interface SearchResultsProps {
  results: SearchResult[];
  totalCount?: number;
  isLoading?: boolean;
  error?: string;
  query?: string;
  onResultSelect: (result: SearchResult) => void;
  metrics?: SearchPerformanceMetrics;
  highlightTerms?: string[];
  className?: string;
}

type ViewMode = 'grid' | 'list';

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalCount,
  isLoading,
  error,
  query,
  onResultSelect,
  metrics,
  className = ""
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Format results for display
  const formattedResults = useMemo(() => {
    if (!query || results.length === 0) return [];
    
    try {
      const highlightTerms = query.split(' ').filter(term => term.length > 0);
      return ResultFormatter.formatResults(results, {
        includeSnippets: true,
        snippetLength: viewMode === 'grid' ? 100 : 200,
        highlightTerms,
        includeThumbnails: true,
        thumbnailSize: viewMode === 'grid' ? 'medium' : 'small',
        includeMetadata: true
      });
    } catch (error) {
      console.error('Error formatting results:', error);
      // Return results as-is if formatting fails
      return results.map(result => ({
        ...result,
        snippet: result.snippet || (result.metadata?.description || result.title || '').substring(0, 150) + '...'
      })) as any;
    }
  }, [results, query, viewMode]);

  // Group results by type
  const resultsByType = useMemo(() => {
    const grouped = formattedResults.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, any[]>);
    
    return grouped;
  }, [formattedResults]);

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alumni': return <GraduationCap className="h-4 w-4" />;
      case 'publication': return <FileText className="h-4 w-4" />;
      case 'photo': return <Camera className="h-4 w-4" />;
      case 'faculty': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'alumni': return 'Alumni';
      case 'publication': return 'Publications';
      case 'photo': return 'Photos';
      case 'faculty': return 'Faculty';
      default: return type;
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => {
    if (!query) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start Your Search</h3>
              <p>Enter a search term to find alumni, publications, photos, and faculty.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-gray-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="mb-4">No results found for "{query}". Try:</p>
            <ul className="text-sm space-y-1 text-left max-w-md mx-auto">
              <li>• Checking your spelling</li>
              <li>• Using different keywords</li>
              <li>• Trying broader search terms</li>
              <li>• Removing filters</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`search-results ${className}`} role="region" aria-label="Search results">
      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      {/* Loading State */}
      {isLoading && <LoadingSkeleton />}

      {/* Empty State */}
      {!isLoading && !error && formattedResults.length === 0 && <EmptyState />}

      {/* Results by Type */}
      {!isLoading && !error && formattedResults.length > 0 && (
        <div className="space-y-6">
          {Object.entries(resultsByType).map(([type, typeResults]: [string, any[]]) => (
            <div key={type}>
              {/* Type Header */}
              <div className="flex items-center space-x-2 mb-4">
                {getTypeIcon(type)}
                <h4 className="text-lg font-medium">{getTypeLabel(type)}</h4>
                <Badge variant="secondary">
                  {typeResults.length}
                </Badge>
              </div>

              {/* Results */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeResults.map((result) => (
                    <ResultCard
                      key={result.id}
                      result={result}
                      onClick={() => {
                        console.log('[SearchResults] ResultCard onClick triggered for:', result.title);
                        onResultSelect(result);
                      }}
                      highlightTerms={query.split(' ').filter(term => term.length > 0)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {typeResults.map((result) => (
                    <ResultList
                      key={result.id}
                      result={result}
                      onClick={() => onResultSelect(result)}
                      highlightTerms={query.split(' ').filter(term => term.length > 0)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

export default SearchResults;