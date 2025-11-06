import { AlumniStats as StatsType } from "@/lib/csvParser";
import { Card } from "./ui/card";
import { Users, Camera, Award, Calendar } from "lucide-react";

interface AlumniStatsProps {
  stats: StatsType;
}

export function AlumniStats({ stats }: AlumniStatsProps) {
  if (stats.total === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Alumni</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.withPhotos}</p>
            <p className="text-sm text-muted-foreground">With Photos</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.withRoles}</p>
            <p className="text-sm text-muted-foreground">Leadership</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Calendar className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold">
              {stats.yearRange ? `${stats.yearRange.min}-${stats.yearRange.max}` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">Year Range</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
