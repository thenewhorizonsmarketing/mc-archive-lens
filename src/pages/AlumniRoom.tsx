import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { AlumniGrid } from "@/components/AlumniGrid";
import { DecadeFilter } from "@/components/DecadeFilter";
import { CSVUploader } from "@/components/CSVUploader";
import { CSVValidationPreview } from "@/components/CSVValidationPreview";
import { AlumniStats } from "@/components/AlumniStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sampleAlumni } from "@/lib/sampleData";
import { AlumniRecord } from "@/types";
import { Home, Search, Database } from "lucide-react";
import { parseAlumniCSV, filterAlumni, getUniqueDecades, getAlumniStats } from "@/lib/csvParser";
import { loadDefaultAlumniCSV } from "@/lib/loadDefaultCSV";
import { validateCSVData, ValidationReport } from "@/lib/csvValidator";
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
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumnus, setSelectedAlumnus] = useState<AlumniRecord | null>(null);
  const [alumniData, setAlumniData] = useState<AlumniRecord[]>(sampleAlumni);
  const [isLoading, setIsLoading] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | undefined>(undefined);
  const [showUploader, setShowUploader] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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
      const result = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header) => header.trim().toLowerCase(),
          complete: (results) => resolve(results.data),
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

  // Extract unique decades
  const decades = useMemo(() => {
    return getUniqueDecades(alumniData);
  }, [alumniData]);

  // Filter alumni
  const filteredAlumni = useMemo(() => {
    return filterAlumni(alumniData, {
      decade: selectedDecade,
      searchQuery: searchQuery
    });
  }, [alumniData, selectedDecade, searchQuery]);

  // Get statistics
  const stats = useMemo(() => {
    return getAlumniStats(alumniData);
  }, [alumniData]);

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Alumni Records</h1>
            <p className="text-xl text-muted-foreground">
              {filteredAlumni.length} {filteredAlumni.length === 1 ? 'alumnus' : 'alumni'} found
              {csvFileName && <span className="ml-2 text-sm">• {csvFileName}</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="touch" onClick={() => setShowUploader(!showUploader)}>
              <Database className="w-6 h-6 mr-2" />
              Load CSV
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

        {/* Statistics */}
        <AlumniStats stats={stats} />

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

        {/* Decade Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Decade</h2>
          <DecadeFilter
            decades={decades}
            selectedDecade={selectedDecade}
            onSelectDecade={setSelectedDecade}
          />
        </div>

        {/* Alumni Grid */}
        {filteredAlumni.length > 0 ? (
          <AlumniGrid
            alumni={filteredAlumni}
            onSelect={setSelectedAlumnus}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No alumni found matching your criteria</p>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedAlumnus} onOpenChange={() => setSelectedAlumnus(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl">{selectedAlumnus?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-muted-foreground">Class of {selectedAlumnus?.grad_year}</p>
                <p className="text-sm text-muted-foreground">Graduated: {selectedAlumnus?.grad_date}</p>
              </div>
              {selectedAlumnus?.class_role && (
                <div>
                  <h3 className="font-semibold mb-2">Leadership Role</h3>
                  <p className="text-lg">{selectedAlumnus.class_role}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Part of the {selectedAlumnus?.decade} graduating classes
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
