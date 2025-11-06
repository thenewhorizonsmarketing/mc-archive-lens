import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, Users, BookOpen, Image, UserSquare, Database } from "lucide-react";
import { toast } from "sonner";
import { 
  exportAlumniToCSV, 
  exportPublicationsToCSV, 
  exportPhotosToCSV, 
  exportFacultyToCSV,
  exportCompleteDatabase 
} from "@/lib/csvExporter";
import { sampleAlumni, samplePublications, samplePhotos, sampleFaculty } from "@/lib/sampleData";

export function DatabaseExporter() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("");

  const handleExportAll = async () => {
    setIsExporting(true);
    setExportStatus("Preparing alumni data...");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportStatus("Preparing publications data...");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportStatus("Preparing photos data...");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportStatus("Preparing faculty data...");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportStatus("Creating ZIP archive...");
      
      const counts = await exportCompleteDatabase(
        sampleAlumni,
        samplePublications,
        samplePhotos,
        sampleFaculty
      );
      
      toast.success(`Database exported successfully! (${counts.total} total records)`, {
        description: `${counts.alumni} alumni, ${counts.publications} publications, ${counts.photos} photos, ${counts.faculty} faculty`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not create database export. Please try again.",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setExportStatus("");
    }
  };

  const handleExportAlumni = () => {
    exportAlumniToCSV(sampleAlumni);
    toast.success(`Exported ${sampleAlumni.length} alumni records`);
  };

  const handleExportPublications = () => {
    exportPublicationsToCSV(samplePublications);
    toast.success(`Exported ${samplePublications.length} publication records`);
  };

  const handleExportPhotos = () => {
    exportPhotosToCSV(samplePhotos);
    toast.success(`Exported ${samplePhotos.length} photo records`);
  };

  const handleExportFaculty = () => {
    exportFacultyToCSV(sampleFaculty);
    toast.success(`Exported ${sampleFaculty.length} faculty records`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="hidden sm:inline">{exportStatus}</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Export Database</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={handleExportAll} className="gap-2">
          <Database className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Export All Data (ZIP)</span>
            <span className="text-xs text-muted-foreground">
              Complete database with README
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportAlumni} className="gap-2">
          <Users className="h-4 w-4" />
          <span>Export Alumni Only (CSV)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportPublications} className="gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Export Publications Only (CSV)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportPhotos} className="gap-2">
          <Image className="h-4 w-4" />
          <span>Export Photos Only (CSV)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportFaculty} className="gap-2">
          <UserSquare className="h-4 w-4" />
          <span>Export Faculty Only (CSV)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
