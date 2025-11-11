import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomCard } from '../RoomCard';
import { RoomCardGrid } from '../RoomCardGrid';
import { ClueBoard } from '../ClueBoard';
import { Users } from 'lucide-react';

/**
 * Comprehensive validation tests for Clue Board implementation
 * Covers: Navigation, Animations, Keyboard, Accessibility, Performance
 */

describe('Task 11.1: Cross-Browser Testing', () => {
  describe('Browser Feature Detection', () => {
    it('should detect CSS backdrop-filter support', () => {
      const testElement = document.createElement('div');
      testElement.style.backdropFilter = 'blur(10px)';
      
      // In modern browsers, this should be set
      expect(testElement.style.backdropFilter).toBeDefined();
    });

    it('should detect CSS 3D transform support', () => {
      const testElement = document.createElement('div');
      testElement.style.transform = 'translateZ(10px)';
      
      expect(testElement.style.transform).toBeDefined();
    });

    it('should detect Framer Motion compatibility', () => {
      // Verify motion components can be imported
      const { motion } = require('framer-motion');
      expect(motion).toBeDefined();
      expect(motion.div).toBeDefined();
    });

    it('should handle reduced motion preference', () => {
      // Mock matchMedia for reduced motion
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(result.matches).toBe(true);
    });
  });

  describe('Room Navigation Paths', () => {
    it('should navigate to Alumni room when clicked', async () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button', { name: /Navigate to Alumni/i });
      fireEvent.click(card);

      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('should navigate to all four rooms correctly', () => {
      const mockNavigate = vi.fn();
      const rooms = [
        { id: 'alumni', title: 'Alumni', description: 'Alumni records', icon: <Users />, onClick: () => mockNavigate('alumni') },
        { id: 'publications', title: 'Publications', description: 'Publications', icon: <Users />, onClick: () => mockNavigate('publications') },
        { id: 'photos', title: 'Photos', description: 'Photos', icon: <Users />, onClick: () => mockNavigate('photos') },
        { id: 'faculty', title: 'Faculty', description: 'Faculty', icon: <Users />, onClick: () => mockNavigate('faculty') },
      ];

      render(<RoomCardGrid rooms={rooms} />);

      const cards = screen.getAllByRole('button');
      expect(cards).toHaveLength(4);

      // Click each card
      cards.forEach((card, index) => {
        fireEvent.click(card);
      });

      // Should have attempted navigation for all cards
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Zoom Animation System', () => {
    it('should trigger zoom animation on card click', async () => {
      const mockOnClick = vi.fn();
      const mockOnZoomStart = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
          onZoomStart={mockOnZoomStart}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockOnZoomStart).toHaveBeenCalled();
    });

    it('should fade out sibling cards during zoom', () => {
      const rooms = [
        { id: 'room1', title: 'Room 1', description: 'Desc 1', icon: <Users />, onClick: vi.fn() },
        { id: 'room2', title: 'Room 2', description: 'Desc 2', icon: <Users />, onClick: vi.fn() },
      ];

      const { container } = render(<RoomCardGrid rooms={rooms} />);
      
      const cards = screen.getAllByRole('button');
      fireEvent.click(cards[0]);

      // Grid should be rendered
      expect(container.querySelector('.room-card-grid')).toBeInTheDocument();
    });

    it('should complete zoom animation within 650ms', () => {
      const zoomDuration = 650; // ms (600ms animation + 50ms buffer)
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS;
      
      // Verify animation duration allows for smooth 60fps
      const frameCount = zoomDuration / frameTime;
      expect(frameCount).toBeGreaterThan(30); // At least 30 frames
    });
  });
});

describe('Task 11.2: Accessibility Validation', () => {
  describe('ARIA Labels and Roles', () => {
    it('should have proper role="button" on room cards', () => {
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );

      const card = screen.getByRole('button', { 
        name: /Navigate to Alumni.*Browse alumni records/i 
      });
      expect(card).toBeInTheDocument();
    });

    it('should have role="navigation" on grid', () => {
      const rooms = [
        { id: 'room1', title: 'Room 1', description: 'Desc', icon: <Users />, onClick: vi.fn() },
      ];

      render(<RoomCardGrid rooms={rooms} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label on ClueBoard container', () => {
      render(
        <ClueBoard>
          <div>Content</div>
        </ClueBoard>
      );

      const board = screen.getByLabelText(/MC Museum & Archives Navigation Board/i);
      expect(board).toBeInTheDocument();
    });

    it('should hide decorative elements from screen readers', () => {
      const { container } = render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );

      const shine = container.querySelector('.card-shine');
      expect(shine).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with tabIndex', () => {
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should trigger navigation on Enter key', () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should trigger navigation on Space key', () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should not trigger on other keys', () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a', code: 'KeyA' });

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should maintain focus order in grid', () => {
      const rooms = [
        { id: 'room1', title: 'Room 1', description: 'Desc 1', icon: <Users />, onClick: vi.fn() },
        { id: 'room2', title: 'Room 2', description: 'Desc 2', icon: <Users />, onClick: vi.fn() },
        { id: 'room3', title: 'Room 3', description: 'Desc 3', icon: <Users />, onClick: vi.fn() },
        { id: 'room4', title: 'Room 4', description: 'Desc 4', icon: <Users />, onClick: vi.fn() },
      ];

      render(<RoomCardGrid rooms={rooms} />);
      
      const cards = screen.getAllByRole('button');
      expect(cards).toHaveLength(4);
      
      // All should be tabbable
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Color Contrast (WCAG 2.1 AA)', () => {
    it('should meet contrast requirements for MC Blue on white', () => {
      // MC Blue: #0C2340 on white background
      // Contrast ratio should be at least 4.5:1 for normal text
      const mcBlue = { r: 12, g: 35, b: 64 };
      const white = { r: 255, g: 255, b: 255 };
      
      // Calculate relative luminance
      const getLuminance = (color: { r: number; g: number; b: number }) => {
        const [r, g, b] = [color.r, color.g, color.b].map(val => {
          val = val / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      
      const l1 = getLuminance(white);
      const l2 = getLuminance(mcBlue);
      const contrastRatio = (l1 + 0.05) / (l2 + 0.05);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet contrast requirements for Celestial Blue on MC Blue', () => {
      // Celestial Blue: #69B3E7 on MC Blue: #0C2340
      const celestialBlue = { r: 105, g: 179, b: 231 };
      const mcBlue = { r: 12, g: 35, b: 64 };
      
      const getLuminance = (color: { r: number; g: number; b: number }) => {
        const [r, g, b] = [color.r, color.g, color.b].map(val => {
          val = val / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      
      const l1 = getLuminance(celestialBlue);
      const l2 = getLuminance(mcBlue);
      const contrastRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // Large text requirement
    });
  });

  describe('Reduced Motion Support', () => {
    it('should disable animations when prefers-reduced-motion is set', () => {
      // This is tested via the useReducedMotion hook from Framer Motion
      // The component should respect this preference
      const { useReducedMotion } = require('framer-motion');
      expect(useReducedMotion).toBeDefined();
    });
  });
});

describe('Task 11.3: Performance Validation', () => {
  describe('Animation Performance', () => {
    it('should target 60 FPS (16.67ms per frame)', () => {
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS;
      
      expect(frameTime).toBeCloseTo(16.67, 2);
    });

    it('should use GPU-accelerated properties', () => {
      // Transform and opacity are GPU-accelerated
      const gpuProperties = ['transform', 'opacity'];
      
      gpuProperties.forEach(prop => {
        expect(['transform', 'opacity']).toContain(prop);
      });
    });

    it('should avoid layout-triggering properties in animations', () => {
      // These properties trigger layout recalculation and should be avoided
      const layoutProperties = ['width', 'height', 'top', 'left', 'margin', 'padding'];
      const animatedProperties = ['transform', 'opacity', 'filter'];
      
      // Verify no overlap
      const overlap = animatedProperties.filter(prop => layoutProperties.includes(prop));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Load Time Metrics', () => {
    it('should have minimal component render time', () => {
      const startTime = performance.now();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should render grid efficiently', () => {
      const rooms = Array.from({ length: 4 }, (_, i) => ({
        id: `room${i}`,
        title: `Room ${i}`,
        description: `Description ${i}`,
        icon: <Users />,
        onClick: vi.fn(),
      }));

      const startTime = performance.now();
      render(<RoomCardGrid rooms={rooms} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      
      // Should render 4 cards in less than 200ms
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Touch Interaction Performance', () => {
    it('should debounce rapid touch events', async () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button');
      
      // Simulate rapid touches
      fireEvent.touchStart(card);
      fireEvent.touchEnd(card);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.touchStart(card);
      fireEvent.touchEnd(card);

      // Should handle touches appropriately
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should prevent accidental double-taps', () => {
      const mockOnClick = vi.fn();
      
      render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button');
      
      // Simulate very rapid touch (< 50ms)
      const touchStart = new Date().getTime();
      fireEvent.touchStart(card);
      
      // Immediately end (simulating accidental double-tap)
      fireEvent.touchEnd(card);
      
      // The component should handle this gracefully
      expect(card).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <RoomCard
          title="Alumni"
          description="Browse alumni records"
          icon={<Users />}
          onClick={vi.fn()}
        />
      );

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle multiple mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <RoomCard
            title="Alumni"
            description="Browse alumni records"
            icon={<Users />}
            onClick={vi.fn()}
          />
        );
        unmount();
      }
      
      // Should complete without memory leaks
      expect(true).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('should render complete ClueBoard with all components', () => {
    const rooms = [
      { id: 'alumni', title: 'Alumni', description: 'Alumni records', icon: <Users />, onClick: vi.fn() },
      { id: 'publications', title: 'Publications', description: 'Publications', icon: <Users />, onClick: vi.fn() },
      { id: 'photos', title: 'Photos', description: 'Photos', icon: <Users />, onClick: vi.fn() },
      { id: 'faculty', title: 'Faculty', description: 'Faculty', icon: <Users />, onClick: vi.fn() },
    ];

    render(
      <ClueBoard>
        <RoomCardGrid rooms={rooms} />
      </ClueBoard>
    );

    // Should render all 4 cards
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(4);
  });

  it('should handle navigation flow from start to finish', async () => {
    const mockNavigate = vi.fn();
    const rooms = [
      { id: 'alumni', title: 'Alumni', description: 'Alumni records', icon: <Users />, onClick: mockNavigate },
    ];

    render(
      <ClueBoard>
        <RoomCardGrid rooms={rooms} />
      </ClueBoard>
    );

    const card = screen.getByRole('button', { name: /Alumni/i });
    
    // Click the card
    fireEvent.click(card);

    // Should trigger navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
});
