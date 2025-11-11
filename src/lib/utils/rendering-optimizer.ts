import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * RenderingOptimizer
 * 
 * Utility class for optimizing Three.js rendering performance.
 * Implements frustum culling, instanced rendering, draw call minimization,
 * and proper resource disposal.
 * 
 * Requirements:
 * - 7.2: Maintain 60 FPS on target hardware
 * - 7.3: Keep draw calls ≤ 120
 */

export interface RenderStats {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

export class RenderingOptimizer {
  private frustum: THREE.Frustum;
  private cameraViewProjectionMatrix: THREE.Matrix4;
  private disposedObjects: WeakSet<THREE.Object3D>;
  private instancedMeshes: Map<string, THREE.InstancedMesh>;
  
  constructor() {
    this.frustum = new THREE.Frustum();
    this.cameraViewProjectionMatrix = new THREE.Matrix4();
    this.disposedObjects = new WeakSet();
    this.instancedMeshes = new Map();
  }

  /**
   * Perform frustum culling on scene objects
   * Only renders objects visible to the camera
   */
  performFrustumCulling(camera: THREE.Camera, scene: THREE.Scene): void {
    // Update frustum from camera
    camera.updateMatrixWorld();
    this.cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);

    // Traverse scene and update visibility
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Group) {
        // Skip if object has no geometry or is already invisible
        if (!object.visible) return;

        // Check if object is in frustum
        const boundingBox = new THREE.Box3().setFromObject(object);
        object.visible = this.frustum.intersectsBox(boundingBox);
      }
    });
  }

  /**
   * Create instanced mesh for repeated geometry
   * Reduces draw calls by batching identical objects
   */
  createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
    key: string
  ): THREE.InstancedMesh {
    // Check if already created
    if (this.instancedMeshes.has(key)) {
      return this.instancedMeshes.get(key)!;
    }

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instancedMeshes.set(key, instancedMesh);
    
    return instancedMesh;
  }

  /**
   * Update instance matrix for instanced mesh
   */
  updateInstanceMatrix(
    instancedMesh: THREE.InstancedMesh,
    index: number,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ): void {
    const matrix = new THREE.Matrix4();
    matrix.compose(
      position,
      new THREE.Quaternion().setFromEuler(rotation),
      scale
    );
    instancedMesh.setMatrixAt(index, matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Dispose of Three.js objects properly to prevent memory leaks
   */
  disposeObject(object: THREE.Object3D): void {
    // Skip if already disposed
    if (this.disposedObjects.has(object)) {
      return;
    }

    // Mark as disposed
    this.disposedObjects.add(object);

    // Dispose geometry
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }

      // Dispose material(s)
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => this.disposeMaterial(material));
      } else if (object.material) {
        this.disposeMaterial(object.material);
      }
    }

    // Dispose children recursively
    if (object.children && object.children.length > 0) {
      object.children.forEach((child) => this.disposeObject(child));
    }

    // Remove from parent
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Dispose of material and its textures
   */
  private disposeMaterial(material: THREE.Material): void {
    // Dispose textures based on material type
    const textures: (THREE.Texture | null)[] = [];
    
    // Common textures
    if ('map' in material) textures.push(material.map as THREE.Texture | null);
    if ('lightMap' in material) textures.push(material.lightMap as THREE.Texture | null);
    if ('aoMap' in material) textures.push(material.aoMap as THREE.Texture | null);
    if ('alphaMap' in material) textures.push(material.alphaMap as THREE.Texture | null);
    if ('envMap' in material) textures.push(material.envMap as THREE.Texture | null);
    
    // Standard/Phong material textures
    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial) {
      textures.push(
        material.emissiveMap,
        material.bumpMap,
        material.normalMap,
        material.displacementMap
      );
    }
    
    // Standard material specific
    if (material instanceof THREE.MeshStandardMaterial) {
      textures.push(
        material.roughnessMap,
        material.metalnessMap
      );
    }

    textures.forEach((texture) => {
      if (texture) {
        texture.dispose();
      }
    });

    // Dispose material
    material.dispose();
  }

  /**
   * Dispose of entire scene
   */
  disposeScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      this.disposeObject(object);
    });
  }

  /**
   * Get rendering statistics
   */
  getRenderStats(renderer: THREE.WebGLRenderer): RenderStats {
    const info = renderer.info;
    
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length || 0
    };
  }

  /**
   * Optimize renderer settings for performance
   */
  optimizeRenderer(renderer: THREE.WebGLRenderer): void {
    // Enable hardware acceleration
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Optimize shadow maps
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // Manual updates only
    
    // Optimize rendering
    renderer.sortObjects = true; // Sort for optimal rendering order
    
    // Disable unnecessary features
    renderer.autoClear = true;
    renderer.autoClearColor = true;
    renderer.autoClearDepth = true;
    renderer.autoClearStencil = false; // Stencil not needed
  }

  /**
   * Merge geometries to reduce draw calls
   */
  mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    return BufferGeometryUtils.mergeGeometries(geometries, false);
  }

  /**
   * Clean up optimizer resources
   */
  dispose(): void {
    this.instancedMeshes.forEach((mesh) => {
      this.disposeObject(mesh);
    });
    this.instancedMeshes.clear();
  }
}

// Singleton instance
let optimizerInstance: RenderingOptimizer | null = null;

export function getRenderingOptimizer(): RenderingOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new RenderingOptimizer();
  }
  return optimizerInstance;
}

export function disposeRenderingOptimizer(): void {
  if (optimizerInstance) {
    optimizerInstance.dispose();
    optimizerInstance = null;
  }
}
