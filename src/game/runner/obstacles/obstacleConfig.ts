import type { ObstacleType } from '../types';

export interface ObstacleConfig {
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
    readonly sprite: ObstacleConfigSprite | null;
}

export interface ObstacleConfigSprite {
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly frameCount: number;
    readonly columns: number;
}

// Keep existing bounds until type-specific sizing is introduced.
// The renderer fits each frame inside these bounds without stretching it.
export const OBSTACLE_CONFIG = {
    buildingSmall: {
        renderWidth: 32,
        renderHeight: 35,
        movementMultiplier: 1,
        collision: { offsetX: 0, offsetY: 0, width: 32, height: 35 },
        sprite: null,
    },
    buildingLarge: {
        renderWidth: 24,
        renderHeight: 55,
        movementMultiplier: 1,
        collision: { offsetX: 0, offsetY: 0, width: 24, height: 55 },
        sprite: null,
    },
    car: {
        renderWidth: 40,
        renderHeight: 55,
        movementMultiplier: 0.8,
        animationFps: 8,
        collision: { offsetX: 40, offsetY: 16, width: 204, height: 135 },
        sprite: {
            frameWidth: 2172 / 8,
            frameHeight: 151,
            frameCount: 8,
            columns: 8,
        },
    },
} as const satisfies Record<ObstacleType, ObstacleConfig>;
