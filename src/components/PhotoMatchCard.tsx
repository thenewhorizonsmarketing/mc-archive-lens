import { AlumniRecord } from "@/types";
import { PhotoMatch } from "@/lib/photoMatcher";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, AlertCircle, XCircle, Edit2 } from "lucide-react";

interface PhotoMatchCardProps {
  match: PhotoMatch;
  alumni: AlumniRecord[];
  onMatchChange: (matchId: string, alumniId: string | null) => void;
}

export function PhotoMatchCard({ match, alumni, onMatchChange }: PhotoMatchCardProps) {
  const getConfidenceColor = () => {
    switch (match.confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      case 'none': return 'text-red-600 bg-red-50';
    }
  };
  
  const getConfidenceIcon = () => {
    switch (match.confidence) {
      case 'high': return <CheckCircle2 className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <AlertCircle className="w-4 h-4" />;
      case 'none': return <XCircle className="w-4 h-4" />;
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Photo Preview */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
            <img 
              src={match.previewUrl} 
              alt={match.originalFilename}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {match.originalFilename}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                → {match.suggestedFilename}
              </p>
            </div>
            
            <Badge className={getConfidenceColor()}>
              <span className="flex items-center gap-1">
                {getConfidenceIcon()}
                {match.confidence}
              </span>
            </Badge>
          </div>
          
          {/* Alumni Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select
                value={match.matchedAlumni?.id || "none"}
                onValueChange={(value) => onMatchChange(match.id, value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select alumni..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No match</span>
                  </SelectItem>
                  {alumni.map(alumnus => (
                    <SelectItem key={alumnus.id} value={alumnus.id}>
                      {alumnus.full_name} ({alumnus.grad_year})
                      {alumnus.class_role && ` - ${alumnus.class_role}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {match.matchedAlumni && (
              <div className="text-xs space-y-1 p-2 bg-muted rounded">
                <div><strong>Name:</strong> {match.matchedAlumni.full_name}</div>
                <div><strong>Year:</strong> {match.matchedAlumni.grad_year}</div>
                {match.matchedAlumni.class_role && (
                  <div><strong>Role:</strong> {match.matchedAlumni.class_role}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
