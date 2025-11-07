// CSV Upload Interface for Admin Panel
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Download
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';
import { ImportManager } from '@/lib/database/import-manager';
import { toast } from 'sonner';

interface CSVUploadInterfaceProps {
  searchManager: EnhancedSearchManager | null;
}

type DataType = 'alumni' | 'publications' | 'photos' | 'faculty';

interface UploadState {
  file: File | null;
  dataType: DataType | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  validationResults: any | null;
}

export const CSVUploadInterface: React.FC<CSVUploadInterfaceProps> = ({
  searchManager
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    dataType: null,
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    validationResults: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadState(prev => ({
          ...prev,
          error: 'Please select a CSV file',
          file: null
        }));
        return;
      }

      setUploadState(prev => ({
        ...prev,
        file,
        error: null,
        success: false,
        validationResults: null
      }));
    }
  }, []);

  // Handle data type selection
  const handleDataTypeChange = useCallback((value: DataType) => {
    setUploadState(prev => ({
      ...prev,
      dataType: value,
      error: null
    }));
  }, []);

  // Validate CSV file
  const validateCSV = useCallback(async () => {
    if (!uploadState.file || !uploadState.dataType || !searchManager) return;

    setUploadState(prev => ({ ...prev, isUploading: true, progress: 10 }));

    try {
      // Create import manager instance
      const importManager = new ImportManager(searchManager.getDatabaseManager());
      
      // Validate the CSV file
      const validation = await importManager.validateCSV(uploadState.file, uploadState.dataType);
      
      setUploadState(prev => ({
        ...prev,
        validationResults: validation,
        progress: 50,
        error: validation.isValid ? null : 'Validation failed - check results below'
      }));

      if (validation.isValid) {
        toast.success('CSV validation passed');
      } else {
        toast.error('CSV validation failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Validation failed',
        progress: 0
      }));
      toast.error('Validation error');
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  }, [uploadState.file, uploadState.dataType, searchManager]);

  // Upload and import CSV
  const handleUpload = useCallback(async () => {
    if (!uploadState.file || !uploadState.dataType || !searchManager) return;

    setUploadState(prev => ({ ...prev, isUploading: true, progress: 0 }));

    try {
      // Create import manager instance
      const importManager = new ImportManager(searchManager.getDatabaseManager());
      
      // Import the CSV file with progress tracking
      const result = await importManager.importCSV(
        uploadState.file, 
        uploadState.dataType,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          success: true,
          progress: 100,
          error: null
        }));
        toast.success(`Successfully imported ${result.recordsImported} records`);
      } else {
        setUploadState(prev => ({
          ...prev,
          error: result.errors.join(', '),
          progress: 0
        }));
        toast.error('Import failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Import failed',
        progress: 0
      }));
      toast.error('Import error');
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  }, [uploadState.file, uploadState.dataType, searchManager]);

  // Clear upload state
  const clearUpload = useCallback(() => {
    setUploadState({
      file: null,
      dataType: null,
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      validationResults: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Download sample CSV template
  const downloadTemplate = useCallback((dataType: DataType) => {
    const templates = {
      alumni: 'full_name,class_year,role,tags\n"John Doe",1995,"Student Leader","leadership,honor_roll"\n"Jane Smith",1996,"Class President","leadership,valedictorian"',
      publications: 'title,pub_name,issue_date,volume_issue,description,tags\n"Legal Perspectives","Law Review","2023-01-15","Vol 45 Issue 1","Analysis of recent cases","legal,analysis"\n"Student News","Amicus","2023-02-01","Spring 2023","Campus updates","news,campus"',
      photos: 'title,collection,year_or_decade,caption,tags\n"Graduation Ceremony","Graduation Photos","2023","Class of 2023 graduation","graduation,ceremony"\n"Campus Life","Historical Archives","1990s","Students in the library","campus,historical"',
      faculty: 'full_name,title,department,email,phone\n"Dr. John Smith","Professor","Law","j.smith@example.edu","555-0123"\n"Prof. Jane Doe","Associate Professor","Criminal Justice","j.doe@example.edu","555-0124"'
    };

    const content = templates[dataType];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${dataType} template`);
  }, []);

  return (
    <div className="csv-upload-interface space-y-6">
      {/* File Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploadState.isUploading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="data-type">Data Type</Label>
          <Select
            value={uploadState.dataType || ''}
            onValueChange={handleDataTypeChange}
            disabled={uploadState.isUploading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alumni">Alumni Records</SelectItem>
              <SelectItem value="publications">Publications</SelectItem>
              <SelectItem value="photos">Photo Archives</SelectItem>
              <SelectItem value="faculty">Faculty & Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['alumni', 'publications', 'photos', 'faculty'] as DataType[]).map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate(type)}
                className="flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span className="capitalize">{type}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Info */}
      {uploadState.file && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{uploadState.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadState.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUpload}
                disabled={uploadState.isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {uploadState.isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{uploadState.progress}%</span>
              </div>
              <Progress value={uploadState.progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {uploadState.validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {uploadState.validationResults.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Validation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Total Rows</p>
                <p className="text-2xl font-bold">{uploadState.validationResults.totalRows}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valid Rows</p>
                <p className="text-2xl font-bold text-green-600">{uploadState.validationResults.validRows}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Invalid Rows</p>
                <p className="text-2xl font-bold text-red-600">{uploadState.validationResults.invalidRows}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{uploadState.validationResults.warnings}</p>
              </div>
            </div>

            {uploadState.validationResults.errors && uploadState.validationResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="space-y-1">
                  {uploadState.validationResults.errors.slice(0, 5).map((error: string, index: number) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                  {uploadState.validationResults.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {uploadState.validationResults.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadState.error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {uploadState.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            CSV file imported successfully! The search index has been updated.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={validateCSV}
          disabled={!uploadState.file || !uploadState.dataType || uploadState.isUploading}
          variant="outline"
        >
          <FileText className="h-4 w-4 mr-2" />
          Validate CSV
        </Button>
        
        <Button
          onClick={handleUpload}
          disabled={
            !uploadState.file || 
            !uploadState.dataType || 
            uploadState.isUploading ||
            (uploadState.validationResults && !uploadState.validationResults.isValid)
          }
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>

        {(uploadState.file || uploadState.success) && (
          <Button
            onClick={clearUpload}
            variant="ghost"
            disabled={uploadState.isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default CSVUploadInterface;