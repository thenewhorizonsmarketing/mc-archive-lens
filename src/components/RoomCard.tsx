import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

export function RoomCard({ title, description, icon: Icon, onClick, className }: RoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "room-card group text-left relative overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>
      
      {/* Decorative accent */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
