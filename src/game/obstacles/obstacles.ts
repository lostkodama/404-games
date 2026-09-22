import { GROUND_Y, OBSTACLE_HEIGHT, OBSTACLE_SPAWN_X, OBSTACLE_WIDTH } from '../constants';
import type { Obstacle, ObstacleState, ObstacleType } from '../types';

export function createObstacle(type: ObstacleType = 'buildingSmall'): Obstacle {
    return {
        type,
        x: OBSTACLE_SPAWN_X,
        y: GROUND_Y - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
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
            worldSpeed * deltaTime;
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
