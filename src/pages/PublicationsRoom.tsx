import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { samplePublications } from "@/lib/sampleData";
import { PublicationRecord } from "@/types";
import { Home, BookOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublicationsRoomProps {
  onNavigateHome: () => void;
}

export default function PublicationsRoom({ onNavigateHome }: PublicationsRoomProps) {
  const [selectedPub, setSelectedPub] = useState<PublicationRecord | null>(null);
  const [viewingPDF, setViewingPDF] = useState<PublicationRecord | null>(null);

  const handleViewPDF = (pub: PublicationRecord) => {
    setSelectedPub(null); // Close the detail dialog
    setViewingPDF(pub); // Open PDF viewer
  };

  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Publications</h1>
            <p className="text-xl text-muted-foreground">
              Amicus, Law Review, Legal Eye & More
            </p>
          </div>
          <Button variant="kiosk" size="touch" onClick={onNavigateHome}>
            <Home className="w-6 h-6 mr-2" />
            Home
          </Button>
        </div>

        {/* Publications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samplePublications.map((pub) => (
            <Card
              key={pub.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => setSelectedPub(pub)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{pub.pub_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{pub.volume_issue}</p>
                  <p className="text-sm text-foreground line-clamp-2">{pub.description}</p>
                </div>
              </div>
              {pub.page_count && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {pub.page_count} pages
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedPub} onOpenChange={() => setSelectedPub(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-3xl">{selectedPub?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{selectedPub?.volume_issue}</span>
                <span>•</span>
                <span>{selectedPub?.issue_date}</span>
                {selectedPub?.page_count && (
                  <>
                    <span>•</span>
                    <span>{selectedPub.page_count} pages</span>
                  </>
                )}
              </div>
              {selectedPub?.description && (
                <p className="text-lg">{selectedPub.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-4">
                {selectedPub?.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-4 border-t">
                <Button 
                  variant="kiosk-gold" 
                  size="touch" 
                  className="w-full"
                  onClick={() => selectedPub && handleViewPDF(selectedPub)}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Viewer */}
        <PDFViewerDialog
          publication={viewingPDF}
          onClose={() => setViewingPDF(null)}
        />
      </div>
    </div>
  );
}
