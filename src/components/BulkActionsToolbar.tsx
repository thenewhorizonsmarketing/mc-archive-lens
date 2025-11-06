import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Table2, 
  Download, 
  Trash2, 
  X, 
  Tag, 
  Calendar,
  UserCog,
  Image as ImageIcon
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

interface BulkActionsToolbarProps {
  selectedCount: number;
  roles: string[];
  onBulkSetRole: (role: string) => void;
  onBulkSetYear: (year: number) => void;
  onBulkAddTags: (tags: string[]) => void;
  onBulkRemoveTags: (tags: string[]) => void;
  onBulkClearPhotos: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onOpenSpreadsheet: () => void;
  onExport: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  roles,
  onBulkSetRole,
  onBulkSetYear,
  onBulkAddTags,
  onBulkRemoveTags,
  onBulkClearPhotos,
  onBulkDelete,
  onClearSelection,
  onOpenSpreadsheet,
  onExport
}: BulkActionsToolbarProps) {
  const [yearInput, setYearInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const handleSetYear = () => {
    const year = parseInt(yearInput);
    if (!isNaN(year) && year >= 1900 && year <= 2030) {
      onBulkSetYear(year);
      setYearInput("");
    }
  };

  const handleAddTags = () => {
    if (tagInput.trim()) {
      const tags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      onBulkAddTags(tags);
      setTagInput("");
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-base px-4 py-2">
            {selectedCount} selected
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Set Role */}
          <Select onValueChange={onBulkSetRole}>
            <SelectTrigger className="w-[180px] h-9">
              <UserCog className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Set Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Clear Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Change Year */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Change Year
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <label className="text-sm font-medium">Graduation Year</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="e.g. 1985"
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetYear()}
                    min={1900}
                    max={2030}
                  />
                  <Button onClick={handleSetYear} size="sm">Set</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Add Tags */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="tag1, tag2, tag3"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTags()}
                  />
                  <Button onClick={handleAddTags} size="sm">Add</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Photos */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBulkClearPhotos}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Clear Photos
          </Button>

          {/* Delete */}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onBulkDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={onOpenSpreadsheet}
          >
            <Table2 className="w-4 h-4 mr-2" />
            Spreadsheet Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
