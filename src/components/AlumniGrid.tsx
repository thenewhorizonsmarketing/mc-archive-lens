import { AlumniRecord } from "@/types";
import { GraduationCap, Users } from "lucide-react";
import { Card } from "./ui/card";

interface AlumniGridProps {
  alumni: AlumniRecord[];
  onSelect: (alumnus: AlumniRecord) => void;
}

export function AlumniGrid({ alumni, onSelect }: AlumniGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {alumni.map((alumnus) => (
        <Card
          key={alumnus.id}
          className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          onClick={() => onSelect(alumnus)}
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{alumnus.full_name}</h3>
              <p className="text-sm text-muted-foreground mb-2">Class of {alumnus.grad_year}</p>
              {alumnus.class_role && (
                <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                  <Users className="w-4 h-4" />
                  <span className="truncate">{alumnus.class_role}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
