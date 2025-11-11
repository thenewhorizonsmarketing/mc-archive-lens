import type { MotionTier } from '@/store/performanceStore';
import type { MotionTierConfig } from '@/types/kiosk-config';

/**
 * Get motion tier configuration with feature flags
 * 
 * Requirements:
 * - 6.2: Full tier - board tilt + parallax + emissive pulses (60 FPS target)
 * - 6.3: Lite tier - parallax only, no tilt (55-60 FPS target)
 * - 6.4: Static tier - cross-fade highlights only
 */
export function getMotionTierConfig(tier: MotionTier): MotionTierConfig {
  switch (tier) {
    case 'full':
      return {
        tier: 'full',
        features: {
          boardTilt: true,
          parallax: true,
          emissivePulse: true,
          cameraTransition: true
        },
        targetFPS: 60
      };
    
    case 'lite':
      return {
        tier: 'lite',
        features: {
          boardTilt: false,
          parallax: true,
          emissivePulse: true,
          cameraTransition: true
        },
        targetFPS: 55
      };
    
    case 'static':
      return {
        tier: 'static',
        features: {
          boardTilt: false,
          parallax: false,
          emissivePulse: false,
          cameraTransition: false
        },
        targetFPS: 30
      };
    
    default:
      console.warn(`[MotionTierFeatures] Unknown tier: ${tier}, defaulting to lite`);
      return getMotionTierConfig('lite');
  }
}

/**
 * Check if a specific feature is enabled for the current motion tier
 */
export function isFeatureEnabled(
  tier: MotionTier,
  feature: keyof MotionTierConfig['features']
): boolean {
  const config = getMotionTierConfig(tier);
  return config.features[feature];
}

/**
 * Get target FPS for the current motion tier
 */
export function getTargetFPS(tier: MotionTier): number {
  const config = getMotionTierConfig(tier);
  return config.targetFPS;
}

/**
 * Get a human-readable description of the motion tier
 */
export function getMotionTierDescription(tier: MotionTier): string {
  switch (tier) {
    case 'full':
      return 'Full quality with all visual effects (60 FPS target)';
    case 'lite':
      return 'Reduced effects for better performance (55-60 FPS target)';
    case 'static':
      return 'Minimal effects for maximum compatibility (30 FPS target)';
    default:
      return 'Unknown tier';
  }
}
