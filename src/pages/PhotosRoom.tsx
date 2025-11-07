import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotosSearch } from "@/components/room-search/PhotosSearch";
import { samplePhotos } from "@/lib/sampleData";
import { PhotoRecord } from "@/types";
import { Home, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotosRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
}

export default function PhotosRoom({ onNavigateHome, searchQuery }: PhotosRoomProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Photo Archives</h1>
            <p className="text-xl text-muted-foreground">
              Historical photographs and memorable moments
            </p>
          </div>
          <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
            <Home className="w-6 h-6 mr-2" />
            Home
          </Button>
        </div>

        {/* Photos Search */}
        <div className="mb-8">
          <PhotosSearch
            initialQuery={searchQuery}
            onResultSelect={(result) => {
              // Handle search result selection
              console.log('Selected photo search result:', result);
            }}
          />
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samplePhotos.map((photo) => (
            <Card
              key={photo.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{photo.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{photo.collection}</p>
                <p className="text-sm text-foreground line-clamp-2">{photo.caption}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-3xl">{selectedPhoto?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  {selectedPhoto?.collection} • {selectedPhoto?.year_or_decade}
                </p>
                <p className="text-lg">{selectedPhoto?.caption}</p>
              </div>
              {selectedPhoto?.rights_note && (
                <p className="text-sm text-muted-foreground pt-4 border-t">
                  Source: {selectedPhoto.rights_note}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
