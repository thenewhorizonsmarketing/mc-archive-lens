import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DecadeFilter } from "./DecadeFilter";
import { X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AdvancedFiltersProps {
  // Mode
  filterMode: 'decade' | 'year';
  onFilterModeChange: (mode: 'decade' | 'year') => void;
  
  // Decade filtering
  decades: string[];
  selectedDecade: string | null;
  onSelectDecade: (decade: string | null) => void;
  
  // Year filtering
  years: number[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
  
  // Role filtering
  roles: string[];
  selectedRole: string | null;
  onSelectRole: (role: string | null) => void;
  showOnlyLeadership: boolean;
  onToggleLeadership: (value: boolean) => void;
  
  // Additional filters
  showOnlyWithPhotos: boolean;
  onTogglePhotos: (value: boolean) => void;
  
  // Clear all
  onClearAll: () => void;
}

export function AdvancedFilters({
  filterMode,
  onFilterModeChange,
  decades,
  selectedDecade,
  onSelectDecade,
  years,
  selectedYear,
  onSelectYear,
  roles,
  selectedRole,
  onSelectRole,
  showOnlyLeadership,
  onToggleLeadership,
  showOnlyWithPhotos,
  onTogglePhotos,
  onClearAll,
}: AdvancedFiltersProps) {
  const activeFilterCount = [
    selectedDecade,
    selectedYear,
    selectedRole,
    showOnlyLeadership,
    showOnlyWithPhotos,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Year/Decade Mode Toggle */}
      <div>
        <h3 className="text-sm font-medium mb-3">Time Period</h3>
        <div className="flex gap-3 mb-4">
          <Button
            variant={filterMode === 'decade' ? 'kiosk' : 'outline'}
            size="touch"
            onClick={() => onFilterModeChange('decade')}
          >
            By Decade
          </Button>
          <Button
            variant={filterMode === 'year' ? 'kiosk' : 'outline'}
            size="touch"
            onClick={() => onFilterModeChange('year')}
          >
            By Year
          </Button>
        </div>

        {/* Show appropriate filter based on mode */}
        {filterMode === 'decade' ? (
          <DecadeFilter
            decades={decades}
            selectedDecade={selectedDecade}
            onSelectDecade={onSelectDecade}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedYear === null ? 'kiosk' : 'outline'}
              size="touch"
              onClick={() => onSelectYear(null)}
            >
              All Years
            </Button>
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? 'kiosk' : 'outline'}
                size="touch"
                onClick={() => onSelectYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Role Filters */}
      <div>
        <h3 className="text-sm font-medium mb-3">Leadership Role</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            variant={!showOnlyLeadership && !selectedRole ? 'kiosk' : 'outline'}
            size="touch"
            onClick={() => {
              onToggleLeadership(false);
              onSelectRole(null);
            }}
          >
            All Alumni
          </Button>
          <Button
            variant={showOnlyLeadership && !selectedRole ? 'kiosk' : 'outline'}
            size="touch"
            onClick={() => {
              onToggleLeadership(true);
              onSelectRole(null);
            }}
          >
            Any Leadership
          </Button>
        </div>

        {roles.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Specific Role</label>
            <Select value={selectedRole || 'none'} onValueChange={(value) => {
              if (value === 'none') {
                onSelectRole(null);
              } else {
                onSelectRole(value);
                onToggleLeadership(false);
              }
            }}>
              <SelectTrigger className="h-14 text-base">
                <SelectValue placeholder="Select a specific role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific role</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Additional Filters */}
      <div>
        <h3 className="text-sm font-medium mb-3">Additional Filters</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={showOnlyWithPhotos ? 'kiosk' : 'outline'}
            size="touch"
            onClick={() => onTogglePhotos(!showOnlyWithPhotos)}
          >
            {showOnlyWithPhotos ? '✓ ' : ''}With Photos
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDecade && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                Decade: {selectedDecade}
                <button
                  onClick={() => onSelectDecade(null)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedYear && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                Year: {selectedYear}
                <button
                  onClick={() => onSelectYear(null)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedRole && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                Role: {selectedRole}
                <button
                  onClick={() => onSelectRole(null)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {showOnlyLeadership && !selectedRole && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                Any Leadership Role
                <button
                  onClick={() => onToggleLeadership(false)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {showOnlyWithPhotos && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                With Photos
                <button
                  onClick={() => onTogglePhotos(false)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
