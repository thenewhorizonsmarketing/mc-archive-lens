import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { AlumniGrid } from "@/components/AlumniGrid";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { CSVUploader } from "@/components/CSVUploader";
import { CSVValidationPreview } from "@/components/CSVValidationPreview";
import { AlumniStats } from "@/components/AlumniStats";
import { AlumniPhotoUploader } from "@/components/AlumniPhotoUploader";
import { AlumniPhotoGallery } from "@/components/AlumniPhotoGallery";
import { PhotoStats } from "@/components/PhotoStats";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { AlumniBatchEditor } from "@/components/AlumniBatchEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { sampleAlumni } from "@/lib/sampleData";
import { AlumniRecord } from "@/types";
import { Home, Search, Database, ImagePlus, LayoutGrid, Images, Edit3, CheckSquare } from "lucide-react";
import { parseAlumniCSV, filterAlumni, getUniqueDecades, getUniqueYears, getUniqueRoles, getAlumniStats } from "@/lib/csvParser";
import { getPhotoUrl } from "@/lib/imageUtils";
import { loadDefaultAlumniCSV } from "@/lib/loadDefaultCSV";
import { validateCSVData, type ValidationReport, type RawCSVRow } from "@/lib/csvValidator";
import { usePhotoGestures } from "@/hooks/usePhotoGestures";
import { exportAlumniToCSV } from "@/lib/csvExporter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlumniRoomProps {
  onNavigateHome: () => void;
}

export default function AlumniRoom({ onNavigateHome }: AlumniRoomProps) {
  // Filter mode state
  const [filterMode, setFilterMode] = useState<'decade' | 'year'>('decade');
  
  // Time period filters
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Role filters
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showOnlyLeadership, setShowOnlyLeadership] = useState(false);
  
  // Additional filters
  const [showOnlyWithPhotos, setShowOnlyWithPhotos] = useState(false);
  
  // Search and selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumnus, setSelectedAlumnus] = useState<AlumniRecord | null>(null);
  
  // Data state
  const [alumniData, setAlumniData] = useState<AlumniRecord[]>(sampleAlumni);
  const [isLoading, setIsLoading] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | undefined>(undefined);
  const [showUploader, setShowUploader] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  
  // Batch edit mode state
  const [editMode, setEditMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showBatchEditor, setShowBatchEditor] = useState(false);

  // Load default CSV on mount
  useEffect(() => {
    const loadDefault = async () => {
      try {
        const defaultAlumni = await loadDefaultAlumniCSV();
        setAlumniData(defaultAlumni);
        setCsvFileName('sample-alumni.csv (default)');
      } catch (error) {
        console.error('Failed to load default CSV, using sample data:', error);
        // Keep using sampleAlumni as fallback
      }
    };
    loadDefault();
  }, []);

  // Handle CSV file selection - validate first
  const handleCSVUpload = async (file: File) => {
    setIsLoading(true);
    setPendingFile(file);
    
    try {
      // Parse CSV to get raw data for validation
      const result = await new Promise<RawCSVRow[]>((resolve, reject) => {
        Papa.parse<RawCSVRow>(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header) => header.trim().toLowerCase(),
          complete: (results) => resolve(results.data as RawCSVRow[]),
          error: (error) => reject(error)
        });
      });

      // Validate the data
      const report = validateCSVData(result);
      setValidationReport(report);
      
      toast.info('CSV validation complete - review the report');
    } catch (error) {
      toast.error(`Failed to read CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('CSV reading error:', error);
      setPendingFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm import after validation
  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    
    setIsLoading(true);
    try {
      const parsedAlumni = await parseAlumniCSV(pendingFile);
      setAlumniData(parsedAlumni);
      setCsvFileName(pendingFile.name);
      setShowUploader(false);
      setValidationReport(null);
      setPendingFile(null);
      toast.success(`Successfully imported ${parsedAlumni.length} alumni records`);
    } catch (error) {
      toast.error(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('CSV import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel validation and import
  const handleCancelImport = () => {
    setValidationReport(null);
    setPendingFile(null);
    toast.info('Import cancelled');
  };

  // Extract unique values for filters
  const decades = useMemo(() => getUniqueDecades(alumniData), [alumniData]);
  const years = useMemo(() => getUniqueYears(alumniData), [alumniData]);
  const roles = useMemo(() => getUniqueRoles(alumniData), [alumniData]);

  // Filter alumni with all active filters
  const filteredAlumni = useMemo(() => {
    return filterAlumni(alumniData, {
      decade: filterMode === 'decade' ? selectedDecade : null,
      year: filterMode === 'year' ? selectedYear : null,
      searchQuery: searchQuery,
      hasPhoto: showOnlyWithPhotos,
      hasRole: showOnlyLeadership && !selectedRole ? true : undefined,
      specificRole: selectedRole,
    });
  }, [alumniData, filterMode, selectedDecade, selectedYear, searchQuery, showOnlyWithPhotos, showOnlyLeadership, selectedRole]);

  // Get statistics
  const stats = useMemo(() => getAlumniStats(alumniData), [alumniData]);

  // Display alumni based on view mode
  const displayedAlumni = useMemo(() => {
    if (viewMode === 'gallery') {
      return filteredAlumni.filter(a => a.photo_file);
    }
    return filteredAlumni;
  }, [filteredAlumni, viewMode]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilterMode('decade');
    setSelectedDecade(null);
    setSelectedYear(null);
    setSelectedRole(null);
    setShowOnlyLeadership(false);
    setShowOnlyWithPhotos(false);
  };

  // Handle filter mode change - clear time period filters when switching
  const handleFilterModeChange = (mode: 'decade' | 'year') => {
    setFilterMode(mode);
    setSelectedDecade(null);
    setSelectedYear(null);
  };

  // Handle photo upload completion
  const handlePhotoUploadComplete = (updatedAlumni: AlumniRecord[]) => {
    setAlumniData(updatedAlumni);
    setSelectedAlumnus(prev => {
      if (!prev) return null;
      return updatedAlumni.find(a => a.id === prev.id) ?? null;
    });
    setShowPhotoUploader(false);
  };

  // Batch editing handlers
  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === displayedAlumni.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(displayedAlumni.map(a => a.id)));
    }
  };

  const handleBulkSetRole = (role: string) => {
    const updatedData = alumniData.map(record => 
      selectedRecords.has(record.id) ? { ...record, class_role: role || undefined } : record
    );
    setAlumniData(updatedData);
    toast.success(`Role updated for ${selectedRecords.size} alumni`);
  };

  const handleBulkSetYear = (year: number) => {
    const updatedData = alumniData.map(record => 
      selectedRecords.has(record.id) 
        ? { ...record, grad_year: year, decade: `${Math.floor(year / 10) * 10}s` }
        : record
    );
    setAlumniData(updatedData);
    toast.success(`Year updated for ${selectedRecords.size} alumni`);
  };

  const handleBulkAddTags = (newTags: string[]) => {
    const updatedData = alumniData.map(record => 
      selectedRecords.has(record.id)
        ? { ...record, tags: [...new Set([...record.tags, ...newTags])] }
        : record
    );
    setAlumniData(updatedData);
    toast.success(`Tags added to ${selectedRecords.size} alumni`);
  };

  const handleBulkRemoveTags = (tagsToRemove: string[]) => {
    const updatedData = alumniData.map(record => 
      selectedRecords.has(record.id)
        ? { ...record, tags: record.tags.filter(t => !tagsToRemove.includes(t)) }
        : record
    );
    setAlumniData(updatedData);
    toast.success(`Tags removed from ${selectedRecords.size} alumni`);
  };

  const handleBulkClearPhotos = () => {
    const confirmed = window.confirm(`Clear photo files for ${selectedRecords.size} selected alumni?`);
    if (!confirmed) return;
    
    const updatedData = alumniData.map(record => 
      selectedRecords.has(record.id)
        ? { ...record, photo_file: undefined }
        : record
    );
    setAlumniData(updatedData);
    toast.success(`Photos cleared for ${selectedRecords.size} alumni`);
  };

  const handleBulkDelete = () => {
    const confirmed = window.confirm(`Delete ${selectedRecords.size} selected alumni records? This cannot be undone.`);
    if (!confirmed) return;
    
    const updatedData = alumniData.filter(record => !selectedRecords.has(record.id));
    setAlumniData(updatedData);
    setSelectedRecords(new Set());
    toast.success(`Deleted ${selectedRecords.size} alumni records`);
  };

  const handleBatchEditorSave = (changes: Map<string, Partial<AlumniRecord>>) => {
    const updatedData = alumniData.map(record => {
      const change = changes.get(record.id);
      return change ? { ...record, ...change } : record;
    });
    setAlumniData(updatedData);
    setShowBatchEditor(false);
  };

  const handleExportSelected = () => {
    const selectedData = alumniData.filter(a => selectedRecords.has(a.id));
    exportAlumniToCSV(selectedData, 'alumni-selected.csv');
    toast.success(`Exported ${selectedRecords.size} records to CSV`);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedRecords(new Set());
  };

  // Navigation between photos in detail dialog
  const currentPhotoIndex = useMemo(() => {
    if (!selectedAlumnus) return -1;
    return displayedAlumni.findIndex(a => a.id === selectedAlumnus.id);
  }, [selectedAlumnus, displayedAlumni]);

  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setSelectedAlumnus(displayedAlumni[currentPhotoIndex - 1]);
      photoGestures.resetZoom();
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < displayedAlumni.length - 1) {
      setSelectedAlumnus(displayedAlumni[currentPhotoIndex + 1]);
      photoGestures.resetZoom();
    }
  };

  // Photo gestures for touch interactions
  const photoGestures = usePhotoGestures({
    onSwipeLeft: handleNextPhoto,
    onSwipeRight: handlePreviousPhoto,
    minZoom: 1,
    maxZoom: 4,
    enabled: !!selectedAlumnus,
  });

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Alumni Records</h1>
            <p className="text-xl text-muted-foreground">
              {viewMode === 'gallery' ? (
                <>
                  {displayedAlumni.length} {displayedAlumni.length === 1 ? 'photo' : 'photos'} 
                  <span className="text-sm ml-2">
                    ({filteredAlumni.length > 0 ? Math.round((displayedAlumni.length / filteredAlumni.length) * 100) : 0}% of filtered alumni)
                  </span>
                </>
              ) : (
                <>
                  {displayedAlumni.length} {displayedAlumni.length === 1 ? 'alumnus' : 'alumni'} found
                </>
              )}
              {csvFileName && <span className="ml-2 text-sm">• {csvFileName}</span>}
            </p>
          </div>
          <div className="flex gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-2 mr-2">
              <Button 
                variant={viewMode === 'list' ? 'kiosk' : 'outline'} 
                size="touch"
                onClick={() => setViewMode('list')}
              >
                <LayoutGrid className="w-6 h-6 mr-2" />
                List
              </Button>
              <Button 
                variant={viewMode === 'gallery' ? 'kiosk' : 'outline'} 
                size="touch"
                onClick={() => setViewMode('gallery')}
              >
                <Images className="w-6 h-6 mr-2" />
                Gallery
              </Button>
            </div>

            {/* Edit Mode Toggle */}
            <Button 
              variant={editMode ? 'default' : 'outline'} 
              size="touch"
              onClick={toggleEditMode}
            >
              {editMode ? <CheckSquare className="w-6 h-6 mr-2" /> : <Edit3 className="w-6 h-6 mr-2" />}
              {editMode ? 'Exit Edit' : 'Edit Mode'}
            </Button>
            
            <Button variant="outline" size="touch" onClick={() => setShowUploader(!showUploader)}>
              <Database className="w-6 h-6 mr-2" />
              Load CSV
            </Button>
            <Button variant="kiosk-gold" size="touch" onClick={() => setShowPhotoUploader(true)}>
              <ImagePlus className="w-6 h-6 mr-2" />
              Upload Photos
            </Button>
            <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
              <Home className="w-6 h-6 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* CSV Uploader */}
        {showUploader && !validationReport && (
          <div className="mb-8">
            <CSVUploader
              onFileSelect={handleCSVUpload}
              isLoading={isLoading}
              fileName={csvFileName}
            />
          </div>
        )}

        {/* Validation Report */}
        {validationReport && pendingFile && (
          <div className="mb-8">
            <CSVValidationPreview
              report={validationReport}
              fileName={pendingFile.name}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
            />
          </div>
        )}

        {/* Statistics - Show PhotoStats in gallery view, AlumniStats in list view */}
        {viewMode === 'gallery' ? (
          <PhotoStats alumni={alumniData} />
        ) : (
          <AlumniStats stats={stats} />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, role, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 text-lg"
            />
          </div>
        </div>

        {/* Batch Actions Toolbar */}
        {editMode && selectedRecords.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedRecords.size}
            roles={roles}
            onBulkSetRole={handleBulkSetRole}
            onBulkSetYear={handleBulkSetYear}
            onBulkAddTags={handleBulkAddTags}
            onBulkRemoveTags={handleBulkRemoveTags}
            onBulkClearPhotos={handleBulkClearPhotos}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedRecords(new Set())}
            onOpenSpreadsheet={() => setShowBatchEditor(true)}
            onExport={handleExportSelected}
          />
        )}

        {/* Select All in Edit Mode */}
        {editMode && displayedAlumni.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Checkbox
              checked={selectedRecords.size === displayedAlumni.length && displayedAlumni.length > 0}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select all {displayedAlumni.length} {displayedAlumni.length === 1 ? 'record' : 'records'}
            </label>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="mb-8">
          <AdvancedFilters
            filterMode={filterMode}
            onFilterModeChange={handleFilterModeChange}
            decades={decades}
            selectedDecade={selectedDecade}
            onSelectDecade={setSelectedDecade}
            years={years}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            roles={roles}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            showOnlyLeadership={showOnlyLeadership}
            onToggleLeadership={setShowOnlyLeadership}
            showOnlyWithPhotos={showOnlyWithPhotos}
            onTogglePhotos={setShowOnlyWithPhotos}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {/* Content Display - List or Gallery */}
        {displayedAlumni.length > 0 ? (
          <div className="space-y-4">
            {/* Edit Mode Grid - Show checkboxes */}
            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedAlumni.map((alumnus) => (
                  <Card
                    key={alumnus.id}
                    className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 relative"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <Checkbox
                        checked={selectedRecords.has(alumnus.id)}
                        onCheckedChange={() => handleSelectRecord(alumnus.id)}
                        className="bg-background"
                      />
                    </div>
                    <div 
                      className="ml-8"
                      onClick={() => handleSelectRecord(alumnus.id)}
                    >
                      <h3 className="font-semibold text-lg mb-1">{alumnus.full_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">Class of {alumnus.grad_year}</p>
                      {alumnus.class_role && (
                        <p className="text-sm">{alumnus.class_role}</p>
                      )}
                      {alumnus.photo_file && (
                        <p className="text-xs text-muted-foreground mt-2">📷 Has photo</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Normal view mode
              viewMode === 'list' ? (
                <AlumniGrid
                  alumni={displayedAlumni}
                  onSelect={setSelectedAlumnus}
                />
              ) : (
                <AlumniPhotoGallery
                  alumni={displayedAlumni}
                  onSelect={setSelectedAlumnus}
                />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              {viewMode === 'gallery' 
                ? 'No photos found matching your criteria'
                : 'No alumni found matching your criteria'
              }
            </p>
          </div>
        )}

        {/* Detail Dialog with Photo Gestures */}
        <Dialog open={!!selectedAlumnus} onOpenChange={() => {
          setSelectedAlumnus(null);
          photoGestures.resetZoom();
        }}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
            {selectedAlumnus && (
              <div className="flex flex-col h-full">
                {/* Photo Section with Gestures */}
                {getPhotoUrl(selectedAlumnus) && (
                  <div 
                    ref={photoGestures.containerRef}
                    className="relative bg-black overflow-hidden touch-none select-none"
                    style={{ height: '60vh' }}
                  >
                    {/* Photo with Transform */}
                    <div
                      ref={photoGestures.imageRef}
                      className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                      style={{
                        transform: photoGestures.transform,
                        cursor: photoGestures.gestureState.scale > 1 ? 'move' : 'default',
                      }}
                    >
                      <img
                        src={getPhotoUrl(selectedAlumnus)!}
                        alt={selectedAlumnus.full_name}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                    </div>

                    {/* Navigation Arrows - Only show when not zoomed */}
                    {photoGestures.gestureState.scale === 1 && (
                      <>
                        {currentPhotoIndex > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-white/20 text-white z-10"
                            onClick={handlePreviousPhoto}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          </Button>
                        )}
                        {currentPhotoIndex < displayedAlumni.length - 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-white/20 text-white z-10"
                            onClick={handleNextPhoto}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </Button>
                        )}
                      </>
                    )}

                    {/* Zoom Indicator */}
                    {photoGestures.gestureState.scale > 1 && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {Math.round(photoGestures.gestureState.scale * 100)}%
                      </div>
                    )}

                    {/* Help Text */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs opacity-70">
                      {photoGestures.gestureState.scale === 1 
                        ? 'Double tap to zoom • Swipe to navigate'
                        : 'Drag to pan • Pinch to zoom out'
                      }
                    </div>

                    {/* Photo Counter */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {displayedAlumni.length}
                    </div>
                  </div>
                )}
                
                {/* Info Section - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                  <DialogHeader>
                    <DialogTitle className="text-3xl">{selectedAlumnus.full_name}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground">
                        Class of {selectedAlumnus.grad_year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Graduated: {selectedAlumnus.grad_date}
                      </p>
                    </div>
                    
                    {selectedAlumnus.class_role && (
                      <div>
                        <h3 className="font-semibold mb-2">Leadership Role</h3>
                        <p className="text-lg">{selectedAlumnus.class_role}</p>
                      </div>
                    )}
                    
                    {selectedAlumnus.photo_file && (
                      <div>
                        <h3 className="font-semibold mb-2">Photo Information</h3>
                        <p className="text-sm text-muted-foreground">
                          Filename: {selectedAlumnus.photo_file}
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Part of the {selectedAlumnus.decade} graduating classes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Uploader Dialog */}
        <Dialog open={showPhotoUploader} onOpenChange={setShowPhotoUploader}>
          <AlumniPhotoUploader
            alumniData={alumniData}
            onComplete={handlePhotoUploadComplete}
            onCancel={() => setShowPhotoUploader(false)}
          />
        </Dialog>

        {/* Batch Editor Dialog */}
        <AlumniBatchEditor
          open={showBatchEditor}
          onClose={() => setShowBatchEditor(false)}
          selectedRecords={selectedRecords}
          alumniData={alumniData}
          roles={roles}
          onSave={handleBatchEditorSave}
        />
      </div>
    </div>
  );
}
