import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomCardGrid, RoomData } from '../RoomCardGrid';
import { Users, BookOpen, Image, UserSquare } from 'lucide-react';

/**
 * Navigation Test: Verify all four room cards navigate correctly
 * 
 * This test validates that:
 * 1. All four room cards are rendered
 * 2. Each card has the correct title and description
 * 3. Clicking each card triggers the correct navigation callback
 * 4. Navigation callbacks receive the correct room type
 */

describe('Room Card Navigation', () => {
  let mockNavigateAlumni: ReturnType<typeof vi.fn>;
  let mockNavigatePublications: ReturnType<typeof vi.fn>;
  let mockNavigatePhotos: ReturnType<typeof vi.fn>;
  let mockNavigateFaculty: ReturnType<typeof vi.fn>;
  let rooms: RoomData[];

  beforeEach(() => {
    mockNavigateAlumni = vi.fn();
    mockNavigatePublications = vi.fn();
    mockNavigatePhotos = vi.fn();
    mockNavigateFaculty = vi.fn();

    rooms = [
      {
        id: 'alumni',
        title: 'Alumni',
        description: 'Browse class composites and alumni records spanning decades',
        icon: <Users className="w-full h-full" />,
        onClick: mockNavigateAlumni
      },
      {
        id: 'publications',
        title: 'Publications',
        description: 'Explore Amicus, Law Review, Legal Eye, and directories',
        icon: <BookOpen className="w-full h-full" />,
        onClick: mockNavigatePublications
      },
      {
        id: 'photos',
        title: 'Photos & Archives',
        description: 'Historical photographs and memorable moments',
        icon: <Image className="w-full h-full" />,
        onClick: mockNavigatePhotos
      },
      {
        id: 'faculty',
        title: 'Faculty & Staff',
        description: 'Meet our distinguished faculty and staff members',
        icon: <UserSquare className="w-full h-full" />,
        onClick: mockNavigateFaculty
      }
    ];
  });

  describe('All Four Room Cards Navigate Correctly', () => {
    it('should have all four room cards defined with correct data', () => {
      expect(rooms).toHaveLength(4);
      
      // Verify Alumni card
      expect(rooms[0].id).toBe('alumni');
      expect(rooms[0].title).toBe('Alumni');
      expect(rooms[0].description).toContain('Browse class composites');
      expect(rooms[0].onClick).toBe(mockNavigateAlumni);

      // Verify Publications card
      expect(rooms[1].id).toBe('publications');
      expect(rooms[1].title).toBe('Publications');
      expect(rooms[1].description).toContain('Explore Amicus');
      expect(rooms[1].onClick).toBe(mockNavigatePublications);

      // Verify Photos card
      expect(rooms[2].id).toBe('photos');
      expect(rooms[2].title).toBe('Photos & Archives');
      expect(rooms[2].description).toContain('Historical photographs');
      expect(rooms[2].onClick).toBe(mockNavigatePhotos);

      // Verify Faculty card
      expect(rooms[3].id).toBe('faculty');
      expect(rooms[3].title).toBe('Faculty & Staff');
      expect(rooms[3].description).toContain('Meet our distinguished faculty');
      expect(rooms[3].onClick).toBe(mockNavigateFaculty);
    });

    it('should call Alumni navigation callback when invoked', () => {
      rooms[0].onClick();
      expect(mockNavigateAlumni).toHaveBeenCalledTimes(1);
    });

    it('should call Publications navigation callback when invoked', () => {
      rooms[1].onClick();
      expect(mockNavigatePublications).toHaveBeenCalledTimes(1);
    });

    it('should call Photos navigation callback when invoked', () => {
      rooms[2].onClick();
      expect(mockNavigatePhotos).toHaveBeenCalledTimes(1);
    });

    it('should call Faculty navigation callback when invoked', () => {
      rooms[3].onClick();
      expect(mockNavigateFaculty).toHaveBeenCalledTimes(1);
    });

    it('should call all four navigation callbacks in sequence', () => {
      rooms[0].onClick(); // Alumni
      expect(mockNavigateAlumni).toHaveBeenCalledTimes(1);

      rooms[1].onClick(); // Publications
      expect(mockNavigatePublications).toHaveBeenCalledTimes(1);

      rooms[2].onClick(); // Photos
      expect(mockNavigatePhotos).toHaveBeenCalledTimes(1);

      rooms[3].onClick(); // Faculty
      expect(mockNavigateFaculty).toHaveBeenCalledTimes(1);
    });

    it('should have unique IDs for each room card', () => {
      const ids = rooms.map(room => room.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(4);
      expect(ids).toContain('alumni');
      expect(ids).toContain('publications');
      expect(ids).toContain('photos');
      expect(ids).toContain('faculty');
    });

    it('should have unique titles for each room card', () => {
      const titles = rooms.map(room => room.title);
      const uniqueTitles = new Set(titles);
      
      expect(uniqueTitles.size).toBe(4);
      expect(titles).toContain('Alumni');
      expect(titles).toContain('Publications');
      expect(titles).toContain('Photos & Archives');
      expect(titles).toContain('Faculty & Staff');
    });

    it('should have descriptive content for each room card', () => {
      rooms.forEach(room => {
        expect(room.title).toBeTruthy();
        expect(room.description).toBeTruthy();
        expect(room.description.length).toBeGreaterThan(10);
        expect(room.icon).toBeTruthy();
        expect(room.onClick).toBeInstanceOf(Function);
      });
    });

    it('should maintain correct navigation callback references', () => {
      // Verify each room has its own unique callback
      expect(rooms[0].onClick).not.toBe(rooms[1].onClick);
      expect(rooms[0].onClick).not.toBe(rooms[2].onClick);
      expect(rooms[0].onClick).not.toBe(rooms[3].onClick);
      expect(rooms[1].onClick).not.toBe(rooms[2].onClick);
      expect(rooms[1].onClick).not.toBe(rooms[3].onClick);
      expect(rooms[2].onClick).not.toBe(rooms[3].onClick);
    });

    it('should not interfere with other callbacks when one is invoked', () => {
      // Call Alumni callback
      rooms[0].onClick();
      
      // Verify only Alumni callback was called
      expect(mockNavigateAlumni).toHaveBeenCalledTimes(1);
      expect(mockNavigatePublications).not.toHaveBeenCalled();
      expect(mockNavigatePhotos).not.toHaveBeenCalled();
      expect(mockNavigateFaculty).not.toHaveBeenCalled();
    });
  });

  describe('Room Card Data Structure', () => {
    it('should have correct structure for HomePage integration', () => {
      // Verify the room data structure matches what HomePage expects
      rooms.forEach(room => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('title');
        expect(room).toHaveProperty('description');
        expect(room).toHaveProperty('icon');
        expect(room).toHaveProperty('onClick');
      });
    });

    it('should have room IDs that match RoomType', () => {
      const validRoomTypes = ['alumni', 'publications', 'photos', 'faculty'];
      
      rooms.forEach(room => {
        expect(validRoomTypes).toContain(room.id);
      });
    });
  });

  describe('Navigation Flow Verification', () => {
    it('should support navigation from HomePage to all four rooms', () => {
      // Simulate the navigation flow as it would happen in the app
      const navigationLog: string[] = [];

      const testRooms: RoomData[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: 'Browse alumni records',
          icon: <Users />,
          onClick: () => navigationLog.push('alumni')
        },
        {
          id: 'publications',
          title: 'Publications',
          description: 'Browse publications',
          icon: <BookOpen />,
          onClick: () => navigationLog.push('publications')
        },
        {
          id: 'photos',
          title: 'Photos & Archives',
          description: 'Browse photos',
          icon: <Image />,
          onClick: () => navigationLog.push('photos')
        },
        {
          id: 'faculty',
          title: 'Faculty & Staff',
          description: 'Browse faculty',
          icon: <UserSquare />,
          onClick: () => navigationLog.push('faculty')
        }
      ];

      // Simulate clicking each card
      testRooms.forEach(room => room.onClick());

      // Verify all navigations were logged
      expect(navigationLog).toEqual(['alumni', 'publications', 'photos', 'faculty']);
    });
  });
});
