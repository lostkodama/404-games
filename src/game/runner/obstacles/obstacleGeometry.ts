import type { Obstacle, ObstacleSegment, Rect } from '../types';

// Returns the full rectangular area occupied by a segment before sprite fitting
// or collision offsets are applied.
export function getObstacleSegmentPlacementBounds(
    obstacle: Obstacle,
    segment: ObstacleSegment,
): Rect {
    return {
        x: obstacle.x + segment.offsetX,
        y: obstacle.y + obstacle.height - segment.height,
        width: segment.width,
        height: segment.height,
    };
}
