import {OBSTACLE_TYPE, type ObstaclePattern, type ObstacleType} from '../types';

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

// Conservative fixed ranges for the current 260–690px/s speeds and jump physics.
export const OBSTACLE_PATTERNS = {
    buildingSmall: { type: OBSTACLE_TYPE.BUILDING_SMALL, count: 1, minLevel: 0, spawnWeight: 50, allowConsecutive: true, minNextGap: 450, maxNextGap: 600 },
    buildingLarge: { type: OBSTACLE_TYPE.BUILDING_LARGE, count: 1, minLevel: 0, spawnWeight: 30, allowConsecutive: true, minNextGap: 450, maxNextGap: 600 },
    doubleBuildingSmall: { type: OBSTACLE_TYPE.BUILDING_SMALL, count: 2, minLevel: 0, spawnWeight: 15, allowConsecutive: false, minNextGap: 450, maxNextGap: 600 },
    doubleBuildingLarge: { type: OBSTACLE_TYPE.BUILDING_LARGE, count: 2, minLevel: 1, spawnWeight: 15, allowConsecutive: false, minNextGap: 450, maxNextGap: 650 },
    tripleBuildingSmall: { type: OBSTACLE_TYPE.BUILDING_SMALL, count: 3, minLevel: 4, spawnWeight: 10, allowConsecutive: false, minNextGap: 550, maxNextGap: 650 },
    car: { type: OBSTACLE_TYPE.CAR, count: 1, minLevel: 3, spawnWeight: 12, allowConsecutive: true, minNextGap: 400, maxNextGap: 600 },
} as const satisfies Record<ObstaclePattern, ObstaclePatternConfig>;
