# 3D Asset Pipeline

This directory contains the 3D assets for the Clue Board Kiosk.

## Directory Structure

```
public/assets/
├── models/          # Source glTF/GLB files
├── textures/        # Source texture images (PNG/JPG)
├── optimized/       # Optimized assets (generated)
│   ├── models/      # Draco-compressed models
│   └── textures/    # WebP-compressed textures
└── manifest.json    # Asset manifest (generated)
```

## Asset Requirements

### Models
- Format: glTF 2.0 (.gltf or .glb)
- Target: ≤350 KB per room after compression
- Compression: Draco (applied automatically)

### Textures
- Format: PNG or JPG (source), WebP (output)
- Resolutions:
  - 2k: 2048x2048 max (≤512 KB target)
  - 1k: 1024x1024 max (≤256 KB target)
- Naming: Include "2k" or "1k" in filename for proper processing

### Performance Budgets
- Total payload: ≤3.5 MB
- Per-room assets: ≤350 KB
- 2k textures: ≤512 KB each
- 1k textures: ≤256 KB each

## Optimization Workflow

1. **Add source assets** to `models/` and `textures/` directories

2. **Run optimization**:
   ```bash
   npm run optimize:assets
   ```

3. **Review output**:
   - Optimized files in `optimized/` directory
   - Asset manifest in `manifest.json`
   - Budget validation results in console

4. **Commit optimized assets** to version control

## Asset Naming Conventions

### Models
- `board-frame.glb` - Walnut frame geometry
- `glass-pane.glb` - Glass overlay
- `room-tile-{name}.glb` - Individual room tiles
- `center-logo.glb` - Center branding tile

### Textures
- `walnut-wood-2k.png` - Walnut wood material
- `brass-metal-2k.png` - Brass material
- `marble-green-2k.png` - Board floor material
- `glass-normal-1k.png` - Glass normal map
- `glass-roughness-1k.png` - Glass roughness map

## KTX2 Texture Compression (Future)

For production deployment, consider using KTX2/Basis Universal compression:

```bash
# Install KTX-Software tools
# https://github.com/KhronosGroup/KTX-Software

# Compress textures
toktx --bcmp --genmipmap output.ktx2 input.png
```

## Draco Compression Settings

The optimization script uses these Draco settings:
- Compression level: 10 (maximum)
- Position quantization: 14 bits
- Normal quantization: 10 bits
- Texcoord quantization: 12 bits
- Color quantization: 8 bits

## Troubleshooting

### Assets too large
- Reduce texture resolution
- Simplify geometry (reduce polygon count)
- Use texture atlasing for multiple materials
- Consider LOD (Level of Detail) models

### Quality issues
- Adjust Draco quantization bits (higher = better quality, larger size)
- Use higher quality WebP settings
- Keep source files at higher resolution

### Missing dependencies
```bash
npm install --save-dev gltf-pipeline sharp
```
