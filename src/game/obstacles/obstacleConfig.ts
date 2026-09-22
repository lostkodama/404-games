import type { ObstacleType } from '../types';

export interface ObstacleConfig {
    readonly spawnWeight: number;
    readonly allowConsecutive: boolean;
    readonly renderWidth: number;
    readonly renderHeight: number;
    // Effective screen velocity is -Math.max(0, worldSpeed * movementMultiplier).
    // A value between 0 and 1 moves right relative to the scrolling world.
    readonly movementMultiplier: number;
    readonly animationFps?: number;
    // Sprite-frame pixels, measured from the top-left of one frame.
    // Scaled and aligned with the rendered sprite, independently of its bounds.
    readonly collision: {
        readonly offsetX: number;
        readonly offsetY: number;
        readonly width: number;
        readonly height: number;
    };
    readonly sprite: {
        readonly src: string;
        readonly frameWidth: number;
        readonly frameHeight: number;
        readonly frameCount: number;
        readonly columns: number;
    };
}

// Keep existing bounds until type-specific sizing is introduced.
// The renderer fits each frame inside these bounds without stretching it.
export const OBSTACLE_CONFIG = {
    buildingSmall: {
        spawnWeight: 5,
        allowConsecutive: true,
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 1,
        collision: { offsetX: 12, offsetY: 12, width: 320, height: 429 },
        sprite: {
            src: '/sprites/building-small.png',
            frameWidth: 344,
            frameHeight: 441,
            frameCount: 1,
            columns: 1,
        },
    },
    buildingLarge: {
        spawnWeight: 3,
        allowConsecutive: false,
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 1,
        collision: { offsetX: 12, offsetY: 12, width: 324, height: 579 },
        sprite: {
            src: '/sprites/building-large.png',
            frameWidth: 348,
            frameHeight: 591,
            frameCount: 1,
            columns: 1,
        },
    },
    car: {
        spawnWeight: 2,
        allowConsecutive: true,
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 0.8,
        animationFps: 8,
        collision: { offsetX: 40, offsetY: 16, width: 204, height: 135 },
        sprite: {
            src: '/sprites/car.png',
            frameWidth: 2172 / 8,
            frameHeight: 151,
            frameCount: 8,
            columns: 8,
        },
    },
} as const satisfies Record<ObstacleType, ObstacleConfig>;
