// Filter Controls Component
import React, { useState, useCallback, useRef } from 'react';
import { Calendar, BookOpen, Building, Camera, Tag, RotateCcw, User, Keyboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { YearRange } from '@/lib/database/types';
import { FilterProcessor, FilterOptions } from '@/lib/database/filter-processor';
import { OnScreenKeyboard } from './OnScreenKeyboard';

export interface FilterControlsProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableOptions?: {
    yearRanges: YearRange[];
    publicationTypes: string[];
    departments: string[];
    decades: string[];
    collections: string[];
    roles: string[];
    tags: string[];
  };
  className?: string;
  showKeyboard?: boolean;
  keyboardPosition?: 'below' | 'floating';
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onChange,
  availableOptions,
  className = "",
  showKeyboard = false,
  keyboardPosition = 'below'
}) => {
  const [yearRange, setYearRange] = useState<[number, number]>([
    filters.yearRange?.start || 1950,
    filters.yearRange?.end || new Date().getFullYear()
  ]);
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Handle year range change
  const handleYearRangeChange = useCallback((values: number[]) => {
    const [start, end] = values;
    setYearRange([start, end]);
    onChange({
      ...filters,
      yearRange: { start, end }
    });
  }, [filters, onChange]);

  // Handle publication type change
  const handlePublicationTypeChange = useCallback((value: string) => {
    onChange({
      ...filters,
      publicationType: value === 'all' ? undefined : value
    });
  }, [filters, onChange]);

  // Handle department change
  const handleDepartmentChange = useCallback((value: string) => {
    onChange({
      ...filters,
      department: value === 'all' ? undefined : value
    });
  }, [filters, onChange]);

  // Handle decade change
  const handleDecadeChange = useCallback((value: string) => {
    onChange({
      ...filters,
      decade: value === 'all' ? undefined : value
    });
  }, [filters, onChange]);

  // Handle collection change
  const handleCollectionChange = useCallback((value: string) => {
    onChange({
      ...filters,
      collection: value === 'all' ? undefined : value
    });
  }, [filters, onChange]);

  // Handle role change
  const handleRoleChange = useCallback((value: string) => {
    onChange({
      ...filters,
      role: value === 'all' ? undefined : value
    });
  }, [filters, onChange]);

  // Handle tag toggle
  const handleTagToggle = useCallback((tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    
    onChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  }, [filters, onChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setYearRange([1950, new Date().getFullYear()]);
    onChange({});
  }, [onChange]);

  // Remove specific filter
  const handleRemoveFilter = useCallback((filterKey: keyof FilterOptions) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    
    if (filterKey === 'yearRange') {
      setYearRange([1950, new Date().getFullYear()]);
    }
    
    onChange(newFilters);
  }, [filters, onChange]);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Get filter summary
  const filterSummary = FilterProcessor.createFilterSummary(filters);

  // Keyboard handlers
  const handleKeyboardKey = useCallback((key: string) => {
    const currentValue = filters.name || '';
    
    if (key === 'Backspace') {
      const newValue = currentValue.slice(0, -1);
      onChange({
        ...filters,
        name: newValue || undefined
      });
    } else if (key === 'Enter') {
      // Enter key - just close keyboard
      setKeyboardVisible(false);
      nameInputRef.current?.blur();
    } else if (key === 'Tab' || key === 'Ctrl' || key === 'Alt') {
      // Ignore modifier keys
      return;
    } else {
      // Regular character
      const newValue = currentValue + key;
      onChange({
        ...filters,
        name: newValue
      });
    }
  }, [filters, onChange]);

  const handleNameInputFocus = useCallback(() => {
    if (showKeyboard) {
      setKeyboardVisible(true);
    }
  }, [showKeyboard]);

  const handleHideKeyboard = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  return (
    <Card className={`filter-controls ${className}`} role="region" aria-label="Search filters">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filterSummary.map((summary, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1 pr-1"
                >
                  <span className="text-xs">{summary}</span>
                </Badge>
              ))}
            </div>
            <Separator className="mt-4" />
          </div>
        )}

        {/* Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Content Type</span>
          </Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) => onChange({
              ...filters,
              type: value === 'all' ? undefined : value as any
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="publication">Publications</SelectItem>
              <SelectItem value="photo">Photos</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Name Filter (for Alumni/Faculty) */}
        {(!filters.type || filters.type === 'alumni' || filters.type === 'faculty') && (
          <>
            <div>
              <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Name Search</span>
                {showKeyboard && keyboardVisible && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    <Keyboard className="h-3 w-3 mr-1" />
                    Keyboard Active
                  </Badge>
                )}
              </Label>
              <Input
                ref={nameInputRef}
                type="text"
                placeholder="Search by name..."
                value={filters.name || ''}
                onChange={(e) => onChange({
                  ...filters,
                  name: e.target.value || undefined
                })}
                onFocus={handleNameInputFocus}
                className="w-full"
                aria-label="Filter by name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Filter by first name, last name, or full name
              </p>
              
              {/* On-Screen Keyboard */}
              {showKeyboard && keyboardVisible && (
                <div className={`mt-4 ${keyboardPosition === 'floating' ? 'fixed bottom-4 left-4 right-4 z-50' : ''}`}>
                  <OnScreenKeyboard
                    onKeyPress={handleKeyboardKey}
                    className="shadow-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHideKeyboard}
                    className="mt-2 w-full"
                  >
                    Hide Keyboard
                  </Button>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Year Range Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Year Range</span>
          </Label>
          <div className="px-3">
            <Slider
              value={yearRange}
              onValueChange={handleYearRangeChange}
              min={1950}
              max={new Date().getFullYear()}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Publication Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Publication Type</span>
          </Label>
          <Select
            value={filters.publicationType || 'all'}
            onValueChange={handlePublicationTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All publication types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableOptions?.publicationTypes?.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              )) || [
                <SelectItem key="journal" value="journal">Journal Article</SelectItem>,
                <SelectItem key="conference" value="conference">Conference Paper</SelectItem>,
                <SelectItem key="book" value="book">Book</SelectItem>,
                <SelectItem key="thesis" value="thesis">Thesis</SelectItem>,
                <SelectItem key="report" value="report">Technical Report</SelectItem>
              ]}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Department Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Department</span>
          </Label>
          <Select
            value={filters.department || 'all'}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableOptions?.departments?.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              )) || [
                <SelectItem key="cs" value="Computer Science">Computer Science</SelectItem>,
                <SelectItem key="ee" value="Electrical Engineering">Electrical Engineering</SelectItem>,
                <SelectItem key="me" value="Mechanical Engineering">Mechanical Engineering</SelectItem>,
                <SelectItem key="math" value="Mathematics">Mathematics</SelectItem>,
                <SelectItem key="physics" value="Physics">Physics</SelectItem>
              ]}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Decade Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Decade</span>
          </Label>
          <Select
            value={filters.decade || 'all'}
            onValueChange={handleDecadeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All decades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decades</SelectItem>
              {availableOptions?.decades?.map((decade) => (
                <SelectItem key={decade} value={decade}>
                  {decade}s
                </SelectItem>
              )) || [
                <SelectItem key="2020" value="2020">2020s</SelectItem>,
                <SelectItem key="2010" value="2010">2010s</SelectItem>,
                <SelectItem key="2000" value="2000">2000s</SelectItem>,
                <SelectItem key="1990" value="1990">1990s</SelectItem>,
                <SelectItem key="1980" value="1980">1980s</SelectItem>,
                <SelectItem key="1970" value="1970">1970s</SelectItem>
              ]}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Collection Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Collection</span>
          </Label>
          <Select
            value={filters.collection || 'all'}
            onValueChange={handleCollectionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              {availableOptions?.collections?.map((collection) => (
                <SelectItem key={collection} value={collection}>
                  {collection}
                </SelectItem>
              )) || [
                <SelectItem key="graduation" value="Graduation Photos">Graduation Photos</SelectItem>,
                <SelectItem key="events" value="Campus Events">Campus Events</SelectItem>,
                <SelectItem key="research" value="Research Labs">Research Labs</SelectItem>,
                <SelectItem key="historical" value="Historical Archives">Historical Archives</SelectItem>
              ]}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Role Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Role</span>
          </Label>
          <Select
            value={filters.role || 'all'}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {availableOptions?.roles?.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              )) || [
                <SelectItem key="student" value="Student">Student</SelectItem>,
                <SelectItem key="faculty" value="Faculty">Faculty</SelectItem>,
                <SelectItem key="staff" value="Staff">Staff</SelectItem>,
                <SelectItem key="alumni" value="Alumni">Alumni</SelectItem>,
                <SelectItem key="researcher" value="Researcher">Researcher</SelectItem>
              ]}
            </SelectContent>
          </Select>
        </div>

        {/* Tags Filter */}
        {availableOptions?.tags && availableOptions.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableOptions.tags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags?.includes(tag) || false}
                      onCheckedChange={(checked) => handleTagToggle(tag, checked as boolean)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterControls;