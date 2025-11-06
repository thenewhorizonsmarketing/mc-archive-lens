import { PhotoMatch } from "@/lib/photoMatcher";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggablePhotoThumbProps {
  match: PhotoMatch;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function DraggablePhotoThumb({ 
  match, 
  isDragging,
  onDragStart,
  onDragEnd 
}: DraggablePhotoThumbProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('photoMatchId', match.id);
    onDragStart();
  };

  return (
    <div
      draggable={!match.matchedAlumni}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative group cursor-move transition-all",
        isDragging && "opacity-50 scale-95",
        match.matchedAlumni && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors bg-muted">
        {!match.matchedAlumni && (
          <div className="absolute top-2 right-2 z-10 bg-background/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        <img
          src={match.previewUrl}
          alt={match.originalFilename}
          className="w-full h-full object-cover"
        />
        
        {match.matchedAlumni && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
              ✓ Matched
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-1 text-xs text-center truncate px-1 text-muted-foreground">
        {match.originalFilename}
      </div>
    </div>
  );
}
