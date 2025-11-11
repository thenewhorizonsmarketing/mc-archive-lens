import { describe, it, expect } from 'vitest';
import {
  getMotionTierConfig,
  isFeatureEnabled,
  getTargetFPS,
  getMotionTierDescription,
} from '../motion-tier-features';

describe('Motion Tier Features', () => {
  describe('getMotionTierConfig (Requirement 6.2, 6.3, 6.4)', () => {
    it('should return full tier configuration', () => {
      const config = getMotionTierConfig('full');
      
      expect(config.tier).toBe('full');
      expect(config.features.boardTilt).toBe(true);
      expect(config.features.parallax).toBe(true);
      expect(config.features.emissivePulse).toBe(true);
      expect(config.features.cameraTransition).toBe(true);
      expect(config.targetFPS).toBe(60);
    });

    it('should return lite tier configuration', () => {
      const config = getMotionTierConfig('lite');
      
      expect(config.tier).toBe('lite');
      expect(config.features.boardTilt).toBe(false);
      expect(config.features.parallax).toBe(true);
      expect(config.features.emissivePulse).toBe(true);
      expect(config.features.cameraTransition).toBe(true);
      expect(config.targetFPS).toBe(55);
    });

    it('should return static tier configuration', () => {
      const config = getMotionTierConfig('static');
      
      expect(config.tier).toBe('static');
      expect(config.features.boardTilt).toBe(false);
      expect(config.features.parallax).toBe(false);
      expect(config.features.emissivePulse).toBe(false);
      expect(config.features.cameraTransition).toBe(false);
      expect(config.targetFPS).toBe(30);
    });

    it('should default to lite tier for unknown tier', () => {
      const config = getMotionTierConfig('unknown' as any);
      
      expect(config.tier).toBe('lite');
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check if board tilt is enabled', () => {
      expect(isFeatureEnabled('full', 'boardTilt')).toBe(true);
      expect(isFeatureEnabled('lite', 'boardTilt')).toBe(false);
      expect(isFeatureEnabled('static', 'boardTilt')).toBe(false);
    });

    it('should check if parallax is enabled', () => {
      expect(isFeatureEnabled('full', 'parallax')).toBe(true);
      expect(isFeatureEnabled('lite', 'parallax')).toBe(true);
      expect(isFeatureEnabled('static', 'parallax')).toBe(false);
    });

    it('should check if emissive pulse is enabled', () => {
      expect(isFeatureEnabled('full', 'emissivePulse')).toBe(true);
      expect(isFeatureEnabled('lite', 'emissivePulse')).toBe(true);
      expect(isFeatureEnabled('static', 'emissivePulse')).toBe(false);
    });

    it('should check if camera transition is enabled', () => {
      expect(isFeatureEnabled('full', 'cameraTransition')).toBe(true);
      expect(isFeatureEnabled('lite', 'cameraTransition')).toBe(true);
      expect(isFeatureEnabled('static', 'cameraTransition')).toBe(false);
    });
  });

  describe('getTargetFPS', () => {
    it('should return correct target FPS for each tier', () => {
      expect(getTargetFPS('full')).toBe(60);
      expect(getTargetFPS('lite')).toBe(55);
      expect(getTargetFPS('static')).toBe(30);
    });
  });

  describe('getMotionTierDescription', () => {
    it('should return descriptions for all tiers', () => {
      expect(getMotionTierDescription('full')).toContain('Full quality');
      expect(getMotionTierDescription('lite')).toContain('Reduced effects');
      expect(getMotionTierDescription('static')).toContain('Minimal effects');
    });

    it('should handle unknown tier', () => {
      expect(getMotionTierDescription('unknown' as any)).toBe('Unknown tier');
    });
  });
});
