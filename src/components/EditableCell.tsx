import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: any;
  type: 'text' | 'number' | 'select' | 'tags';
  options?: string[];
  onChange: (newValue: any) => void;
  onBlur?: () => void;
  validation?: (value: any) => string | null;
  isModified?: boolean;
  className?: string;
}

export function EditableCell({ 
  value, 
  type, 
  options = [], 
  onChange, 
  onBlur,
  validation,
  isModified,
  className 
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (validation) {
      const validationError = validation(localValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onChange(localValue);
    setIsEditing(false);
    setError(null);
    onBlur?.();
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Tab') {
      handleSave();
    }
  };

  // Tags type
  if (type === 'tags') {
    const tags = Array.isArray(localValue) ? localValue : [];
    
    return (
      <div className={cn("flex flex-wrap gap-1 min-h-[32px] p-1", className)}>
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {tag}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
              onClick={() => {
                const newTags = tags.filter((_, i) => i !== index);
                onChange(newTags);
              }}
            />
          </Badge>
        ))}
      </div>
    );
  }

  // Select type
  if (type === 'select' && !isEditing) {
    return (
      <Select value={localValue || "__none__"} onValueChange={(val) => {
        const newValue = val === "__none__" ? "" : val;
        setLocalValue(newValue);
        onChange(newValue);
      }}>
        <SelectTrigger className={cn(
          "h-8 border-0 focus:ring-1",
          isModified && "bg-blue-50 dark:bg-blue-950/30",
          className
        )}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Text/Number types
  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(type === 'number' ? parseInt(e.target.value) : e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-8 border-0 focus:ring-2",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        title={error || undefined}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "h-8 px-3 py-1 cursor-pointer hover:bg-accent/50 rounded transition-colors flex items-center",
        isModified && "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500",
        error && "bg-destructive/10 border-l-2 border-destructive",
        className
      )}
      title={error || (isModified ? 'Modified' : undefined)}
    >
      {localValue || <span className="text-muted-foreground italic">Empty</span>}
    </div>
  );
}
