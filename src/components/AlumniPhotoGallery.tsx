import { AlumniRecord } from "@/types";
import { AlumniPhotoCard } from "./AlumniPhotoCard";

interface AlumniPhotoGalleryProps {
  alumni: AlumniRecord[];
  onSelect: (alumnus: AlumniRecord) => void;
}

export function AlumniPhotoGallery({ alumni, onSelect }: AlumniPhotoGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {alumni.map((alumnus) => (
        <AlumniPhotoCard
          key={alumnus.id}
          alumnus={alumnus}
          onClick={() => onSelect(alumnus)}
        />
      ))}
    </div>
  );
}
