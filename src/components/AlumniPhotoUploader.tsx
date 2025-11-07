import { useState, useCallback } from "react";
import { AlumniRecord } from "@/types";
import { PhotoMatch, matchPhotosToAlumni, updateAlumniWithPhotos } from "@/lib/photoMatcher";
import { generateStandardFilename } from "@/lib/fileNaming";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { PhotoMatchCard } from "./PhotoMatchCard";
import { PhotoDragDropMatcher } from "./PhotoDragDropMatcher";
import { Button } from "./ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle2, ArrowLeft, ArrowRight, Download, Folder, FolderOpen, List, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface AlumniPhotoUploaderProps {
  alumniData: AlumniRecord[];
  onComplete: (updatedAlumni: AlumniRecord[]) => void;
  onCancel: () => void;
}

type Step = 'upload' | 'review' | 'confirm';

export function AlumniPhotoUploader({ alumniData, onComplete, onCancel }: AlumniPhotoUploaderProps) {
  const [step, setStep] = useState<Step>('upload');
  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const [reviewMode, setReviewMode] = useState<'list' | 'dragdrop'>('dragdrop');
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
  
  const handleApplyChanges = useCallback(async () => {
    // Update alumni records
    const updatedAlumni = updateAlumniWithPhotos(alumniData, photoMatches);
    
    // Download photos with correct filenames
    await handleDownloadOrganizedPhotos();
    
    onComplete(updatedAlumni);
    
    toast({
      title: "Photos Updated",
      description: `Successfully updated ${photoMatches.filter(m => m.matchedAlumni).length} alumni records with photos.`,
    });
  }, [alumniData, photoMatches, onComplete, toast]);
  
  const handleDownloadOrganizedPhotos = async () => {
    sonnerToast.info('Starting photo downloads...', { duration: 2000 });
    
    for (const match of photoMatches) {
      if (!match.matchedAlumni) continue;
      
      const year = match.matchedAlumni.grad_year;
      const filename = match.suggestedFilename;
      
      // Create download link with proper filename
      const link = document.createElement('a');
      link.href = match.previewUrl;
      link.download = filename; // Browser will download with this name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay to prevent browser from blocking multiple downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    sonnerToast.success('Photos downloaded! Organize them into year folders in public/photos/', {
      duration: 5000,
    });
  };
  
  const stats = {
    total: photoMatches.length,
    matched: photoMatches.filter(m => m.matchedAlumni).length,
    highConfidence: photoMatches.filter(m => m.confidence === 'high').length,
    needsReview: photoMatches.filter(m => !m.matchedAlumni || m.confidence === 'low').length
  };
  
  const handleDownloadMappings = () => {
    // Group photos by year
    const photosByYear = new Map<number, PhotoMatch[]>();
    photoMatches
      .filter(m => m.matchedAlumni)
      .forEach(m => {
        const year = m.matchedAlumni!.grad_year;
        if (!photosByYear.has(year)) {
          photosByYear.set(year, []);
        }
        photosByYear.get(year)!.push(m);
      });
    
    // Create detailed mapping with directory structure
    let content = '# Alumni Photo Organization Guide\n\n';
    content += '## Directory Structure\n\n';
    content += 'Create the following folder structure in your project:\n\n';
    content += 'public/photos/\n';
    
    Array.from(photosByYear.keys()).sort().forEach(year => {
      const photos = photosByYear.get(year)!;
      content += `  ├── ${year}/\n`;
      photos.forEach((photo, idx) => {
        const prefix = idx === photos.length - 1 ? '  │   └──' : '  │   ├──';
        content += `${prefix} ${photo.suggestedFilename}\n`;
      });
    });
    
    content += '\n\n## Filename Mappings\n\n';
    content += 'Original Filename → New Standardized Filename\n\n';
    
    photoMatches
      .filter(m => m.matchedAlumni)
      .forEach(m => {
        content += `${m.originalFilename}\n  → photos/${m.matchedAlumni!.grad_year}/${m.suggestedFilename}\n\n`;
      });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-organization-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    sonnerToast.success('Organization guide downloaded!');
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

            {/* View Mode Toggle */}
            <Tabs value={reviewMode} onValueChange={(v) => setReviewMode(v as typeof reviewMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dragdrop" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Drag & Drop
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dragdrop" className="mt-4">
                <PhotoDragDropMatcher
                  photoMatches={photoMatches}
                  alumni={alumniData}
                  onMatchChange={handleMatchChange}
                />
              </TabsContent>

              <TabsContent value="list" className="mt-4">
                <ScrollArea className="h-[550px]">
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
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {step === 'confirm' && (
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Ready to Organize Photos</div>
                  <div className="text-sm">
                    {stats.matched} photos will be downloaded with standardized filenames
                  </div>
                </div>
              </div>
              
              {/* Directory Structure Guide */}
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Directory Structure</h4>
                </div>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <div className="text-muted-foreground">public/photos/</div>
                  {Array.from(
                    new Set(
                      photoMatches
                        .filter(m => m.matchedAlumni)
                        .map(m => m.matchedAlumni!.grad_year)
                    )
                  )
                    .sort()
                    .map(year => {
                      const yearPhotos = photoMatches.filter(
                        m => m.matchedAlumni?.grad_year === year
                      );
                      return (
                        <div key={year} className="mt-1">
                          <div className="text-primary">  ├── {year}/</div>
                          {yearPhotos.slice(0, 3).map((m, idx) => (
                            <div key={m.id} className="text-muted-foreground">
                              {'  │   '}
                              {idx === yearPhotos.length - 1 && yearPhotos.length <= 3 ? '└──' : '├──'}{' '}
                              {m.suggestedFilename}
                            </div>
                          ))}
                          {yearPhotos.length > 3 && (
                            <div className="text-muted-foreground">
                              {'  │   └── ... '}({yearPhotos.length - 3} more files)
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.matched}</div>
                  <div className="text-xs text-muted-foreground">Photos Matched</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
                  <div className="text-xs text-muted-foreground">High Confidence</div>
                </div>
              </div>
              
              {stats.needsReview > 0 && (
                <div className="p-3 bg-orange-50 text-orange-700 rounded-lg text-sm">
                  <strong>⚠ Note:</strong> {stats.needsReview} photos could not be matched and will be skipped.
                </div>
              )}
              
              {/* Instructions */}
              <div className="p-4 bg-blue-50 text-blue-900 rounded-lg space-y-3 text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Next Steps:
                </div>
                <ol className="space-y-2 list-decimal list-inside ml-2">
                  <li>Click "Apply & Download Photos" below</li>
                  <li>Photos will download with standardized filenames</li>
                  <li>Create year folders in <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">public/photos/</code></li>
                  <li>Move each photo into its corresponding year folder</li>
                  <li>Alumni records will be updated with correct photo paths</li>
                </ol>
              </div>
              
              {/* Download Guide Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadMappings}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Organization Guide (TXT)
              </Button>
            </div>
          </ScrollArea>
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
            Apply & Download Photos
          </Button>
        )}
      </div>
    </DialogContent>
  );
}
