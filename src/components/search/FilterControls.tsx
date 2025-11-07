// Filter Controls Component
import React, { useState, useCallback } from 'react';
import { X, Calendar, BookOpen, Building, Camera, Tag, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SearchFilters, YearRange } from '@/lib/database/types';
import { FilterProcessor, FilterOptions } from '@/lib/database/filter-processor';

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
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onChange,
  availableOptions,
  className = ""
}) => {
  const [yearRange, setYearRange] = useState<[number, number]>([
    filters.yearRange?.start || 1950,
    filters.yearRange?.end || new Date().getFullYear()
  ]);

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