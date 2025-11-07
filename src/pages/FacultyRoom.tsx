import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FacultySearch } from "@/components/room-search/FacultySearch";
import { sampleFaculty } from "@/lib/sampleData";
import { Home, Mail, Phone, UserSquare } from "lucide-react";

interface FacultyRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
}

export default function FacultyRoom({ onNavigateHome, searchQuery }: FacultyRoomProps) {
  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Faculty & Staff</h1>
            <p className="text-xl text-muted-foreground">
              Meet our distinguished faculty members
            </p>
          </div>
          <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
            <Home className="w-6 h-6 mr-2" />
            Home
          </Button>
        </div>

        {/* Faculty Search */}
        <div className="mb-8">
          <FacultySearch
            initialQuery={searchQuery}
            onResultSelect={(result) => {
              // Handle search result selection
              console.log('Selected faculty search result:', result);
            }}
          />
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleFaculty.map((faculty) => (
            <Card key={faculty.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserSquare className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xl mb-1">{faculty.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{faculty.title}</p>
                  {faculty.department && (
                    <p className="text-sm text-muted-foreground mt-1">{faculty.department}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{faculty.email}</span>
                </div>
                {faculty.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{faculty.phone}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
