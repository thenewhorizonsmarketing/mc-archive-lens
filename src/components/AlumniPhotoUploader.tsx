import { useState, useCallback } from "react";
import { AlumniRecord } from "@/types";
import { PhotoMatch, matchPhotosToAlumni, updateAlumniWithPhotos } from "@/lib/photoMatcher";
import { generateStandardFilename } from "@/lib/fileNaming";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { PhotoMatchCard } from "./PhotoMatchCard";
import { Button } from "./ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { CheckCircle2, ArrowLeft, ArrowRight, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlumniPhotoUploaderProps {
  alumniData: AlumniRecord[];
  onComplete: (updatedAlumni: AlumniRecord[]) => void;
  onCancel: () => void;
}

type Step = 'upload' | 'review' | 'confirm';

export function AlumniPhotoUploader({ alumniData, onComplete, onCancel }: AlumniPhotoUploaderProps) {
  const [step, setStep] = useState<Step>('upload');
  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const { toast } = useToast();
  
  const handleFilesSelected = useCallback((files: File[]) => {
    const matches = matchPhotosToAlumni(files, alumniData);
    setPhotoMatches(matches);
    setStep('review');
  }, [alumniData]);
  
  const handleMatchChange = useCallback((matchId: string, alumniId: string | null) => {
    setPhotoMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const alumnus = alumniId ? alumniData.find(a => a.id === alumniId) : null;
        
        // Recalculate suggested filename
        let suggestedFilename = match.originalFilename;
        if (alumnus) {
          const nameParts = alumnus.full_name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts[nameParts.length - 1] || '';
          const extension = match.originalFilename.split('.').pop() || 'jpg';
          
          suggestedFilename = generateStandardFilename({
            sequenceNumber: match.sequenceNumber,
            firstName,
            lastName,
            role: alumnus.class_role,
            extension
          });
        }
        
        return {
          ...match,
          matchedAlumni: alumnus,
          confidence: alumnus ? 'high' : 'none',
          suggestedFilename
        };
      }
      return match;
    }));
  }, [alumniData]);
  
  const handleApplyChanges = useCallback(() => {
    const updatedAlumni = updateAlumniWithPhotos(alumniData, photoMatches);
    onComplete(updatedAlumni);
    
    toast({
      title: "Photos Updated",
      description: `Successfully updated ${photoMatches.filter(m => m.matchedAlumni).length} alumni records with photos.`,
    });
  }, [alumniData, photoMatches, onComplete, toast]);
  
  const stats = {
    total: photoMatches.length,
    matched: photoMatches.filter(m => m.matchedAlumni).length,
    highConfidence: photoMatches.filter(m => m.confidence === 'high').length,
    needsReview: photoMatches.filter(m => !m.matchedAlumni || m.confidence === 'low').length
  };
  
  const handleDownloadMappings = () => {
    const mappings = photoMatches
      .filter(m => m.matchedAlumni)
      .map(m => `${m.originalFilename} → ${m.suggestedFilename}`)
      .join('\n');
    
    const blob = new Blob([mappings], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-filename-mappings.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Alumni Photo Uploader</DialogTitle>
        <DialogDescription>
          Upload and match photos to alumni records with automatic filename standardization
        </DialogDescription>
      </DialogHeader>
      
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={step === 'upload' ? 'font-semibold' : 'text-muted-foreground'}>
          1. Upload
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={step === 'review' ? 'font-semibold' : 'text-muted-foreground'}>
          2. Review & Match
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={step === 'confirm' ? 'font-semibold' : 'text-muted-foreground'}>
          3. Confirm
        </div>
      </div>
      
      <Separator />
      
      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {step === 'upload' && (
          <div className="h-full flex items-center justify-center">
            <PhotoUploadZone onFilesSelected={handleFilesSelected} />
          </div>
        )}
        
        {step === 'review' && (
          <div className="space-y-4 h-full flex flex-col">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Photos</div>
              </div>
              <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                <div className="text-2xl font-bold">{stats.highConfidence}</div>
                <div className="text-xs">High Confidence</div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                <div className="text-2xl font-bold">{stats.matched}</div>
                <div className="text-xs">Matched</div>
              </div>
              <div className="p-3 bg-orange-50 text-orange-700 rounded-lg">
                <div className="text-2xl font-bold">{stats.needsReview}</div>
                <div className="text-xs">Needs Review</div>
              </div>
            </div>
            
            {/* Photo List */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {photoMatches.map(match => (
                  <PhotoMatchCard
                    key={match.id}
                    match={match}
                    alumni={alumniData}
                    onMatchChange={handleMatchChange}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <div className="font-semibold">Ready to Apply Changes</div>
                <div className="text-sm">
                  {stats.matched} alumni records will be updated with new photo filenames
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Summary:</h4>
              <ul className="space-y-2 text-sm">
                <li>✓ {stats.total} photos uploaded</li>
                <li>✓ {stats.matched} photos matched to alumni</li>
                <li>✓ {stats.highConfidence} high confidence matches</li>
                {stats.needsReview > 0 && (
                  <li className="text-orange-600">⚠ {stats.needsReview} photos unmatched (will be skipped)</li>
                )}
              </ul>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Note:</strong> This will update the photo_file field in your alumni data. 
                You'll need to manually rename the actual photo files on your system to match the new filenames.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMappings}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Filename Mappings
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <Separator />
      <div className="flex justify-between">
        <Button variant="outline" onClick={step === 'upload' ? onCancel : () => setStep('upload')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'upload' ? 'Cancel' : 'Back'}
        </Button>
        
        {step === 'review' && (
          <Button onClick={() => setStep('confirm')}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        
        {step === 'confirm' && (
          <Button onClick={handleApplyChanges}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Apply Changes
          </Button>
        )}
      </div>
    </DialogContent>
  );
}
