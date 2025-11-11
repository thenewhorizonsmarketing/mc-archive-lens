/**
 * WebGL Detection Utility
 * Detects WebGL support and version
 */

export interface WebGLCapabilities {
  available: boolean;
  version: number; // 1 or 2
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  extensions: string[];
}

/**
 * Detect WebGL support and capabilities
 */
export function detectWebGL(): WebGLCapabilities {
  const canvas = document.createElement('canvas');
  
  // Try WebGL 2 first
  let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  let version = 2;
  
  // Fall back to WebGL 1
  if (!gl) {
    gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    version = 1;
  }
  
  // No WebGL support
  if (!gl) {
    return {
      available: false,
      version: 0,
      renderer: 'none',
      vendor: 'none',
      maxTextureSize: 0,
      maxVertexUniforms: 0,
      maxFragmentUniforms: 0,
      extensions: []
    };
  }
  
  // Get debug info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) 
    : 'unknown';
  const vendor = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) 
    : 'unknown';
  
  // Get capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  const maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  
  // Get extensions
  const extensions = gl.getSupportedExtensions() || [];
  
  // Clean up
  const loseContext = gl.getExtension('WEBGL_lose_context');
  if (loseContext) {
    loseContext.loseContext();
  }
  
  return {
    available: true,
    version,
    renderer,
    vendor,
    maxTextureSize,
    maxVertexUniforms,
    maxFragmentUniforms,
    extensions
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Determine if 3D mode should be used
 * Returns false if WebGL is unavailable or reduced motion is preferred
 */
export function should3DMode(): boolean {
  const webgl = detectWebGL();
  const reducedMotion = prefersReducedMotion();
  
  return webgl.available && !reducedMotion;
}

/**
 * Log WebGL capabilities to console
 */
export function logWebGLCapabilities(capabilities: WebGLCapabilities): void {
  console.group('[WebGL] Capabilities');
  console.log('Available:', capabilities.available);
  console.log('Version:', capabilities.version);
  console.log('Renderer:', capabilities.renderer);
  console.log('Vendor:', capabilities.vendor);
  console.log('Max Texture Size:', capabilities.maxTextureSize);
  console.log('Max Vertex Uniforms:', capabilities.maxVertexUniforms);
  console.log('Max Fragment Uniforms:', capabilities.maxFragmentUniforms);
  console.log('Extensions:', capabilities.extensions.length);
  console.groupEnd();
}
