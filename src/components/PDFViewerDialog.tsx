import { PDFViewer } from "./PDFViewer";
import { PublicationRecord } from "@/types";

interface PDFViewerDialogProps {
  publication: PublicationRecord | null;
  onClose: () => void;
}

export function PDFViewerDialog({ publication, onClose }: PDFViewerDialogProps) {
  if (!publication) return null;

  return (
    <PDFViewer
      pdfUrl={publication.pdf_path}
      title={publication.title}
      onClose={onClose}
    />
  );
}
