# Asset Optimization Guide

## Overview

This guide explains how to optimize 3D assets (models and textures) for the 3D Clue Board Kiosk to meet performance budgets and ensure smooth operation.

---

## Performance Budgets

The kiosk has strict performance budgets to ensure 60 FPS operation:

| Asset Type | Budget | Notes |
|------------|--------|-------|
| Total Payload | 3.5 MB | All assets combined |
| Per-Room Assets | 350 KB | Models + textures per room |
| 2K Textures | 512 KB | Desktop/full tier |
| 1K Textures | 256 KB | Lite tier |
| Draw Calls | ≤ 120 | Per frame |

**Requirements**: 7.1, 7.4, 7.5, 7.6, 7.7

---

## Asset Preparation

### 3D Models

**Recommended Format**: glTF 2.0 (.gltf or .glb)

**Best Practices**:
- Keep polygon count reasonable (< 50k triangles per room)
- Use single combined model file per room
- Remove unnecessary vertices and faces
- Merge duplicate vertices
- Remove hidden geometry
- Use efficient topology (quads over triangles where possible)
- Bake lighting and ambient occlusion
- Use instancing for repeated elements

**Tools**:
- Blender (free, open-source)
- Maya
- 3ds Max
- Houdini

### Textures

**Recommended Formats**:
- Source: PNG or JPEG
- Optimized: KTX2 (with Basis Universal) or WebP

**Best Practices**:
- Use power-of-2 dimensions (1024x1024, 2048x2048)
- Create two versions: 2K for desktop, 1K for lite tier
- Use texture atlases to reduce draw calls
- Bake lighting into textures where possible
- Use normal maps instead of high-poly geometry
- Compress textures aggressively
- Use mipmaps for better performance

**Texture Types**:
- Base Color (albedo)
- Normal Map
- Roughness/Metallic (combined)
- Ambient Occlusion (baked)
- Emissive (for glowing elements)

---

## Optimization Workflow

### Step 1: Prepare Source Assets

1. **Place source assets in directories**:
   ```
   public/assets/models/     - Source 3D models (.gltf, .glb)
   public/assets/textures/   - Source textures (.png, .jpg)
   ```

2. **Name files consistently**:
   ```
   room-alumni.glb
   room-alumni-basecolor-2k.png
   room-alumni-normal-2k.png
   room-publications.glb
   room-publications-basecolor-2k.png
   ```

### Step 2: Optimize Geometry with Draco

Draco compression reduces model file sizes by 90%+ with minimal quality loss.

```bash
npm run optimize:geometry:draco
```

**What it does**:
- Compresses vertex positions, normals, UVs
- Reduces file size dramatically
- Maintains visual quality
- Adds Draco extension to glTF

**Output**: `public/assets/optimized/models/`

**Settings**:
- Compression level: 10 (maximum)
- Position bits: 14 (high precision)
- Normal bits: 10 (medium precision)
- Texcoord bits: 12 (high precision)

### Step 3: Optimize Textures with KTX2

KTX2 with Basis Universal provides GPU-native texture compression.

```bash
npm run optimize:textures:ktx2
```

**What it does**:
- Compresses textures to KTX2 format
- Creates 2K and 1K versions
- Generates mipmaps automatically
- Uses UASTC for 2K (quality) and ETC1S for 1K (size)

**Output**: `public/assets/optimized/textures/`

**Requirements**:
- Install KTX-Software: https://github.com/KhronosGroup/KTX-Software
- Or use gltf-transform: `npm install -g @gltf-transform/cli`

**Alternative (WebP)**:

If KTX2 tools not available, use WebP compression:

```bash
npm run optimize:assets
```

This uses Sharp to compress textures to WebP format.

### Step 4: Validate Assets

Check that all assets meet performance budgets:

```bash
npm run validate:assets
```

**What it checks**:
- Total payload size ≤ 3.5 MB
- Per-room assets ≤ 350 KB
- Texture sizes within budgets
- Compression applied to models

**Output**:
```
📦 Validating Asset Manifest

📊 Metrics:
  Total Size: 2.8 MB / 3.5 MB
  Models: 8 (1.2 MB)
  Textures: 16 (1.6 MB)

✅ Validation PASSED
```

### Step 5: Run Complete Optimization

Run all optimization steps in sequence:

```bash
npm run optimize:all
```

This runs:
1. Draco geometry compression
2. KTX2 texture compression
3. Asset manifest generation
4. Budget validation

---

## Optimization Scripts

### optimize-assets.js

Main optimization script using WebP compression.

**Usage**:
```bash
npm run optimize:assets
```

**Features**:
- Draco compression for models
- WebP compression for textures
- Generates asset manifest
- Validates budgets

### compress-geometry-draco.js

Specialized Draco compression for 3D models.

**Usage**:
```bash
npm run optimize:geometry:draco
```

**Features**:
- Maximum compression (level 10)
- Preserves visual quality
- Validates compressed models
- Reports compression ratios

### compress-textures-ktx2.js

KTX2 texture compression with Basis Universal.

**Usage**:
```bash
npm run optimize:textures:ktx2
```

**Features**:
- Creates 2K and 1K variants
- UASTC for quality (2K)
- ETC1S for size (1K)
- Automatic mipmap generation

### validate-assets.cjs

Asset budget validation.

**Usage**:
```bash
npm run validate:assets
```

**Features**:
- Checks total payload
- Validates per-room budgets
- Checks texture sizes
- Reports warnings and errors

---

## Asset Manifest

The asset manifest (`public/assets/manifest.json`) lists all optimized assets:

```json
{
  "version": "1.0.0",
  "generated": "2025-11-10T12:00:00.000Z",
  "models": [
    {
      "id": "room-alumni",
      "path": "/assets/optimized/models/room-alumni.glb",
      "format": "glb",
      "compression": "draco",
      "size": 145234
    }
  ],
  "textures": [
    {
      "id": "room-alumni-basecolor-2k",
      "path": "/assets/optimized/textures/room-alumni-basecolor-2k.ktx2",
      "format": "ktx2",
      "resolution": "2k",
      "size": 487234
    }
  ]
}
```

This manifest is used by the AssetLoader to preload assets efficiently.

---

## Troubleshooting

### Draco Compression Fails

**Error**: `gltf-pipeline not found`

**Solution**:
```bash
npm install gltf-pipeline
```

### KTX2 Compression Fails

**Error**: `basisu tool not found`

**Solutions**:

1. Install KTX-Software:
   - Download from: https://github.com/KhronosGroup/KTX-Software
   - Add to PATH

2. Or use gltf-transform:
   ```bash
   npm install -g @gltf-transform/cli
   ```

3. Or fall back to WebP:
   ```bash
   npm run optimize:assets
   ```

### Assets Exceed Budget

**Problem**: Validation fails due to size limits

**Solutions**:

1. **Reduce polygon count**:
   - Decimate meshes in Blender
   - Remove unnecessary detail
   - Use LOD (Level of Detail)

2. **Reduce texture resolution**:
   - Use 1K instead of 2K
   - Increase compression
   - Use texture atlases

3. **Remove unnecessary data**:
   - Delete unused materials
   - Remove hidden geometry
   - Merge duplicate vertices

4. **Split large models**:
   - Break into smaller pieces
   - Load on-demand
   - Use instancing

### Poor Visual Quality After Compression

**Problem**: Models or textures look bad after optimization

**Solutions**:

1. **Adjust Draco settings**:
   - Increase quantization bits
   - Edit `scripts/compress-geometry-draco.js`
   - Increase `quantizePositionBits` to 16

2. **Use UASTC for all textures**:
   - Edit `scripts/compress-textures-ktx2.js`
   - Set `uastc: true` for 1K textures

3. **Use higher resolution**:
   - Keep 2K textures for important surfaces
   - Use 1K only for backgrounds

---

## Best Practices

### Model Optimization

1. **Use single glTF file per room**
   - Combine all room elements
   - Reduces draw calls
   - Easier to manage

2. **Bake lighting**
   - Pre-calculate shadows
   - Reduces real-time computation
   - Better performance

3. **Use instancing**
   - Reuse geometry for repeated elements
   - Reduces memory usage
   - Faster rendering

4. **Optimize materials**
   - Combine textures into atlases
   - Use shared materials
   - Minimize material count

### Texture Optimization

1. **Use appropriate resolutions**
   - 2K for hero elements
   - 1K for backgrounds
   - 512px for small details

2. **Compress aggressively**
   - Users won't notice on 4K display
   - Performance is more important
   - Test on target hardware

3. **Use texture atlases**
   - Combine multiple textures
   - Reduces draw calls
   - Better performance

4. **Generate mipmaps**
   - Improves rendering quality
   - Better performance at distance
   - Reduces aliasing

### Testing

1. **Test on target hardware**
   - 55" 4K touchscreen
   - Windows 10 kiosk
   - Actual GPU

2. **Monitor performance**
   - Check FPS (target 60)
   - Check draw calls (≤ 120)
   - Check memory usage

3. **Test all motion tiers**
   - Full tier (all effects)
   - Lite tier (reduced effects)
   - Static tier (fallback)

---

## Asset Checklist

Before deploying, verify:

- [ ] All models compressed with Draco
- [ ] All textures compressed (KTX2 or WebP)
- [ ] 2K and 1K texture variants created
- [ ] Asset manifest generated
- [ ] Budget validation passed
- [ ] Visual quality acceptable
- [ ] Performance tested on target hardware
- [ ] All 8 rooms optimized
- [ ] Draw calls ≤ 120
- [ ] FPS ≥ 55 (target 60)

---

## References

- **glTF 2.0 Specification**: https://www.khronos.org/gltf/
- **Draco Compression**: https://google.github.io/draco/
- **Basis Universal**: https://github.com/BinomialLLC/basis_universal
- **KTX2 Format**: https://www.khronos.org/ktx/
- **gltf-pipeline**: https://github.com/CesiumGS/gltf-pipeline
- **Sharp (Image Processing)**: https://sharp.pixelplumbing.com/

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025
