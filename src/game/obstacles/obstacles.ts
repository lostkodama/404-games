import { GROUND_Y, OBSTACLE_SPAWN_X } from '../constants';
import { OBSTACLE_CONFIG } from './obstacleConfig';
import type { Obstacle, ObstacleState, ObstacleType } from '../types';

export function createObstacle(type: ObstacleType = 'buildingLarge'): Obstacle {
    const config = OBSTACLE_CONFIG[type];
    return {
        type,
        x: OBSTACLE_SPAWN_X,
        y: GROUND_Y - config.renderHeight,
        width: config.renderWidth,
        height: config.renderHeight,
        passed: false
    };
}

export function spawnObstacle(state: ObstacleState) {
    state.obstacles.push(
        createObstacle()
    );
}

export function updateObstacleSpawning(state: ObstacleState, deltaTime: number) {
    state.obstacleSpawnTimer += deltaTime;

    if (state.obstacleSpawnTimer >= state.obstacleSpawnInterval) {
        state.obstacleSpawnTimer -= state.obstacleSpawnInterval;

        spawnObstacle(state);
    }
}

export function updateObstacles(state: ObstacleState, worldSpeed: number, deltaTime: number) {
    for (const obstacle of state.obstacles) {
        obstacle.x -=
            worldSpeed * OBSTACLE_CONFIG[obstacle.type].movementMultiplier * deltaTime;
    }

    // Remove obstacles that have left the screen.
    state.obstacles = state.obstacles.filter(
        (obstacle) =>
            obstacle.x + obstacle.width >= 0
    );
}

export function resetObstacles(state: ObstacleState) {
    state.obstacles = [];
    state.obstacleSpawnTimer = 0;

    spawnObstacle(state);
}
