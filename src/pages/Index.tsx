import { useState, useEffect } from "react";
import { RoomType } from "@/types";
import HomePage from "./HomePage";
import AlumniRoom from "./AlumniRoom";
import PublicationsRoom from "./PublicationsRoom";
import PhotosRoom from "./PhotosRoom";
import FacultyRoom from "./FacultyRoom";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { toast } from "sonner";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const Index = () => {
  const [currentRoom, setCurrentRoom] = useState<RoomType>('home');

  const handleIdle = () => {
    if (currentRoom !== 'home') {
      setCurrentRoom('home');
      toast.info("Returning to home screen due to inactivity");
    }
  };

  const { resetTimer } = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: handleIdle,
    enabled: currentRoom !== 'home'
  });

  const handleNavigate = (room: RoomType) => {
    setCurrentRoom(room);
    resetTimer();
  };

  const handleNavigateHome = () => {
    setCurrentRoom('home');
  };

  // Log analytics
  useEffect(() => {
    console.log(`[Analytics] Navigated to room: ${currentRoom}`);
  }, [currentRoom]);

  return (
    <>
      {currentRoom === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentRoom === 'alumni' && <AlumniRoom onNavigateHome={handleNavigateHome} />}
      {currentRoom === 'publications' && <PublicationsRoom onNavigateHome={handleNavigateHome} />}
      {currentRoom === 'photos' && <PhotosRoom onNavigateHome={handleNavigateHome} />}
      {currentRoom === 'faculty' && <FacultyRoom onNavigateHome={handleNavigateHome} />}
    </>
  );
};

export default Index;
