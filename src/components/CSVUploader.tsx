import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, FileText } from "lucide-react";
import { Card } from "./ui/card";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  fileName?: string;
}

export function CSVUploader({ onFileSelect, isLoading, fileName }: CSVUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-8 border-2 border-dashed hover:border-primary/50 transition-colors">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {fileName ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            {fileName ? "CSV File Loaded" : "Load Alumni CSV"}
          </h3>
          {fileName ? (
            <p className="text-sm text-muted-foreground mb-4">
              Currently loaded: <span className="font-medium">{fileName}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with alumni records
            </p>
          )}
        </div>

        <Button
          variant="kiosk"
          size="touch"
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          <Upload className="w-5 h-5 mr-2" />
          {fileName ? "Load Different CSV" : "Select CSV File"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {isLoading && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Parsing CSV data...
          </p>
        )}
      </div>
    </Card>
  );
}
