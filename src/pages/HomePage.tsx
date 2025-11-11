import { ClueBoard } from "@/components/clue-board/ClueBoard";
import { CentralBranding } from "@/components/clue-board/CentralBranding";
import { RoomCardGrid, RoomData } from "@/components/clue-board/RoomCardGrid";
import { Users, BookOpen, Image, UserSquare, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface HomePageProps {
  onNavigate?: (room: string, searchQuery?: string, resultId?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const navigate = useNavigate();

  // Handle keyboard shortcut (Ctrl+K or Cmd+K) to open fullscreen search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleRoomClick = (roomPath: string) => {
    // Use React Router navigation for proper routing
    navigate(roomPath);
    
    // Also call legacy callback if provided (for backward compatibility with Index.tsx)
    if (onNavigate) {
      const roomMap: Record<string, string> = {
        '/alumni': 'alumni',
        '/publications': 'publications',
        '/photos': 'photos',
        '/faculty': 'faculty'
      };
      onNavigate(roomMap[roomPath] || roomPath.substring(1));
    }
  };

  const rooms: RoomData[] = [
    {
      id: 'alumni',
      title: 'Alumni',
      description: 'Browse class composites and alumni records spanning decades',
      icon: <Users className="w-full h-full" />,
      onClick: () => handleRoomClick('/alumni')
    },
    {
      id: 'publications',
      title: 'Publications',
      description: 'Explore Amicus, Law Review, Legal Eye, and directories',
      icon: <BookOpen className="w-full h-full" />,
      onClick: () => handleRoomClick('/publications')
    },
    {
      id: 'photos',
      title: 'Photos & Archives',
      description: 'Historical photographs and memorable moments',
      icon: <Image className="w-full h-full" />,
      onClick: () => handleRoomClick('/photos')
    },
    {
      id: 'faculty',
      title: 'Faculty & Staff',
      description: 'Meet our distinguished faculty and staff members',
      icon: <UserSquare className="w-full h-full" />,
      onClick: () => handleRoomClick('/faculty')
    }
  ];

  return (
    <ClueBoard>
      <div className="clue-board-layout">
        {/* Central Branding */}
        <CentralBranding />

        {/* Fullscreen Search Button - Prominent touch-friendly button positioned prominently */}
        <div className="fullscreen-search-button-wrapper">
          <button
            className="fullscreen-search-button"
            onClick={handleSearchClick}
            aria-label="Open fullscreen search interface - Search across alumni, publications, photos, and faculty"
            title="Open fullscreen search (Ctrl+K or Cmd+K)"
          >
            <Search className="fullscreen-search-icon" aria-hidden="true" />
            <span className="fullscreen-search-text">Search All Collections</span>
            <span className="fullscreen-search-hint" aria-label="Keyboard shortcut: Control K or Command K">
              Press Ctrl+K or Cmd+K
            </span>
          </button>
        </div>

        {/* Room Cards Grid */}
        <RoomCardGrid rooms={rooms} />

        {/* Footer hint */}
        <div className="clue-board-footer">
          <p className="text-lg text-celestial-blue">
            Touch any area to begin exploring or use search above
          </p>
        </div>
      </div>
    </ClueBoard>
  );
}
