import { OBSTACLE_CONFIG } from './obstacleConfig';
import type { ObstacleType } from '../types';

export function selectObstacleType(
    previousType: ObstacleType | undefined,
    random: () => number = Math.random
): ObstacleType {
    const enabled = (Object.keys(OBSTACLE_CONFIG) as ObstacleType[])
        .filter(type => OBSTACLE_CONFIG[type].spawnWeight > 0);
    const eligible = enabled.filter(type =>
        type !== previousType || OBSTACLE_CONFIG[type].allowConsecutive
    );
    // If tuning leaves only a non-repeatable type enabled, allow it rather
    // than blocking spawning or selecting a type with a zero weight.
    const candidates = eligible.length > 0 ? eligible : enabled;
    const fallback = candidates.at(-1);
    if (fallback === undefined) {
        throw new Error('At least one obstacle type must have a positive spawn weight');
    }

    const totalWeight = candidates.reduce(
        (total, type) => total + OBSTACLE_CONFIG[type].spawnWeight, 0
    );
    let roll = random() * totalWeight;
    for (const type of candidates) {
        roll -= OBSTACLE_CONFIG[type].spawnWeight;
        if (roll < 0) {
            return type;
        }
    }
    return fallback;
}
