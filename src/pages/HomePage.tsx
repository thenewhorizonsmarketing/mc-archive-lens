import { RoomCard } from "@/components/RoomCard";
import { Users, BookOpen, Image, UserSquare } from "lucide-react";
import { RoomType } from "@/types";

interface HomePageProps {
  onNavigate: (room: RoomType) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="kiosk-container flex flex-col items-center justify-center p-8">
      <div className="max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            MC Museum & Archives
          </h1>
          <p className="text-2xl text-muted-foreground">
            Explore our history, alumni, and legacy
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <RoomCard
            title="Alumni"
            description="Browse class composites and alumni records spanning decades"
            icon={Users}
            onClick={() => onNavigate('alumni')}
          />
          
          <RoomCard
            title="Publications"
            description="Explore Amicus, Law Review, Legal Eye, and directories"
            icon={BookOpen}
            onClick={() => onNavigate('publications')}
          />
          
          <RoomCard
            title="Photos & Archives"
            description="Historical photographs and memorable moments"
            icon={Image}
            onClick={() => onNavigate('photos')}
          />
          
          <RoomCard
            title="Faculty & Staff"
            description="Meet our distinguished faculty and staff members"
            icon={UserSquare}
            onClick={() => onNavigate('faculty')}
          />
        </div>

        {/* Footer hint */}
        <div className="text-center mt-16 text-muted-foreground">
          <p className="text-lg">Touch any area to begin exploring</p>
        </div>
      </div>
    </div>
  );
}
