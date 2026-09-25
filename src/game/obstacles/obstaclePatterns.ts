import type { ObstaclePattern, ObstacleType } from '../types';

// Game pixels between segment bounds; sprite padding may add visible space.
export const BUILDING_GROUP_GAP = 2;

interface ObstaclePatternConfig {
    type: ObstacleType;
    count: number;
    minLevel: number;
    // Relative weight among unlocked, eligible patterns. Zero disables a pattern.
    spawnWeight: number;
    allowConsecutive: boolean;
    // External game-pixel gap AFTER this entire pattern, not between segments.
    minNextGap: number;
    maxNextGap: number;
}

// Conservative fixed ranges for the current 260–800px/s speeds and jump physics.
export const OBSTACLE_PATTERNS = {
    buildingSmall: { type: 'buildingSmall', count: 1, minLevel: 0, spawnWeight: 50, allowConsecutive: true, minNextGap: 450, maxNextGap: 600 },
    buildingLarge: { type: 'buildingLarge', count: 1, minLevel: 0, spawnWeight: 30, allowConsecutive: true, minNextGap: 450, maxNextGap: 600 },
    doubleBuildingSmall: { type: 'buildingSmall', count: 2, minLevel: 0, spawnWeight: 15, allowConsecutive: false, minNextGap: 450, maxNextGap: 600 },
    doubleBuildingLarge: { type: 'buildingLarge', count: 2, minLevel: 1, spawnWeight: 8, allowConsecutive: false, minNextGap: 450, maxNextGap: 650 },
    car: { type: 'car', count: 1, minLevel: 3, spawnWeight: 7, allowConsecutive: false, minNextGap: 400, maxNextGap: 600 },
} as const satisfies Record<ObstaclePattern, ObstaclePatternConfig>;
