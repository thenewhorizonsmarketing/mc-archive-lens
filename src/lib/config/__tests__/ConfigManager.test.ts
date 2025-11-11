import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigManager, ConfigValidationError } from '../ConfigManager';
import type { RoomDefinition } from '@/types/kiosk-config';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    configManager.reset();
  });

  describe('Room Validation', () => {
    it('should validate a valid room configuration', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: 'Alumni records',
          icon: '/icons/alumni.svg',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const config = await configManager.loadConfig();
      expect(config.rooms).toHaveLength(1);
      expect(config.rooms[0].id).toBe('alumni');
    });

    it('should reject duplicate room IDs', async () => {
      const mockRooms = [
        {
          id: 'alumni',
          title: 'Alumni 1',
          route: '/alumni1',
          position: 'top-left',
        },
        {
          id: 'alumni',
          title: 'Alumni 2',
          route: '/alumni2',
          position: 'top-center',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rooms: mockRooms }),
      });

      await expect(configManager.loadConfig()).rejects.toThrow(ConfigValidationError);
    });

    it('should reject duplicate positions', async () => {
      const mockRooms = [
        {
          id: 'alumni',
          title: 'Alumni',
          route: '/alumni',
          position: 'top-left',
        },
        {
          id: 'faculty',
          title: 'Faculty',
          route: '/faculty',
          position: 'top-left',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rooms: mockRooms }),
      });

      await expect(configManager.loadConfig()).rejects.toThrow(ConfigValidationError);
    });

    it('should reject invalid grid positions', async () => {
      const mockRooms = [
        {
          id: 'alumni',
          title: 'Alumni',
          route: '/alumni',
          position: 'invalid-position',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rooms: mockRooms }),
      });

      await expect(configManager.loadConfig()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Configuration Validation', () => {
    it('should use default values when config.json is missing', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      const config = await configManager.loadConfig();
      expect(config.idleTimeout).toBe(45);
      expect(config.attractTimeout).toBe(120);
      expect(config.adminPin).toBe('1234');
      expect(config.motionTier).toBe('auto');
    });

    it('should reject invalid idle timeout', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ idleTimeout: -10 }),
        });

      await expect(configManager.loadConfig()).rejects.toThrow(ConfigValidationError);
    });

    it('should reject attractTimeout less than idleTimeout', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ idleTimeout: 100, attractTimeout: 50 }),
        });

      await expect(configManager.loadConfig()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Room Lookup', () => {
    it('should find room by ID', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      await configManager.loadConfig();
      const room = configManager.getRoomById('alumni');
      expect(room).toBeDefined();
      expect(room?.title).toBe('Alumni');
    });

    it('should find room by route', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      await configManager.loadConfig();
      const room = configManager.getRoomByRoute('/alumni');
      expect(room).toBeDefined();
      expect(room?.id).toBe('alumni');
    });

    it('should find room by position', async () => {
      const mockRooms: RoomDefinition[] = [
        {
          id: 'alumni',
          title: 'Alumni',
          description: '',
          icon: '',
          route: '/alumni',
          position: 'top-left',
          color: '#0E6B5C',
        },
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rooms: mockRooms }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      await configManager.loadConfig();
      const room = configManager.getRoomByPosition('top-left');
      expect(room).toBeDefined();
      expect(room?.id).toBe('alumni');
    });
  });
});
