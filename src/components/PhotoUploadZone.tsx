import { useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface PhotoUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PhotoUploadZone({ onFilesSelected, disabled }: PhotoUploadZoneProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        console.warn(`Skipping ${file.name}: Invalid file type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`Skipping ${file.name}: File too large`);
        return false;
      }
      return true;
    });
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, disabled]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files || []).filter(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return false;
      if (file.size > MAX_FILE_SIZE) return false;
      return true;
    });
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
    
    // Reset input
    e.target.value = '';
  }, [onFilesSelected, disabled]);
  
  return (
    <Card 
      className={cn(
        "p-12 border-2 border-dashed hover:border-primary/50 transition-colors",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-primary" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Upload Alumni Photos
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop multiple photos here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, WEBP • Max 10MB per file
          </p>
        </div>
        
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Upload className="w-5 h-5" />
            Select Photos
          </div>
        </label>
      </div>
    </Card>
  );
}
