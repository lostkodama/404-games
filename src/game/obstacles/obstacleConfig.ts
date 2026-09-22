import type { ObstacleType } from '../types';

export interface ObstacleConfig {
    readonly renderWidth: number;
    readonly renderHeight: number;
    // Effective screen velocity is -worldSpeed * movementMultiplier.
    // A value between 0 and 1 moves right relative to the scrolling world.
    readonly movementMultiplier: number;
    readonly sprite: {
        readonly src: string;
        readonly frameWidth: number;
        readonly frameHeight: number;
        readonly frameCount: number;
        readonly columns: number;
    };
}

// Keep existing bounds and movement until type-specific tuning is introduced.
// The renderer fits each frame inside these bounds without stretching it.
export const OBSTACLE_CONFIG = {
    buildingSmall: {
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 1,
        sprite: {
            src: '/sprites/building-small.png',
            frameWidth: 344,
            frameHeight: 441,
            frameCount: 1,
            columns: 1,
        },
    },
    buildingLarge: {
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 1,
        sprite: {
            src: '/sprites/building-large.png',
            frameWidth: 348,
            frameHeight: 591,
            frameCount: 1,
            columns: 1,
        },
    },
    car: {
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 1,
        sprite: {
            src: '/sprites/car.png',
            frameWidth: 2172 / 8,
            frameHeight: 151,
            frameCount: 8,
            columns: 8,
        },
    },
} as const satisfies Record<ObstacleType, ObstacleConfig>;
