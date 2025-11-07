// Admin Panel for Data Management
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Database, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Users, 
  Camera, 
  UserSquare,
  Settings,
  Home,
  Zap
} from 'lucide-react';
import { useSearch } from '@/lib/search-context';
import { CSVUploadInterface } from '@/components/admin/CSVUploadInterface';
import { ImportProgressTracker } from '@/components/admin/ImportProgressTracker';
import { DatabaseBackupRestore } from '@/components/admin/DatabaseBackupRestore';
import { SystemStatus } from '@/components/admin/SystemStatus';
import { DataStatistics } from '@/components/admin/DataStatistics';
import { ErrorRecovery } from '@/components/admin/ErrorRecovery';
import { PerformanceValidator } from '@/components/admin/PerformanceValidator';
import { TestRunner } from '@/components/admin/TestRunner';

interface AdminPanelProps {
  onNavigateHome: () => void;
}

export default function AdminPanel({ onNavigateHome }: AdminPanelProps) {
  const { searchManager, isInitialized, error } = useSearch();
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="admin-panel min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-xl text-muted-foreground">
              Data Management & System Administration
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={onNavigateHome}>
              <Home className="w-5 h-5 mr-2" />
              Back to Kiosk
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        {!isInitialized && (
          <Alert className="mb-6">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Initializing search system...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Search system error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Backup</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Status</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
            <TabsTrigger value="recovery" className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Recovery</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Testing</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Maintenance</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CSV Upload Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>CSV Data Upload</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CSVUploadInterface searchManager={searchManager} />
                </CardContent>
              </Card>

              {/* Import Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Import Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImportProgressTracker />
                </CardContent>
              </Card>
            </div>

            {/* Upload Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start space-x-3">
                    <Users className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Alumni Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload CSV with columns: full_name, class_year, role, tags
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-6 w-6 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Publications</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload CSV with: title, pub_name, issue_date, description
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Camera className="h-6 w-6 text-purple-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Photos</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload CSV with: title, collection, year_or_decade, caption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <UserSquare className="h-6 w-6 text-orange-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Faculty</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload CSV with: full_name, title, department, email
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Restore Tab */}
          <TabsContent value="backup" className="space-y-6">
            <DatabaseBackupRestore searchManager={searchManager} />
          </TabsContent>

          {/* System Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <SystemStatus searchManager={searchManager} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <DataStatistics searchManager={searchManager} />
          </TabsContent>

          {/* Error Recovery Tab */}
          <TabsContent value="recovery" className="space-y-6">
            <ErrorRecovery searchManager={searchManager} />
          </TabsContent>

          {/* Performance Validation Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceValidator searchManager={searchManager} />
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <TestRunner searchManager={searchManager} />
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5" />
                  <span>System Maintenance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span>Rebuild Search Index</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Database className="h-6 w-6 mb-2" />
                    <span>Optimize Database</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <CheckCircle className="h-6 w-6 mb-2" />
                    <span>Verify Data Integrity</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <AlertCircle className="h-6 w-6 mb-2" />
                    <span>View Error Logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}