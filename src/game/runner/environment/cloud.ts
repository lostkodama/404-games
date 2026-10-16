import {
    CLOUD_SPEED_FACTOR,
    GAME_WIDTH,
    CLOUD_BASE_WIDTH
} from '../constants';
import type { Cloud } from '../types';

export function createClouds(): Cloud[] {
    return [
        {
            x: 80,
            y: 60,
            scale: 1,
        },
        {
            x: 320,
            y: 100,
            scale: 0.7,
        },
        {
            x: 520,
            y: 45,
            scale: 0.85,
        },
    ];
}

export function updateClouds(clouds: Cloud[], worldSpeed: number, deltaTime: number) {
    const cloudSpeed = worldSpeed * CLOUD_SPEED_FACTOR;

    for (const cloud of clouds) {
        cloud.x -= cloudSpeed * deltaTime;

        const cloudWidth = CLOUD_BASE_WIDTH * cloud.scale
        if(cloud.x + cloudWidth < 0) {
            cloud.x = GAME_WIDTH
        }
    }
}