import { useState } from "react";
import { AlumniRecord } from "@/types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { getPhotoUrl, getInitials } from "@/lib/imageUtils";
import { User, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface AlumniPhotoCardProps {
  alumnus: AlumniRecord;
  onClick: () => void;
}

export function AlumniPhotoCard({ alumnus, onClick }: AlumniPhotoCardProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const photoUrl = getPhotoUrl(alumnus);

  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Photo Container */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {photoUrl ? (
          <>
            {/* Loading Skeleton */}
            {imageStatus === 'loading' && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            
            {/* Actual Image */}
            <img
              src={photoUrl}
              alt={alumnus.full_name}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
            />
            
            {/* Error Fallback */}
            {imageStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Photo unavailable</p>
              </div>
            )}
          </>
        ) : (
          /* No Photo Placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <span className="text-3xl font-bold text-primary">
                {getInitials(alumnus.full_name)}
              </span>
            </div>
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info Section - Always Visible */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg truncate">{alumnus.full_name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            Class of {alumnus.grad_year}
          </Badge>
          {alumnus.class_role && (
            <Badge variant="outline" className="text-sm truncate max-w-[200px]">
              {alumnus.class_role}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
