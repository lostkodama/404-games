import { OBSTACLE_PATTERNS } from './obstaclePatterns';
import type { ObstaclePattern } from '../types';

export function selectObstaclePattern(
    difficultyLevel: number,
    previousType: ObstaclePattern | undefined,
    random: () => number = Math.random
): ObstaclePattern {
    const enabled = (Object.keys(OBSTACLE_PATTERNS) as ObstaclePattern[])
        .filter(type =>
            difficultyLevel >= OBSTACLE_PATTERNS[type].minLevel &&
            OBSTACLE_PATTERNS[type].spawnWeight > 0
        );
    const eligible = enabled.filter(type =>
        type !== previousType || OBSTACLE_PATTERNS[type].allowConsecutive
    );
    // If tuning leaves only a non-repeatable pattern enabled, allow it rather
    // than blocking spawning or selecting a pattern with a zero weight.
    const candidates = eligible.length > 0 ? eligible : enabled;
    const fallback = candidates.at(-1);
    if (fallback === undefined) {
        throw new Error('At least one unlocked obstacle pattern must have a positive spawn weight');
    }

    const totalWeight = candidates.reduce(
        (total, type) => total + OBSTACLE_PATTERNS[type].spawnWeight, 0
    );
    let roll = random() * totalWeight;
    for (const type of candidates) {
        roll -= OBSTACLE_PATTERNS[type].spawnWeight;
        if (roll < 0) {
            return type;
        }
    }
    return fallback;
}
