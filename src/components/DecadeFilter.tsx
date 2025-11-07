import { Button } from "./ui/button";

interface DecadeFilterProps {
  decades: string[];
  selectedDecade: string | null;
  onSelectDecade: (decade: string | null) => void;
}

export function DecadeFilter({ decades, selectedDecade, onSelectDecade }: DecadeFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={selectedDecade === null ? "kiosk" : "outline"}
        size="touch"
        onClick={() => onSelectDecade(null)}
      >
        All Years
      </Button>
      {decades.map((decade) => (
        <Button
          key={decade}
          variant={selectedDecade === decade ? "kiosk" : "outline"}
          size="touch"
          onClick={() => onSelectDecade(decade)}
        >
          {decade}
        </Button>
      ))}
    </div>
  );
}
