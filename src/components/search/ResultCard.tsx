// Result Card Component for Grid View
import React from 'react';
import { ExternalLink, Calendar, User, FileText, Camera, GraduationCap, Users, MapPin, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/lib/database/types';

export interface ResultCardProps {
  result: SearchResult;
  onClick: () => void;
  highlightTerms: string[];
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onClick,
  highlightTerms,
  className = ""
}) => {
  // Highlight search terms in text
  const highlightText = (text: string) => {
    if (!highlightTerms.length) return text;
    
    let highlightedText = text;
    highlightTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Get type icon
  const getTypeIcon = () => {
    switch (result.type) {
      case 'alumni':
        return <GraduationCap className="h-4 w-4" />;
      case 'publication':
        return <FileText className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'faculty':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get type color
  const getTypeColor = () => {
    switch (result.type) {
      case 'alumni':
        return 'bg-blue-100 text-blue-800';
      case 'publication':
        return 'bg-green-100 text-green-800';
      case 'photo':
        return 'bg-purple-100 text-purple-800';
      case 'faculty':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format metadata for display
  const formatMetadata = () => {
    const metadata = result.metadata || {};
    const items = [];

    if (metadata.year) {
      items.push(
        <div key="year" className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{metadata.year}</span>
        </div>
      );
    }

    if (metadata.author || metadata.name) {
      items.push(
        <div key="author" className="flex items-center space-x-1 text-xs text-gray-500">
          <User className="h-3 w-3" />
          <span className="truncate">{metadata.author || metadata.name}</span>
        </div>
      );
    }

    if (metadata.department) {
      items.push(
        <div key="department" className="flex items-center space-x-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{metadata.department}</span>
        </div>
      );
    }

    return items;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ResultCard] Card clicked:', result.title, 'Event:', e.type);
    console.log('[ResultCard] Full result data:', result);
    onClick();
  };

  console.log('[ResultCard] Rendering card for:', result.title);

  return (
    <Card 
      className={`result-card cursor-pointer hover:shadow-md transition-shadow border-2 border-red-500 ${className}`}
      onClick={handleClick}
      onMouseDown={(e) => console.log('[ResultCard] Mouse down on:', result.title)}
      onMouseUp={(e) => console.log('[ResultCard] Mouse up on:', result.title)}
      style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between space-x-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className={`text-xs ${getTypeColor()}`}>
                <div className="flex items-center space-x-1">
                  {getTypeIcon()}
                  <span className="capitalize">{result.type}</span>
                </div>
              </Badge>
              {result.score && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.score * 100)}% match
                </Badge>
              )}
            </div>
            
            <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
              {highlightText(result.title)}
            </h3>
            
            {result.snippet && (
              <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                {highlightText(result.snippet)}
              </p>
            )}
          </div>

          {/* Thumbnail */}
          {result.thumbnail && (
            <div className="flex-shrink-0">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="w-16 h-16 object-cover rounded border"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metadata */}
        <div className="space-y-1 mb-3">
          {formatMetadata()}
        </div>

        {/* Tags */}
        {result.metadata?.tags && result.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.metadata.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {result.metadata.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{result.metadata.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            ID: {result.id}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={(e) => {
              console.log('[ResultCard] View button clicked:', result.title);
              e.stopPropagation(); // Prevent double-firing from card click
              onClick();
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;