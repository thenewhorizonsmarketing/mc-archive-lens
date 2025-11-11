/**
 * Advanced Filter Components
 * 
 * Export all filter-related components for easy importing.
 */

export { AdvancedFilterPanel } from './AdvancedFilterPanel';
export type { AdvancedFilterPanelProps, FilterCategory, FilterCategoryOption } from './AdvancedFilterPanel';

export { FilterOption } from './FilterOption';
export type { FilterOptionProps } from './FilterOption';

export { 
  ResultCountBadge, 
  AutoUpdateResultCountBadge,
  ResultCountBadges 
} from './ResultCountBadge';
export type { 
  ResultCountBadgeProps, 
  AutoUpdateResultCountBadgeProps,
  ResultCountBadgesProps 
} from './ResultCountBadge';

export { SmartSearchInput } from './SmartSearchInput';
export type { SmartSearchInputProps } from './SmartSearchInput';

export { SuggestionsDropdown } from './SuggestionsDropdown';
export type { SuggestionsDropdownProps } from './SuggestionsDropdown';

export { SmartSearchExample } from './SmartSearchExample';

// Re-export styled components
export * from './styled';
