import { useState, useMemo } from "react";
import { AlumniGrid } from "@/components/AlumniGrid";
import { DecadeFilter } from "@/components/DecadeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sampleAlumni } from "@/lib/sampleData";
import { AlumniRecord } from "@/types";
import { Home, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlumniRoomProps {
  onNavigateHome: () => void;
}

export default function AlumniRoom({ onNavigateHome }: AlumniRoomProps) {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumnus, setSelectedAlumnus] = useState<AlumniRecord | null>(null);

  // Extract unique decades
  const decades = useMemo(() => {
    const uniqueDecades = [...new Set(sampleAlumni.map(a => a.decade))];
    return uniqueDecades.sort();
  }, []);

  // Filter alumni
  const filteredAlumni = useMemo(() => {
    return sampleAlumni.filter(alumnus => {
      // Decade filter
      if (selectedDecade && alumnus.decade !== selectedDecade) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alumnus.full_name.toLowerCase().includes(query) ||
          alumnus.class_role?.toLowerCase().includes(query) ||
          alumnus.grad_year.toString().includes(query)
        );
      }
      
      return true;
    });
  }, [selectedDecade, searchQuery]);

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Alumni Records</h1>
            <p className="text-xl text-muted-foreground">
              {filteredAlumni.length} {filteredAlumni.length === 1 ? 'alumnus' : 'alumni'} found
            </p>
          </div>
          <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
            <Home className="w-6 h-6 mr-2" />
            Home
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, role, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 text-lg"
            />
          </div>
        </div>

        {/* Decade Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Decade</h2>
          <DecadeFilter
            decades={decades}
            selectedDecade={selectedDecade}
            onSelectDecade={setSelectedDecade}
          />
        </div>

        {/* Alumni Grid */}
        {filteredAlumni.length > 0 ? (
          <AlumniGrid
            alumni={filteredAlumni}
            onSelect={setSelectedAlumnus}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No alumni found matching your criteria</p>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedAlumnus} onOpenChange={() => setSelectedAlumnus(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl">{selectedAlumnus?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-muted-foreground">Class of {selectedAlumnus?.grad_year}</p>
                <p className="text-sm text-muted-foreground">Graduated: {selectedAlumnus?.grad_date}</p>
              </div>
              {selectedAlumnus?.class_role && (
                <div>
                  <h3 className="font-semibold mb-2">Leadership Role</h3>
                  <p className="text-lg">{selectedAlumnus.class_role}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Part of the {selectedAlumnus?.decade} graduating classes
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
