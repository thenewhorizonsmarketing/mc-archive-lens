// Data Statistics Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Camera, 
  UserSquare, 
  TrendingUp, 
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { EnhancedSearchManager } from '@/lib/database/enhanced-search-manager';

interface DataStatisticsProps {
  searchManager: EnhancedSearchManager | null;
}

interface TableStats {
  name: string;
  icon: React.ReactNode;
  totalRecords: number;
  recentlyAdded: number;
  lastUpdated: Date;
  growth: number; // percentage
}

interface SearchStats {
  totalSearches: number;
  averageResponseTime: number;
  popularTerms: { term: string; count: number }[];
  searchesByType: { type: string; count: number }[];
}

export const DataStatistics: React.FC<DataStatisticsProps> = ({
  searchManager
}) => {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load statistics
  useEffect(() => {
    loadStatistics();
  }, [searchManager]);

  const loadStatistics = async () => {
    setIsLoading(true);
    
    // Mock table statistics
    const mockTableStats: TableStats[] = [
      {
        name: 'Alumni',
        icon: <Users className="h-5 w-5 text-blue-500" />,
        totalRecords: 2450,
        recentlyAdded: 125,
        lastUpdated: new Date('2024-01-15T10:30:00'),
        growth: 5.4
      },
      {
        name: 'Publications',
        icon: <FileText className="h-5 w-5 text-green-500" />,
        totalRecords: 1680,
        recentlyAdded: 45,
        lastUpdated: new Date('2024-01-12T14:20:00'),
        growth: 2.8
      },
      {
        name: 'Photos',
        icon: <Camera className="h-5 w-5 text-purple-500" />,
        totalRecords: 890,
        recentlyAdded: 67,
        lastUpdated: new Date('2024-01-10T09:15:00'),
        growth: 8.1
      },
      {
        name: 'Faculty',
        icon: <UserSquare className="h-5 w-5 text-orange-500" />,
        totalRecords: 156,
        recentlyAdded: 3,
        lastUpdated: new Date('2024-01-08T16:45:00'),
        growth: 1.9
      }
    ];

    // Mock search statistics
    const mockSearchStats: SearchStats = {
      totalSearches: 15420,
      averageResponseTime: 23.5,
      popularTerms: [
        { term: 'graduation', count: 1250 },
        { term: 'law review', count: 890 },
        { term: 'class of 1995', count: 675 },
        { term: 'faculty', count: 540 },
        { term: 'amicus', count: 420 }
      ],
      searchesByType: [
        { type: 'alumni', count: 6800 },
        { type: 'publications', count: 4200 },
        { type: 'photos', count: 2900 },
        { type: 'faculty', count: 1520 }
      ]
    };

    // Simulate loading delay
    setTimeout(() => {
      setTableStats(mockTableStats);
      setSearchStats(mockSearchStats);
      setIsLoading(false);
      setLastRefresh(new Date());
    }, 1000);
  };

  // Get growth indicator
  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span className="text-sm">+{growth}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500">
        <span className="text-sm">0%</span>
      </div>
    );
  };

  // Calculate total records
  const totalRecords = tableStats.reduce((sum, stat) => sum + stat.totalRecords, 0);
  const totalRecentlyAdded = tableStats.reduce((sum, stat) => sum + stat.recentlyAdded, 0);

  return (
    <div className="data-statistics space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Statistics</h2>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadStatistics}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recently Added</p>
                <p className="text-3xl font-bold">{totalRecentlyAdded}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-3xl font-bold">
                  {searchStats?.totalSearches.toLocaleString() || '0'}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold">
                  {searchStats?.averageResponseTime || 0}ms
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Data by Table</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tableStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {stat.icon}
                  <div>
                    <h4 className="font-medium">{stat.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {stat.lastUpdated.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stat.totalRecords.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">+{stat.recentlyAdded}</p>
                    <p className="text-xs text-muted-foreground">Recent</p>
                  </div>
                  
                  <div className="text-center">
                    {getGrowthIndicator(stat.growth)}
                    <p className="text-xs text-muted-foreground">Growth</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Statistics */}
      {searchStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Search Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Popular Search Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchStats.popularTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{term.term}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(term.count / searchStats.popularTerms[0].count) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {term.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Searches by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Searches by Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchStats.searchesByType.map((type, index) => {
                  const percentage = (type.count / searchStats.totalSearches) * 100;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${colors[index]}`} />
                        <span className="font-medium capitalize">{type.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[index]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataStatistics;