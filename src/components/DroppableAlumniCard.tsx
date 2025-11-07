import { useState } from "react";
import { AlumniRecord } from "@/types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DroppableAlumniCardProps {
  alumnus: AlumniRecord;
  hasPhoto: boolean;
  onDrop: (alumniId: string, photoMatchId: string) => void;
}

export function DroppableAlumniCard({ alumnus, hasPhoto, onDrop }: DroppableAlumniCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const photoMatchId = e.dataTransfer.getData('photoMatchId');
    if (photoMatchId) {
      onDrop(alumnus.id, photoMatchId);
    }
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "p-4 transition-all cursor-pointer relative",
        isDragOver && "border-primary border-2 bg-primary/5 scale-105 shadow-lg",
        hasPhoto && "bg-green-50 border-green-200"
      )}
    >
      {hasPhoto && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{alumnus.full_name}</h4>
          <p className="text-xs text-muted-foreground">Class of {alumnus.grad_year}</p>
          {alumnus.class_role && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {alumnus.class_role}
            </Badge>
          )}
        </div>
      </div>
      
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary font-semibold text-sm">
            Drop photo here
          </div>
        </div>
      )}
    </Card>
  );
}
