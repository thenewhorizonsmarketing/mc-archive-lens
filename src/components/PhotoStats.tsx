import { useMemo } from "react";
import { AlumniRecord } from "@/types";
import { Card } from "./ui/card";
import { Image, Users, Award } from "lucide-react";

interface PhotoStatsProps {
  alumni: AlumniRecord[];
}

export function PhotoStats({ alumni }: PhotoStatsProps) {
  const stats = useMemo(() => {
    const withPhotos = alumni.filter(a => a.photo_file);
    const withRoles = withPhotos.filter(a => a.class_role);
    
    return {
      total: alumni.length,
      withPhotos: withPhotos.length,
      withRoles: withRoles.length,
      percentage: alumni.length > 0 ? Math.round((withPhotos.length / alumni.length) * 100) : 0,
    };
  }, [alumni]);

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Photos */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Image className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.withPhotos}</p>
            <p className="text-sm text-muted-foreground">Photos Available</p>
          </div>
        </div>

        {/* Coverage Percentage */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.percentage}%</p>
            <p className="text-sm text-muted-foreground">Coverage Rate</p>
          </div>
        </div>

        {/* Leadership with Photos */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.withRoles}</p>
            <p className="text-sm text-muted-foreground">Leadership Photos</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
