// Search Context for Global Search Management
import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserSearchManager } from '@/lib/database/browser-search-manager';
import { BrowserDatabaseManager } from '@/lib/database/browser-database-manager';

interface SearchContextType {
  searchManager: BrowserSearchManager | null;
  isInitialized: boolean;
  error: string | null;
  healthStatus: {
    isHealthy: boolean;
    message: string;
    lastCheck: Date;
  };
  errorRecoveryState: {
    hasError: boolean;
    errorType?: string;
    canRecover: boolean;
    recoveryActions: string[];
    isRecovering: boolean;
  };
  attemptRecovery: () => Promise<boolean>;
}

const SearchContext = createContext<SearchContextType>({
  searchManager: null,
  isInitialized: false,
  error: null,
  healthStatus: {
    isHealthy: true,
    message: 'Not initialized',
    lastCheck: new Date()
  },
  errorRecoveryState: {
    hasError: false,
    canRecover: false,
    recoveryActions: [],
    isRecovering: false
  },
  attemptRecovery: async () => false
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
  const [searchManager, setSearchManager] = useState<BrowserSearchManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState({
    isHealthy: true,
    message: 'Initializing...',
    lastCheck: new Date()
  });
  const [errorRecoveryState, setErrorRecoveryState] = useState({
    hasError: false,
    canRecover: false,
    recoveryActions: [],
    isRecovering: false
  });

  useEffect(() => {
    const initializeSearch = async () => {
      try {
        // Initialize browser-compatible database manager
        const dbManager = new BrowserDatabaseManager();
        await dbManager.initialize();

        // Create browser search manager
        const searchMgr = new BrowserSearchManager(dbManager);
        await searchMgr.initialize();
        
        // Test the connection with a simple search
        await searchMgr.searchAll('test', {}, { limit: 1 });
        
        setSearchManager(searchMgr);
        setIsInitialized(true);
        setError(null);
        
        // Perform health check
        const health = await searchMgr.healthCheck();
        setHealthStatus({
          ...health,
          lastCheck: new Date()
        });
      } catch (err) {
        console.error('Failed to initialize search:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize search');
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        
        setHealthStatus({
          isHealthy: false,
          message: err instanceof Error ? err.message : 'Initialization failed',
          lastCheck: new Date()
        });
      }
    };

    initializeSearch();
  }, []);

  // Update health status and error recovery state periodically
  useEffect(() => {
    if (!searchManager) return;

    const updateStatus = async () => {
      try {
        const health = await searchManager.healthCheck();
        setHealthStatus({
          ...health,
          lastCheck: new Date()
        });

        // Update error recovery state
        const recoveryState = searchManager.getErrorRecoveryState();
        setErrorRecoveryState({
          hasError: recoveryState.hasError,
          errorType: recoveryState.errorType,
          canRecover: recoveryState.canRecover,
          recoveryActions: recoveryState.recoveryActions,
          isRecovering: recoveryState.isRecovering
        });
      } catch (err) {
        setHealthStatus({
          isHealthy: false,
          message: err instanceof Error ? err.message : 'Health check failed',
          lastCheck: new Date()
        });
      }
    };

    const interval = setInterval(updateStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [searchManager]);

  // Recovery function
  const attemptRecovery = async (): Promise<boolean> => {
    if (!searchManager) return false;
    
    try {
      const success = await searchManager.attemptAutoRecovery();
      if (success) {
        setError(null);
        setHealthStatus({
          isHealthy: true,
          message: 'Recovery successful',
          lastCheck: new Date()
        });
      }
      return success;
    } catch (err) {
      console.error('Recovery attempt failed:', err);
      return false;
    }
  };

  return (
    <SearchContext.Provider value={{ 
      searchManager, 
      isInitialized, 
      error, 
      healthStatus, 
      errorRecoveryState,
      attemptRecovery
    }}>
      {children}
    </SearchContext.Provider>
  );
};