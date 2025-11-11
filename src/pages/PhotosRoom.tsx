import { useState, useMemo, useEffect } from "react";
import { useContentDataWithUrl } from "@/hooks/useContentDataWithUrl";
import { ContentList } from "@/components/content/ContentList";
import { RecordCard } from "@/components/content/RecordCard";
import { RecordDetail } from "@/components/content/RecordDetail";
import { AdvancedFilterIntegration } from "@/components/filters/AdvancedFilterIntegration";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import { toast } from "sonner";
import { useSearch } from "@/lib/search-context";

interface PhotosRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
  selectedResultName?: string;
  enableAdvancedFilters?: boolean;
}

export default function PhotosRoom({ onNavigateHome, searchQuery, selectedResultName, enableAdvancedFilters = false }: PhotosRoomProps) {
  // View mode state - photos always use grid/masonry layout
  const [viewMode] = useState<'grid' | 'list'>('grid');
  
  // Local search query state
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || "");
  
  // Get search context for initialization status
  const { isInitialized, error: contextError } = useSearch();
  
  // Use content data hook with URL parameter support for database integration
  const {
    records,
    loading,
    error,
    filters,
    setFilters,
    searchQuery: hookSearchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    totalRecords,
    goToPage,
    selectedRecord,
    selectRecord,
    clearSelection,
    refresh,
    retryCount,
    isRetrying
  } = useContentDataWithUrl({
    contentType: 'photo',
    pageSize: 24, // Grid layout with masonry
    enableAutoRetry: true,
    maxRetries: 3
  });

  // Sync local search query with hook search query (from URL)
  useEffect(() => {
    setLocalSearchQuery(hookSearchQuery);
  }, [hookSearchQuery]);
  
  // Update search query when prop changes (from navigation)
  useEffect(() => {
    if (searchQuery) {
      setLocalSearchQuery(searchQuery);
      setSearchQuery(searchQuery);
    }
  }, [searchQuery, setSearchQuery]);

  // Handle search selection from sessionStorage (from fullscreen search)
  useEffect(() => {
    // Safety check: ensure body styles are reset
    if (document.body.classList.contains('fullscreen-search-active')) {
      document.body.classList.remove('fullscreen-search-active');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    const searchSelectionStr = sessionStorage.getItem('searchSelection');
    if (!searchSelectionStr || !isInitialized || records.length === 0) {
      return;
    }

    try {
      const searchSelection = JSON.parse(searchSelectionStr);
      sessionStorage.removeItem('searchSelection');
      
      if (searchSelection.type !== 'photo') {
        return;
      }

      // Find matching record by ID
      const matchingRecord = records.find(r => r.id === searchSelection.id);
      if (matchingRecord) {
        setTimeout(() => {
          selectRecord(matchingRecord.id);
          toast.success(`Viewing ${matchingRecord.title}`);
        }, 300);
      } else {
        toast.error('Photo not found');
      }
    } catch (error) {
      console.error('Error processing search selection:', error);
      sessionStorage.removeItem('searchSelection');
    }
  }, [records, isInitialized, selectRecord]);

  // Auto-open selected result from props (legacy support)
  useEffect(() => {
    if (selectedResultName && records.length > 0 && !selectedRecord) {
      const matchingRecord = records.find(r => r.title === selectedResultName);
      if (matchingRecord) {
        setTimeout(() => {
          selectRecord(matchingRecord.id);
          toast.success(`Viewing ${matchingRecord.title}`);
        }, 300);
      }
    }
  }, [selectedResultName, records, selectedRecord, selectRecord]);

  // Extract unique values for filters
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    records.forEach(record => {
      if (record.type === 'photo' && 'year_or_decade' in record.data) {
        const yearStr = record.data.year_or_decade as string;
        // Extract year from strings like "1980" or "1980s"
        const yearMatch = yearStr?.match(/\d{4}/);
        if (yearMatch) {
          years.add(parseInt(yearMatch[0]));
        }
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [records]);

  const availableCollections = useMemo(() => {
    const collections = new Set<string>();
    records.forEach(record => {
      if (record.type === 'photo' && 'collection' in record.data && record.data.collection) {
        collections.add(record.data.collection as string);
      }
    });
    return Array.from(collections).sort();
  }, [records]);

  const availableEventTypes = useMemo(() => {
    const eventTypes = new Set<string>();
    records.forEach(record => {
      if (record.type === 'photo' && 'event_type' in record.data && record.data.event_type) {
        eventTypes.add(record.data.event_type as string);
      }
    });
    return Array.from(eventTypes).sort();
  }, [records]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    setSearchQuery(query);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters({ type: 'photo' });
    setLocalSearchQuery("");
    setSearchQuery("");
  };

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * 24;
    const endIndex = startIndex + 24;
    return records.slice(startIndex, endIndex);
  }, [records, currentPage]);

  // Navigation between records
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedRecord) return;
    
    const currentIndex = paginatedRecords.findIndex(r => r.id === selectedRecord.id);
    if (currentIndex === -1) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      selectRecord(paginatedRecords[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < paginatedRecords.length - 1) {
      selectRecord(paginatedRecords[currentIndex + 1].id);
    }
  };

  // Loading state while database initializes
  if (!isInitialized) {
    return (
      <div className="kiosk-container min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-xl text-muted-foreground">Initializing database...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (contextError || (error && !loading && records.length === 0)) {
    return (
      <div className="kiosk-container min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Database Error</h2>
              <p className="text-muted-foreground mb-6">
                {contextError || error || 'Failed to connect to database'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="kiosk" size="touch" onClick={refresh}>
                  Retry
                </Button>
                <Button variant="outline" size="touch" onClick={onNavigateHome}>
                  <Home className="w-6 h-6 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Photo Gallery</h1>
            <p className="text-xl text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
              {totalRecords} {totalRecords === 1 ? 'photo' : 'photos'} found
              {isRetrying && ` (Retrying... ${retryCount}/3)`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
              <Home className="w-6 h-6 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search photos by caption or title..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="w-full pl-14 pr-4 py-4 text-lg border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              aria-label="Search photos by caption or title"
              role="searchbox"
            />
          </div>
        </div>

        {/* Filter Panel */}
        <div className="mb-8">
          <AdvancedFilterIntegration
            contentType="photo"
            filters={filters}
            onFiltersChange={setFilters}
            availableYears={availableYears}
            availableCollections={availableCollections}
            availableEventTypes={availableEventTypes}
            enableAdvancedFilters={enableAdvancedFilters}
          />
        </div>

        {/* Content List - Masonry Grid */}
        <ContentList
          records={paginatedRecords}
          contentType="photo"
          loading={loading}
          onSelectRecord={selectRecord}
          viewMode={viewMode}
          emptyMessage="No photos found"
          emptyDescription="Try adjusting your filters or search query"
          onClearFilters={handleClearAllFilters}
        >
          {paginatedRecords.map(record => (
            <RecordCard
              key={record.id}
              record={record}
              contentType="photo"
              onClick={() => selectRecord(record.id)}
              viewMode={viewMode}
            />
          ))}
        </ContentList>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination navigation" role="navigation">
            <Button
              variant="outline"
              size="touch"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' && currentPage > 1) {
                  e.preventDefault();
                  goToPage(currentPage - 1);
                }
              }}
            >
              Previous
            </Button>
            <span className="text-lg px-4" aria-current="page" aria-label={`Page ${currentPage} of ${totalPages}`}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="touch"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' && currentPage < totalPages) {
                  e.preventDefault();
                  goToPage(currentPage + 1);
                }
              }}
            >
              Next
            </Button>
          </nav>
        )}

        {/* Photo Lightbox Detail Modal */}
        {selectedRecord && (
          <RecordDetail
            record={selectedRecord}
            contentType="photo"
            onClose={clearSelection}
            onNavigate={handleNavigate}
            showNavigation={paginatedRecords.length > 1}
          />
        )}
      </div>
    </div>
  );
}
