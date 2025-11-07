// Import Progress Tracker Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  FileText,
  Users,
  Camera,
  UserSquare,
  X
} from 'lucide-react';

interface ImportJob {
  id: string;
  type: 'alumni' | 'publications' | 'photos' | 'faculty';
  fileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
}

export const ImportProgressTracker: React.FC = () => {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockJobs: ImportJob[] = [
      {
        id: '1',
        type: 'alumni',
        fileName: 'alumni_2024.csv',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        endTime: new Date(Date.now() - 240000), // 4 minutes ago
        recordsProcessed: 1250,
        totalRecords: 1250,
        errors: []
      },
      {
        id: '2',
        type: 'publications',
        fileName: 'publications_spring_2024.csv',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 120000), // 2 minutes ago
        recordsProcessed: 325,
        totalRecords: 500,
        errors: []
      },
      {
        id: '3',
        type: 'photos',
        fileName: 'photo_metadata.csv',
        status: 'failed',
        progress: 25,
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
        endTime: new Date(Date.now() - 580000), // 9 minutes 40 seconds ago
        recordsProcessed: 150,
        totalRecords: 600,
        errors: ['Invalid date format in row 151', 'Missing required field: collection']
      }
    ];
    setImportJobs(mockJobs);
  }, []);

  // Get icon for data type
  const getTypeIcon = (type: ImportJob['type']) => {
    switch (type) {
      case 'alumni': return <Users className="h-4 w-4" />;
      case 'publications': return <FileText className="h-4 w-4" />;
      case 'photos': return <Camera className="h-4 w-4" />;
      case 'faculty': return <UserSquare className="h-4 w-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: ImportJob['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'running':
        return <Badge variant="default"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  // Format duration
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  // Remove completed job
  const removeJob = (jobId: string) => {
    setImportJobs(prev => prev.filter(job => job.id !== jobId));
  };

  // Clear all completed jobs
  const clearCompleted = () => {
    setImportJobs(prev => prev.filter(job => job.status !== 'completed'));
  };

  return (
    <div className="import-progress-tracker space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Recent Import Jobs</h3>
        {importJobs.some(job => job.status === 'completed') && (
          <Button variant="outline" size="sm" onClick={clearCompleted}>
            Clear Completed
          </Button>
        )}
      </div>

      {/* Jobs List */}
      {importJobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No import jobs found</p>
              <p className="text-sm">Upload a CSV file to see import progress here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {importJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Job Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(job.type)}
                      <div>
                        <p className="font-medium">{job.fileName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {job.type} import
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(job.status)}
                      {job.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeJob(job.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === 'running' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} />
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Records</p>
                      <p className="font-medium">
                        {job.recordsProcessed.toLocaleString()} / {job.totalRecords.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(job.startTime, job.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p className="font-medium">{job.startTime.toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {job.status === 'running' && 'In Progress'}
                        {job.status === 'completed' && 'Finished'}
                        {job.status === 'failed' && 'Error'}
                        {job.status === 'pending' && 'Waiting'}
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {job.errors.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">
                        Errors ({job.errors.length}):
                      </p>
                      <div className="space-y-1">
                        {job.errors.slice(0, 3).map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            • {error}
                          </p>
                        ))}
                        {job.errors.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            ... and {job.errors.length - 3} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {importJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{importJobs.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">
                  {importJobs.filter(job => job.status === 'running').length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {importJobs.filter(job => job.status === 'completed').length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {importJobs.filter(job => job.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportProgressTracker;