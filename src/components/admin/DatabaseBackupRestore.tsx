// Database Backup and Restore Component
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  HardDrive,
  Calendar,
  FileArchive
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';
import { BackupManager } from '@/lib/database/backup-manager';
import { toast } from 'sonner';

interface DatabaseBackupRestoreProps {
  searchManager: EnhancedSearchManager | null;
}

interface BackupInfo {
  filename: string;
  size: string;
  date: Date;
  tables: string[];
  recordCount: number;
}

export const DatabaseBackupRestore: React.FC<DatabaseBackupRestoreProps> = ({
  searchManager
}) => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentBackups, setRecentBackups] = useState<BackupInfo[]>([]);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock recent backups data
  React.useEffect(() => {
    const mockBackups: BackupInfo[] = [
      {
        filename: 'mc_archive_backup_2024_01_15.db',
        size: '45.2 MB',
        date: new Date('2024-01-15T10:30:00'),
        tables: ['alumni', 'publications', 'photos', 'faculty'],
        recordCount: 5420
      },
      {
        filename: 'mc_archive_backup_2024_01_01.db',
        size: '42.8 MB',
        date: new Date('2024-01-01T09:00:00'),
        tables: ['alumni', 'publications', 'photos', 'faculty'],
        recordCount: 5180
      },
      {
        filename: 'mc_archive_backup_2023_12_15.db',
        size: '40.1 MB',
        date: new Date('2023-12-15T14:20:00'),
        tables: ['alumni', 'publications', 'photos', 'faculty'],
        recordCount: 4950
      }
    ];
    setRecentBackups(mockBackups);
  }, []);

  // Create database backup
  const createBackup = useCallback(async () => {
    if (!searchManager) {
      setError('Search manager not available');
      return;
    }

    setIsCreatingBackup(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const backupManager = new BackupManager(searchManager.getDatabaseManager());
      
      // Create backup with progress tracking
      const backupPath = await backupManager.createBackup((progressValue) => {
        setProgress(progressValue);
      });

      // Download the backup file
      const response = await fetch(backupPath);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mc_archive_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Backup created and downloaded successfully');
      setProgress(100);
      toast.success('Database backup completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backup failed';
      setError(errorMessage);
      toast.error('Backup failed');
    } finally {
      setIsCreatingBackup(false);
    }
  }, [searchManager]);

  // Handle backup file selection
  const handleBackupFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.db')) {
        setError('Please select a database backup file (.db)');
        return;
      }
      setSelectedBackupFile(file);
      setError(null);
      setSuccess(null);
    }
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(async () => {
    if (!selectedBackupFile || !searchManager) {
      setError('Please select a backup file');
      return;
    }

    const confirmed = window.confirm(
      'This will replace all current data with the backup. This action cannot be undone. Continue?'
    );
    
    if (!confirmed) return;

    setIsRestoring(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const backupManager = new BackupManager(searchManager.getDatabaseManager());
      
      // Restore from backup with progress tracking
      await backupManager.restoreFromBackup(selectedBackupFile, (progressValue) => {
        setProgress(progressValue);
      });

      setSuccess('Database restored successfully');
      setProgress(100);
      setSelectedBackupFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Database restored successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Restore failed';
      setError(errorMessage);
      toast.error('Restore failed');
    } finally {
      setIsRestoring(false);
    }
  }, [selectedBackupFile, searchManager]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedBackupFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="database-backup-restore space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Create Database Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a complete backup of the database including all tables and search indexes.
            The backup file will be downloaded to your computer.
          </p>

          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating backup...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button
            onClick={createBackup}
            disabled={isCreatingBackup || !searchManager}
            className="w-full"
          >
            {isCreatingBackup ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Create Backup
          </Button>
        </CardContent>
      </Card>

      {/* Restore from Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Restore from Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Restoring from a backup will replace all current data.
              Make sure to create a backup of the current state before proceeding.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="backup-file">Select Backup File</Label>
            <Input
              ref={fileInputRef}
              id="backup-file"
              type="file"
              accept=".db"
              onChange={handleBackupFileSelect}
              disabled={isRestoring}
              className="mt-1"
            />
          </div>

          {selectedBackupFile && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <FileArchive className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{selectedBackupFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedBackupFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isRestoring && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Restoring database...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={restoreFromBackup}
              disabled={!selectedBackupFile || isRestoring || !searchManager}
              variant="destructive"
              className="flex-1"
            >
              {isRestoring ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Restore Database
            </Button>
            
            {selectedBackupFile && (
              <Button
                onClick={clearSelection}
                variant="outline"
                disabled={isRestoring}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Recent Backups</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBackups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recent backups found
            </p>
          ) : (
            <div className="space-y-3">
              {recentBackups.map((backup, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{backup.filename}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{backup.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HardDrive className="h-3 w-3" />
                            <span>{backup.size}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Database className="h-3 w-3" />
                            <span>{backup.recordCount.toLocaleString()} records</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {backup.tables.map((table) => (
                          <Badge key={table} variant="secondary" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DatabaseBackupRestore;