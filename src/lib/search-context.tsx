// Search Context for Global Search Management
import React, { createContext, useContext, useEffect, useState } from 'react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';
import { DatabaseManager } from '@/lib/database/manager';

interface SearchContextType {
  searchManager: EnhancedSearchManager | null;
  isInitialized: boolean;
  error: string | null;
  recoveryStatus: {
    hasError: boolean;
    errorType?: string;
    canRecover: boolean;
    recoveryActions: string[];
    isRecovering: boolean;
  };
}

const SearchContext = createContext<SearchContextType>({
  searchManager: null,
  isInitialized: false,
  error: null,
  recoveryStatus: {
    hasError: false,
    canRecover: false,
    recoveryActions: [],
    isRecovering: false
  }
});

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchManager, setSearchManager] = useState<EnhancedSearchManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState({
    hasError: false,
    canRecover: false,
    recoveryActions: [],
    isRecovering: false
  });

  useEffect(() => {
    const initializeSearch = async () => {
      try {
        // Initialize database manager
        const dbManager = new DatabaseManager();
        await dbManager.initialize();

        // Create enhanced search manager with recovery options
        const searchMgr = new EnhancedSearchManager(dbManager, {
          enableFallback: true,
          autoRebuildIndex: true,
          maxRetries: 3,
          retryDelay: 1000
        });
        
        // Test the connection with a simple search
        await searchMgr.searchAll('test', {}, { limit: 1 });
        
        setSearchManager(searchMgr);
        setIsInitialized(true);
        setError(null);
        setRecoveryStatus({
          hasError: false,
          canRecover: false,
          recoveryActions: [],
          isRecovering: false
        });
      } catch (err) {
        console.error('Failed to initialize search:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize search');
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        
        // Set recovery status if we have an enhanced search manager
        if (searchManager) {
          setRecoveryStatus(searchManager.getRecoveryStatus());
        }
      }
    };

    initializeSearch();
  }, []);

  // Update recovery status periodically if there's an active search manager
  useEffect(() => {
    if (!searchManager) return;

    const updateRecoveryStatus = () => {
      setRecoveryStatus(searchManager.getRecoveryStatus());
    };

    const interval = setInterval(updateRecoveryStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [searchManager]);

  return (
    <SearchContext.Provider value={{ searchManager, isInitialized, error, recoveryStatus }}>
      {children}
    </SearchContext.Provider>
  );
};