import { useState, useEffect } from "react";
import { RoomType } from "@/types";
import HomePage from "./HomePage";
import AlumniRoom from "./AlumniRoom";
import PublicationsRoom from "./PublicationsRoom";
import PhotosRoom from "./PhotosRoom";
import FacultyRoom from "./FacultyRoom";
import AdminPanel from "./AdminPanel";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { toast } from "sonner";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const Index = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>('home');
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleIdle = () => {
    if (currentRoom !== 'home' || showAdmin) {
      setCurrentRoom('home');
      setSearchQuery(undefined);
      setShowAdmin(false);
      toast.info("Returning to home screen due to inactivity");
    }
  };

  const { resetTimer } = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: handleIdle,
    enabled: currentRoom !== 'home' || showAdmin
  });

  const handleNavigate = (room: RoomType, query?: string) => {
    setCurrentRoom(room);
    setSearchQuery(query);
    resetTimer();
  };

  const handleNavigateHome = () => {
    setCurrentRoom('home');
    setSearchQuery(undefined);
    setShowAdmin(false);
  };

  // Handle admin access (could be triggered by a key combination or hidden button)
  const handleAdminAccess = () => {
    setShowAdmin(true);
    resetTimer();
  };

  // Listen for admin key combination (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        handleAdminAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Log analytics
  useEffect(() => {
    console.log(`[Analytics] Navigated to room: ${currentRoom}`);
  }, [currentRoom]);

  return (
    <>
      {showAdmin ? (
        <AdminPanel onNavigateHome={handleNavigateHome} />
      ) : (
        <>
          {currentRoom === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentRoom === 'alumni' && <AlumniRoom onNavigateHome={handleNavigateHome} searchQuery={searchQuery} />}
          {currentRoom === 'publications' && <PublicationsRoom onNavigateHome={handleNavigateHome} searchQuery={searchQuery} />}
          {currentRoom === 'photos' && <PhotosRoom onNavigateHome={handleNavigateHome} searchQuery={searchQuery} />}
          {currentRoom === 'faculty' && <FacultyRoom onNavigateHome={handleNavigateHome} searchQuery={searchQuery} />}
        </>
      )}
    </>
  );
};

export default Index;
