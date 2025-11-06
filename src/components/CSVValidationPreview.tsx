import { ValidationReport } from "@/lib/csvValidator";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Image as ImageIcon,
  AlertCircle,
  FileWarning
} from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface CSVValidationPreviewProps {
  report: ValidationReport;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CSVValidationPreview({ 
  report, 
  fileName, 
  onConfirm, 
  onCancel 
}: CSVValidationPreviewProps) {
  const errorCount = report.issues.filter(i => i.severity === 'error').length;
  const warningCount = report.issues.filter(i => i.severity === 'warning').length;

  return (
    <Card className="p-6 border-2">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">CSV Validation Report</h2>
            <p className="text-muted-foreground">{fileName}</p>
          </div>
          <Badge 
            variant={report.canProceed ? "default" : "destructive"}
            className="text-lg px-4 py-2"
          >
            {report.canProceed ? "Can Import" : "Cannot Import"}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                report.validRows === report.totalRows ? 'bg-green-500/10' : 'bg-yellow-500/10'
              }`}>
                <CheckCircle2 className={`w-5 h-5 ${
                  report.validRows === report.totalRows ? 'text-green-500' : 'text-yellow-500'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.validRows}</p>
                <p className="text-xs text-muted-foreground">Valid Rows</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                report.invalidRows === 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <XCircle className={`w-5 h-5 ${
                  report.invalidRows === 0 ? 'text-green-500' : 'text-red-500'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.invalidRows}</p>
                <p className="text-xs text-muted-foreground">Invalid Rows</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                report.duplicates.length === 0 ? 'bg-green-500/10' : 'bg-orange-500/10'
              }`}>
                <Users className={`w-5 h-5 ${
                  report.duplicates.length === 0 ? 'text-green-500' : 'text-orange-500'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.duplicates.length}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                report.photoPathIssues.length === 0 ? 'bg-green-500/10' : 'bg-blue-500/10'
              }`}>
                <ImageIcon className={`w-5 h-5 ${
                  report.photoPathIssues.length === 0 ? 'text-green-500' : 'text-blue-500'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{report.photoPathIssues.length}</p>
                <p className="text-xs text-muted-foreground">Photo Issues</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Issues */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">
              Errors {errorCount > 0 && `(${errorCount})`}
            </TabsTrigger>
            <TabsTrigger value="duplicates">
              Duplicates {report.duplicates.length > 0 && `(${report.duplicates.length})`}
            </TabsTrigger>
            <TabsTrigger value="photos">
              Photos {report.photoPathIssues.length > 0 && `(${report.photoPathIssues.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileWarning className="w-5 h-5" />
                Missing Required Fields
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Missing First Names:</span>
                  <span className="ml-2 font-semibold">{report.missingFields.first_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Missing Last Names:</span>
                  <span className="ml-2 font-semibold">{report.missingFields.last_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Missing Graduation Years:</span>
                  <span className="ml-2 font-semibold">{report.missingFields.grad_year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Missing Graduation Dates:</span>
                  <span className="ml-2 font-semibold">{report.missingFields.grad_date}</span>
                </div>
              </div>
            </Card>

            {!report.canProceed && (
              <Card className="p-4 bg-destructive/10 border-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">Cannot Import</h3>
                    <p className="text-sm text-muted-foreground">
                      More than 50% of rows contain critical errors. Please fix the CSV file and try again.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="errors">
            <ScrollArea className="h-[400px]">
              {report.issues.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No validation errors found!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {report.issues.map((issue, index) => (
                    <Card key={index} className={`p-3 ${
                      issue.severity === 'error' ? 'border-red-500/50 bg-red-500/5' : 'border-yellow-500/50 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-start gap-3">
                        {issue.severity === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            Row {issue.row} • {issue.field}
                          </p>
                          <p className="text-sm text-muted-foreground">{issue.issue}</p>
                          {issue.value && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                              Value: "{issue.value}"
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="duplicates">
            <ScrollArea className="h-[400px]">
              {report.duplicates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No duplicate entries found!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {report.duplicates.map((dup, index) => (
                    <Card key={index} className="p-3 border-orange-500/50 bg-orange-500/5">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            {dup.name} (Class of {dup.grad_year})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Found in rows: {dup.rows.join(', ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="photos">
            <ScrollArea className="h-[400px]">
              {report.photoPathIssues.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All photo paths look good!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {report.photoPathIssues.map((issue, index) => (
                    <Card key={index} className="p-3 border-blue-500/50 bg-blue-500/5">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Row {issue.row}</p>
                          <p className="text-sm text-muted-foreground mb-1">{issue.issue}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {issue.path}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="kiosk" 
          size="lg" 
          onClick={onConfirm}
          disabled={!report.canProceed}
        >
          {report.canProceed ? 'Import Data' : 'Fix Issues First'}
        </Button>
      </div>
    </Card>
  );
}
