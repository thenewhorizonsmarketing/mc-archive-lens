import type { GridPosition } from '@/types/kiosk-config';

/**
 * Grid Position Utilities
 * 
 * Calculates 3D positions for tiles in the 3×3 grid layout.
 * 
 * Requirements:
 * - 1.1: Calculate 3×3 grid positions for 8 room tiles around edges and 1 center tile
 */

export interface GridPositionCoordinates {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculate 3D position for a grid position
 * 
 * @param position - Grid position identifier
 * @param tileSize - Size of each tile
 * @param tileGap - Gap between tiles
 * @param yOffset - Y position offset (height)
 * @returns 3D coordinates [x, y, z]
 */
export function calculateGridPosition(
  position: GridPosition,
  tileSize: number = 3.5,
  tileGap: number = 0.15,
  yOffset: number = 0
): [number, number, number] {
  const totalSize = tileSize * 3 + tileGap * 2;
  const startPos = -totalSize / 2 + tileSize / 2;
  const step = tileSize + tileGap;

  // Map grid positions to row/col indices
  const positionMap: Record<GridPosition, { row: number; col: number }> = {
    'top-left': { row: 0, col: 0 },
    'top-center': { row: 0, col: 1 },
    'top-right': { row: 0, col: 2 },
    'middle-left': { row: 1, col: 0 },
    'center': { row: 1, col: 1 },
    'middle-right': { row: 1, col: 2 },
    'bottom-left': { row: 2, col: 0 },
    'bottom-center': { row: 2, col: 1 },
    'bottom-right': { row: 2, col: 2 }
  };

  const { row, col } = positionMap[position];
  
  const x = startPos + col * step;
  const z = startPos + row * step;
  
  return [x, yOffset, z];
}

/**
 * Get all edge positions (excluding center)
 * Used for placing the 8 room tiles around the edges
 */
export function getEdgePositions(): GridPosition[] {
  return [
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ];
}

/**
 * Check if a position is on the edge (not center)
 */
export function isEdgePosition(position: GridPosition): boolean {
  return position !== 'center';
}

/**
 * Get the center position
 */
export function getCenterPosition(): GridPosition {
  return 'center';
}
