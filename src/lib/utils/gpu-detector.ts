/**
 * GPU Capability Detector
 * 
 * Detects GPU capabilities on boot to assign initial motion tier.
 * 
 * Requirements:
 * - 6.1: Detect device capabilities and assign Motion Tier on boot
 * - 6.2: Full tier targets 60 FPS with all effects
 * - 6.3: Lite tier targets 55-60 FPS with reduced effects
 * - 6.4: Static tier uses cross-fade only
 */

export interface GPUCapabilities {
  /** WebGL version (0 = not available, 1 = WebGL 1.0, 2 = WebGL 2.0) */
  webglVersion: number;
  /** GPU vendor (e.g., "NVIDIA", "AMD", "Intel") */
  vendor: string;
  /** GPU renderer string */
  renderer: string;
  /** Maximum texture size */
  maxTextureSize: number;
  /** Maximum vertex attributes */
  maxVertexAttributes: number;
  /** Maximum varying vectors */
  maxVaryingVectors: number;
  /** Maximum fragment uniform vectors */
  maxFragmentUniforms: number;
  /** Maximum vertex uniform vectors */
  maxVertexUniforms: number;
  /** Supports floating point textures */
  supportsFloatTextures: boolean;
  /** Supports anisotropic filtering */
  supportsAnisotropic: boolean;
  /** Maximum anisotropy level */
  maxAnisotropy: number;
  /** Supports instanced rendering */
  supportsInstancing: boolean;
  /** Supports compressed textures */
  supportsCompressedTextures: boolean;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Screen resolution */
  screenResolution: { width: number; height: number };
  /** Total pixel count */
  totalPixels: number;
  /** Estimated GPU tier (high/medium/low) */
  gpuTier: 'high' | 'medium' | 'low';
}

export type MotionTier = 'full' | 'lite' | 'static';

/**
 * Detect WebGL capabilities
 */
function detectWebGLCapabilities(): Partial<GPUCapabilities> {
  const canvas = document.createElement('canvas');
  
  // Try WebGL 2.0 first
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = 
    canvas.getContext('webgl2') || 
    canvas.getContext('webgl') || 
    canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  
  if (!gl) {
    console.warn('[GPUDetector] WebGL not available');
    return {
      webglVersion: 0,
      vendor: 'Unknown',
      renderer: 'Unknown',
      gpuTier: 'low'
    };
  }
  
  const isWebGL2 = gl instanceof WebGL2RenderingContext;
  const webglVersion = isWebGL2 ? 2 : 1;
  
  // Get GPU info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) 
    : gl.getParameter(gl.VENDOR);
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) 
    : gl.getParameter(gl.RENDERER);
  
  // Get capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  const maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
  const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  
  // Check for extensions
  const floatTextureExt = gl.getExtension('OES_texture_float') || 
                          gl.getExtension('OES_texture_half_float');
  const supportsFloatTextures = !!floatTextureExt;
  
  const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic') ||
                         gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                         gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  const supportsAnisotropic = !!anisotropicExt;
  const maxAnisotropy = anisotropicExt 
    ? gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) 
    : 1;
  
  const instancedExt = gl.getExtension('ANGLE_instanced_arrays');
  const supportsInstancing = isWebGL2 || !!instancedExt;
  
  const compressedTextureExt = gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                               gl.getExtension('WEBGL_compressed_texture_etc') ||
                               gl.getExtension('WEBGL_compressed_texture_astc');
  const supportsCompressedTextures = !!compressedTextureExt;
  
  return {
    webglVersion,
    vendor: String(vendor),
    renderer: String(renderer),
    maxTextureSize,
    maxVertexAttributes,
    maxVaryingVectors,
    maxFragmentUniforms,
    maxVertexUniforms,
    supportsFloatTextures,
    supportsAnisotropic,
    maxAnisotropy,
    supportsInstancing,
    supportsCompressedTextures
  };
}

/**
 * Detect screen and device capabilities
 */
function detectScreenCapabilities(): Partial<GPUCapabilities> {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const screenResolution = {
    width: window.screen.width,
    height: window.screen.height
  };
  const totalPixels = screenResolution.width * screenResolution.height * devicePixelRatio * devicePixelRatio;
  
  return {
    devicePixelRatio,
    screenResolution,
    totalPixels
  };
}

/**
 * Estimate GPU tier based on capabilities
 */
function estimateGPUTier(capabilities: Partial<GPUCapabilities>): 'high' | 'medium' | 'low' {
  // No WebGL = low tier
  if (!capabilities.webglVersion || capabilities.webglVersion === 0) {
    return 'low';
  }
  
  const renderer = (capabilities.renderer || '').toLowerCase();
  const vendor = (capabilities.vendor || '').toLowerCase();
  
  // Check for known low-end GPUs
  const lowEndPatterns = [
    'intel hd graphics 3000',
    'intel hd graphics 4000',
    'intel hd graphics 5000',
    'intel hd graphics 6000',
    'intel uhd graphics 600',
    'intel uhd graphics 605',
    'intel uhd graphics 610',
    'intel uhd graphics 615',
    'intel uhd graphics 620',
    'mali-400',
    'mali-450',
    'adreno 3',
    'adreno 4',
    'powervr sgx',
    'swiftshader'
  ];
  
  for (const pattern of lowEndPatterns) {
    if (renderer.includes(pattern)) {
      console.log(`[GPUDetector] Low-end GPU detected: ${renderer}`);
      return 'low';
    }
  }
  
  // Check for high-end GPUs
  const highEndPatterns = [
    'nvidia geforce rtx',
    'nvidia geforce gtx 16',
    'nvidia geforce gtx 20',
    'nvidia geforce gtx 30',
    'nvidia geforce gtx 40',
    'nvidia quadro rtx',
    'amd radeon rx 5',
    'amd radeon rx 6',
    'amd radeon rx 7',
    'amd radeon pro',
    'apple m1',
    'apple m2',
    'apple m3',
    'intel iris xe',
    'intel arc'
  ];
  
  for (const pattern of highEndPatterns) {
    if (renderer.includes(pattern)) {
      console.log(`[GPUDetector] High-end GPU detected: ${renderer}`);
      return 'high';
    }
  }
  
  // Check capabilities
  const maxTextureSize = capabilities.maxTextureSize || 0;
  const totalPixels = capabilities.totalPixels || 0;
  const webglVersion = capabilities.webglVersion || 0;
  
  // High tier: WebGL 2.0, large textures, reasonable resolution
  if (webglVersion === 2 && maxTextureSize >= 8192 && totalPixels <= 8294400) { // <= 4K
    return 'high';
  }
  
  // Low tier: WebGL 1.0 only, small textures, or very high resolution
  if (webglVersion === 1 || maxTextureSize < 4096 || totalPixels > 16588800) { // > 4K
    return 'low';
  }
  
  // Default to medium
  return 'medium';
}

/**
 * Detect all GPU capabilities
 */
export function detectGPUCapabilities(): GPUCapabilities {
  console.log('[GPUDetector] Detecting GPU capabilities...');
  
  const webglCaps = detectWebGLCapabilities();
  const screenCaps = detectScreenCapabilities();
  
  const capabilities: GPUCapabilities = {
    webglVersion: webglCaps.webglVersion || 0,
    vendor: webglCaps.vendor || 'Unknown',
    renderer: webglCaps.renderer || 'Unknown',
    maxTextureSize: webglCaps.maxTextureSize || 0,
    maxVertexAttributes: webglCaps.maxVertexAttributes || 0,
    maxVaryingVectors: webglCaps.maxVaryingVectors || 0,
    maxFragmentUniforms: webglCaps.maxFragmentUniforms || 0,
    maxVertexUniforms: webglCaps.maxVertexUniforms || 0,
    supportsFloatTextures: webglCaps.supportsFloatTextures || false,
    supportsAnisotropic: webglCaps.supportsAnisotropic || false,
    maxAnisotropy: webglCaps.maxAnisotropy || 1,
    supportsInstancing: webglCaps.supportsInstancing || false,
    supportsCompressedTextures: webglCaps.supportsCompressedTextures || false,
    devicePixelRatio: screenCaps.devicePixelRatio || 1,
    screenResolution: screenCaps.screenResolution || { width: 1920, height: 1080 },
    totalPixels: screenCaps.totalPixels || 0,
    gpuTier: 'medium' // Will be set below
  };
  
  // Estimate GPU tier
  capabilities.gpuTier = estimateGPUTier(capabilities);
  
  console.log('[GPUDetector] GPU capabilities detected:', {
    vendor: capabilities.vendor,
    renderer: capabilities.renderer,
    webglVersion: capabilities.webglVersion,
    gpuTier: capabilities.gpuTier,
    maxTextureSize: capabilities.maxTextureSize,
    screenResolution: capabilities.screenResolution,
    devicePixelRatio: capabilities.devicePixelRatio
  });
  
  return capabilities;
}

/**
 * Determine initial motion tier based on GPU capabilities
 * 
 * Requirements:
 * - 6.1: Detect device capabilities and assign Motion Tier on boot
 * - 6.2: Full tier - board tilt + parallax + emissive pulses (60 FPS target)
 * - 6.3: Lite tier - parallax only, no tilt (55-60 FPS target)
 * - 6.4: Static tier - cross-fade highlights only
 */
export function determineMotionTier(capabilities: GPUCapabilities): MotionTier {
  console.log('[GPUDetector] Determining motion tier...');
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('[GPUDetector] Reduced motion preference detected, using static tier');
    return 'static';
  }
  
  // No WebGL = static tier
  if (capabilities.webglVersion === 0) {
    console.log('[GPUDetector] No WebGL support, using static tier');
    return 'static';
  }
  
  // Determine tier based on GPU tier
  switch (capabilities.gpuTier) {
    case 'high':
      console.log('[GPUDetector] High-end GPU detected, using full tier');
      return 'full';
    
    case 'medium':
      console.log('[GPUDetector] Medium-tier GPU detected, using lite tier');
      return 'lite';
    
    case 'low':
      console.log('[GPUDetector] Low-end GPU detected, using static tier');
      return 'static';
    
    default:
      console.log('[GPUDetector] Unknown GPU tier, defaulting to lite tier');
      return 'lite';
  }
}

/**
 * Detect GPU capabilities and determine initial motion tier
 * This is the main entry point for motion tier detection
 */
export function detectAndAssignMotionTier(): {
  capabilities: GPUCapabilities;
  motionTier: MotionTier;
} {
  const capabilities = detectGPUCapabilities();
  const motionTier = determineMotionTier(capabilities);
  
  console.log('[GPUDetector] Motion tier assigned:', motionTier);
  
  return {
    capabilities,
    motionTier
  };
}
