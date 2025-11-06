import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { usePDFGestures } from "@/hooks/usePDFGestures";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  className?: string;
}

export function PDFViewer({ pdfUrl, title, onClose, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setIsLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      if (newPage < 1) return 1;
      if (numPages && newPage > numPages) return numPages;
      return newPage;
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }

  function zoomOut() {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }

  function handleZoomGesture(delta: number) {
    setScale(prev => Math.max(0.5, Math.min(prev + delta, 3.0)));
  }

  function fitPage() {
    setScale(1.0);
  }

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen);
  }

  const { attachGestures } = usePDFGestures(containerRef, {
    onZoom: handleZoomGesture,
    onNextPage: nextPage,
    onPreviousPage: previousPage,
    onFitPage: fitPage,
  });

  useEffect(() => {
    return attachGestures();
  }, [attachGestures]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col",
        isFullscreen && "bg-background",
        className
      )}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">{title}</h2>
          {numPages && (
            <p className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Controls */}
          <Button
            variant="outline"
            size="touch"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="px-4 py-2 bg-muted rounded-lg min-w-[100px] text-center">
            <span className="text-lg font-semibold">{pageNumber}</span>
            <span className="text-muted-foreground"> / {numPages || '?'}</span>
          </div>

          <Button
            variant="outline"
            size="touch"
            onClick={nextPage}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Zoom Controls */}
          <div className="h-12 w-px bg-border mx-2" />

          <Button
            variant="outline"
            size="touch"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-6 h-6" />
          </Button>

          <div className="px-4 py-2 bg-muted rounded-lg min-w-[80px] text-center">
            <span className="text-lg font-semibold">{Math.round(scale * 100)}%</span>
          </div>

          <Button
            variant="outline"
            size="touch"
            onClick={zoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="w-6 h-6" />
          </Button>

          {/* Fullscreen Toggle */}
          <div className="h-12 w-px bg-border mx-2" />

          <Button
            variant="outline"
            size="touch"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="w-6 h-6" />
          </Button>

          {/* Close Button */}
          <Button
            variant="kiosk"
            size="touch"
            onClick={onClose}
          >
            <X className="w-6 h-6 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* PDF Document Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30 p-8 touch-none"
      >
        <div className="flex justify-center">
          {isLoading && (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Loading PDF...</p>
              </div>
            </Card>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="shadow-2xl"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>

      {/* Bottom Navigation (Mobile-friendly) */}
      <div className="flex items-center justify-center gap-4 p-4 border-t bg-card md:hidden">
        <Button
          variant="kiosk"
          size="touch-lg"
          onClick={previousPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          Previous
        </Button>

        <Button
          variant="kiosk"
          size="touch-lg"
          onClick={nextPage}
          disabled={!numPages || pageNumber >= numPages}
        >
          Next
          <ChevronRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
    </div>
  );
}
