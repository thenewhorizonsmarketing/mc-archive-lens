import { useState, useEffect, useMemo } from "react";
import { AlumniRecord } from "@/types";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { validateBulkChanges } from "@/lib/batchEditValidator";
import { exportAlumniToCSV, exportChangesOnly } from "@/lib/csvExporter";
import { EditableCell } from "./EditableCell";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { 
  Save, 
  X, 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlumniBatchEditorProps {
  open: boolean;
  onClose: () => void;
  selectedRecords: Set<string>;
  alumniData: AlumniRecord[];
  roles: string[];
  onSave: (changes: Map<string, Partial<AlumniRecord>>) => void;
}

type SortColumn = 'full_name' | 'class_role' | 'grad_year' | 'grad_date' | 'photo_file';
type SortDirection = 'asc' | 'desc' | null;

interface ColumnFilters {
  full_name: string;
  class_role: string;
  grad_year: string;
  grad_date: string;
  photo_file: string;
}

export function AlumniBatchEditor({
  open,
  onClose,
  selectedRecords,
  alumniData,
  roles,
  onSave
}: AlumniBatchEditorProps) {
  const [editMode, setEditMode] = useState(true);
  const [localChanges, setLocalChanges] = useState<Map<string, Partial<AlumniRecord>>>(new Map());
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filtering state
  const [filters, setFilters] = useState<ColumnFilters>({
    full_name: '',
    class_role: '',
    grad_year: '',
    grad_date: '',
    photo_file: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    state: undoableChanges, 
    set: setUndoableChanges, 
    undo, 
    redo, 
    reset,
    canUndo, 
    canRedo 
  } = useUndoRedo<Map<string, Partial<AlumniRecord>>>(new Map());

  // Sync local changes with undo/redo state
  useEffect(() => {
    setLocalChanges(undoableChanges);
  }, [undoableChanges]);

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (column: keyof ColumnFilters, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      full_name: '',
      class_role: '',
      grad_year: '',
      grad_date: '',
      photo_file: ''
    });
  };

  // Get records to display with filtering and sorting
  const displayRecords = useMemo(() => {
    let records = alumniData.filter(a => selectedRecords.has(a.id));
    
    // Apply filters
    if (filters.full_name) {
      records = records.filter(r => 
        getCurrentValue(r, 'full_name').toLowerCase().includes(filters.full_name.toLowerCase())
      );
    }
    if (filters.class_role) {
      records = records.filter(r => {
        const role = getCurrentValue(r, 'class_role') || '';
        return role.toLowerCase().includes(filters.class_role.toLowerCase());
      });
    }
    if (filters.grad_year) {
      records = records.filter(r => 
        getCurrentValue(r, 'grad_year').toString().includes(filters.grad_year)
      );
    }
    if (filters.grad_date) {
      records = records.filter(r => 
        getCurrentValue(r, 'grad_date').toLowerCase().includes(filters.grad_date.toLowerCase())
      );
    }
    if (filters.photo_file) {
      records = records.filter(r => {
        const photo = getCurrentValue(r, 'photo_file') || '';
        return photo.toLowerCase().includes(filters.photo_file.toLowerCase());
      });
    }
    
    // Apply sorting
    if (sortColumn && sortDirection) {
      records.sort((a, b) => {
        const aVal = getCurrentValue(a, sortColumn);
        const bVal = getCurrentValue(b, sortColumn);
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          const aStr = String(aVal || '').toLowerCase();
          const bStr = String(bVal || '').toLowerCase();
          comparison = aStr.localeCompare(bStr);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return records;
  }, [alumniData, selectedRecords, filters, sortColumn, sortDirection, localChanges]);

  // Validation
  const validation = useMemo(() => {
    return validateBulkChanges(localChanges, alumniData);
  }, [localChanges, alumniData]);

  // Handle cell change
  const handleCellChange = (recordId: string, field: keyof AlumniRecord, value: any) => {
    const newChanges = new Map(localChanges);
    const existing = newChanges.get(recordId) || {};
    
    // Special handling for full_name - update first/last name
    if (field === 'full_name') {
      const parts = value.split(' ');
      existing.first_name = parts[0] || '';
      existing.last_name = parts[parts.length - 1] || '';
      existing.full_name = value;
    } else {
      (existing as any)[field] = value;
    }
    
    // Update decade if year changes
    if (field === 'grad_year') {
      existing.decade = `${Math.floor(value / 10) * 10}s`;
    }
    
    newChanges.set(recordId, existing);
    setUndoableChanges(newChanges);
  };

  // Get current value (with changes applied)
  const getCurrentValue = (record: AlumniRecord, field: keyof AlumniRecord) => {
    const changes = localChanges.get(record.id);
    return changes && field in changes ? (changes as any)[field] : record[field];
  };

  // Check if field is modified
  const isModified = (recordId: string, field: keyof AlumniRecord): boolean => {
    const changes = localChanges.get(recordId);
    return changes ? field in changes : false;
  };

  // Handle save
  const handleSave = () => {
    if (!validation.valid) {
      toast.error(`Cannot save: ${validation.issues.length} validation errors`);
      return;
    }

    onSave(localChanges);
    toast.success(`Successfully updated ${localChanges.size} records`);
    handleClose();
  };

  // Handle export
  const handleExport = () => {
    // Apply changes to data
    const updatedData = alumniData.map(record => {
      const changes = localChanges.get(record.id);
      return changes ? { ...record, ...changes } : record;
    });
    exportAlumniToCSV(updatedData, 'alumni-batch-edited.csv');
    toast.success('Exported updated data to CSV');
  };

  // Handle export changes only
  const handleExportChanges = () => {
    exportChangesOnly(alumniData, localChanges);
    toast.success('Exported changes to CSV');
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (localChanges.size > 0) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    reset();
    setLocalChanges(new Map());
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, localChanges, canUndo, canRedo]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Batch Editor</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Editing {displayRecords.length} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportChanges} disabled={localChanges.size === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export Changes
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <Button variant="outline" size="sm" onClick={() => reset()} disabled={!canUndo}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} disabled={!validation.valid}>
                <Save className="w-4 h-4 mr-2" />
                Save All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span>Showing: <strong>{displayRecords.length}</strong> of <strong>{selectedRecords.size}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span>Changes: <strong>{localChanges.size}</strong></span>
            </div>
            {validation.valid ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span><strong>{validation.issues.length}</strong> errors</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7"
            >
              <Filter className="w-4 h-4 mr-1" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            {Object.values(filters).some(f => f) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-destructive hover:text-destructive"
              >
                Clear Filters
              </Button>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            Ctrl+S save • Ctrl+Z undo • Ctrl+Y redo
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="h-[calc(95vh-200px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {/* Column Headers with Sort */}
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-accent"
                    onClick={() => handleSort('full_name')}
                  >
                    Name
                    {sortColumn === 'full_name' && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      )
                    )}
                    {sortColumn !== 'full_name' && (
                      <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[150px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-accent"
                    onClick={() => handleSort('class_role')}
                  >
                    Role
                    {sortColumn === 'class_role' && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      )
                    )}
                    {sortColumn !== 'class_role' && (
                      <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-accent"
                    onClick={() => handleSort('grad_year')}
                  >
                    Year
                    {sortColumn === 'grad_year' && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      )
                    )}
                    {sortColumn !== 'grad_year' && (
                      <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-accent"
                    onClick={() => handleSort('grad_date')}
                  >
                    Grad Date
                    {sortColumn === 'grad_date' && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      )
                    )}
                    {sortColumn !== 'grad_date' && (
                      <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-accent"
                    onClick={() => handleSort('photo_file')}
                  >
                    Photo File
                    {sortColumn === 'photo_file' && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 ml-1" />
                      )
                    )}
                    {sortColumn !== 'photo_file' && (
                      <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">Tags</TableHead>
              </TableRow>
              
              {/* Filter Row */}
              {showFilters && (
                <TableRow className="border-b-2">
                  <TableHead className="p-1"></TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters.full_name}
                      onChange={(e) => handleFilterChange('full_name', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters.class_role}
                      onChange={(e) => handleFilterChange('class_role', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters.grad_year}
                      onChange={(e) => handleFilterChange('grad_year', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters.grad_date}
                      onChange={(e) => handleFilterChange('grad_date', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={filters.photo_file}
                      onChange={(e) => handleFilterChange('photo_file', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="p-1"></TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {displayRecords.map((record, index) => (
                <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'full_name')}
                      type="text"
                      onChange={(val) => handleCellChange(record.id, 'full_name', val)}
                      isModified={isModified(record.id, 'full_name')}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'class_role') || ''}
                      type="select"
                      options={roles}
                      onChange={(val) => handleCellChange(record.id, 'class_role', val)}
                      isModified={isModified(record.id, 'class_role')}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'grad_year')}
                      type="number"
                      onChange={(val) => handleCellChange(record.id, 'grad_year', val)}
                      isModified={isModified(record.id, 'grad_year')}
                      validation={(val) => {
                        const year = parseInt(val);
                        if (isNaN(year) || year < 1900 || year > 2030) {
                          return 'Invalid year';
                        }
                        return null;
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'grad_date')}
                      type="text"
                      onChange={(val) => handleCellChange(record.id, 'grad_date', val)}
                      isModified={isModified(record.id, 'grad_date')}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'photo_file') || ''}
                      type="text"
                      onChange={(val) => handleCellChange(record.id, 'photo_file', val)}
                      isModified={isModified(record.id, 'photo_file')}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={getCurrentValue(record, 'tags')}
                      type="tags"
                      onChange={(val) => handleCellChange(record.id, 'tags', val)}
                      isModified={isModified(record.id, 'tags')}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Validation Errors */}
        {!validation.valid && validation.issues.length > 0 && (
          <div className="p-4 border-t bg-destructive/5">
            <div className="text-sm font-medium text-destructive mb-2">Validation Errors:</div>
            <div className="space-y-1 text-xs max-h-20 overflow-y-auto">
              {validation.issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="text-muted-foreground">
                  • {issue.field}: {issue.message}
                </div>
              ))}
              {validation.issues.length > 10 && (
                <div className="text-muted-foreground italic">
                  ...and {validation.issues.length - 10} more errors
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
