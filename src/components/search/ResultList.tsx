// Result List Component for List View
import React from 'react';
import { ExternalLink, Calendar, User, FileText, Camera, GraduationCap, Users, MapPin, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/lib/database/types';

export interface ResultListProps {
  result: SearchResult;
  onClick: () => void;
  highlightTerms: string[];
  className?: string;
}

export const ResultList: React.FC<ResultListProps> = ({
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
      items.push(`${metadata.year}`);
    }

    if (metadata.author || metadata.name) {
      items.push(metadata.author || metadata.name);
    }

    if (metadata.department) {
      items.push(metadata.department);
    }

    if (metadata.publicationType) {
      items.push(metadata.publicationType);
    }

    return items.join(' • ');
  };

  return (
    <Card 
      className={`result-list cursor-pointer hover:shadow-sm transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          {result.thumbnail && (
            <div className="flex-shrink-0">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="w-12 h-12 object-cover rounded border"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-1">
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

                {/* Title */}
                <h3 className="font-medium text-base leading-tight mb-2 line-clamp-1">
                  {highlightText(result.title)}
                </h3>

                {/* Snippet */}
                {result.snippet && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {highlightText(result.snippet)}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                  {result.metadata?.year && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{result.metadata.year}</span>
                    </div>
                  )}
                  
                  {(result.metadata?.author || result.metadata?.name) && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-32">
                        {result.metadata.author || result.metadata.name}
                      </span>
                    </div>
                  )}
                  
                  {result.metadata?.department && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-32">{result.metadata.department}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {result.metadata?.tags && result.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.metadata.tags.slice(0, 4).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {result.metadata.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{result.metadata.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <div className="text-xs text-gray-400">
                  ID: {result.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultList;