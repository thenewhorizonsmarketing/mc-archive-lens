import { useState, useMemo } from "react";
import { PhotoMatch } from "@/lib/photoMatcher";
import { AlumniRecord } from "@/types";
import { DraggablePhotoThumb } from "./DraggablePhotoThumb";
import { DroppableAlumniCard } from "./DroppableAlumniCard";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, Image, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface PhotoDragDropMatcherProps {
  photoMatches: PhotoMatch[];
  alumni: AlumniRecord[];
  onMatchChange: (photoMatchId: string, alumniId: string | null) => void;
}

export function PhotoDragDropMatcher({ 
  photoMatches, 
  alumni,
  onMatchChange 
}: PhotoDragDropMatcherProps) {
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterView, setFilterView] = useState<'all' | 'unmatched' | 'matched'>('all');

  // Separate matched and unmatched photos
  const unmatchedPhotos = useMemo(() => 
    photoMatches.filter(m => !m.matchedAlumni),
    [photoMatches]
  );

  const matchedPhotos = useMemo(() => 
    photoMatches.filter(m => m.matchedAlumni),
    [photoMatches]
  );

  // Filter alumni based on search
  const filteredAlumni = useMemo(() => {
    let filtered = alumni;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.full_name.toLowerCase().includes(query) ||
        a.grad_year.toString().includes(query) ||
        a.class_role?.toLowerCase().includes(query)
      );
    }

    // Sort by grad year and name
    return filtered.sort((a, b) => {
      if (a.grad_year !== b.grad_year) {
        return b.grad_year - a.grad_year;
      }
      return a.full_name.localeCompare(b.full_name);
    });
  }, [alumni, searchQuery]);

  const handleDrop = (alumniId: string, photoMatchId: string) => {
    onMatchChange(photoMatchId, alumniId);
  };

  const displayedPhotos = useMemo(() => {
    if (filterView === 'unmatched') return unmatchedPhotos;
    if (filterView === 'matched') return matchedPhotos;
    return photoMatches;
  }, [filterView, unmatchedPhotos, matchedPhotos, photoMatches]);

  return (
    <div className="grid grid-cols-[350px_1fr] gap-4 h-[600px]">
      {/* Left Panel - Photos */}
      <div className="border rounded-lg flex flex-col bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Photos</h3>
            <Badge variant="secondary" className="ml-auto">
              {unmatchedPhotos.length} unmatched
            </Badge>
          </div>
          
          <Tabs value={filterView} onValueChange={(v) => setFilterView(v as typeof filterView)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                All ({photoMatches.length})
              </TabsTrigger>
              <TabsTrigger value="unmatched" className="text-xs">
                Unmatched ({unmatchedPhotos.length})
              </TabsTrigger>
              <TabsTrigger value="matched" className="text-xs">
                Matched ({matchedPhotos.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-3">
            {displayedPhotos.map(match => (
              <DraggablePhotoThumb
                key={match.id}
                match={match}
                isDragging={draggingPhotoId === match.id}
                onDragStart={() => setDraggingPhotoId(match.id)}
                onDragEnd={() => setDraggingPhotoId(null)}
              />
            ))}
          </div>
          
          {displayedPhotos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {filterView === 'unmatched' ? 'All photos matched!' : 'No photos to display'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Alumni */}
      <div className="border rounded-lg flex flex-col bg-card">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Alumni Records</h3>
            <Badge variant="outline" className="ml-auto">
              {filteredAlumni.length} records
            </Badge>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search alumni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💡 <strong>Tip:</strong> Drag photos from the left panel onto alumni cards to match them
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {filteredAlumni.map(alumnus => {
              const hasPhoto = photoMatches.some(m => m.matchedAlumni?.id === alumnus.id);
              return (
                <DroppableAlumniCard
                  key={alumnus.id}
                  alumnus={alumnus}
                  hasPhoto={hasPhoto}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
          
          {filteredAlumni.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alumni found matching your search</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
