import { GROUND_Y, OBSTACLE_SPAWN_X } from '../constants';
import { OBSTACLE_CONFIG } from './obstacleConfig';
import type { Obstacle, ObstacleState, ObstacleType } from '../types';

export function createObstacle(type: ObstacleType): Obstacle {
    const config = OBSTACLE_CONFIG[type];
    const obstacle = {
        x: OBSTACLE_SPAWN_X,
        y: GROUND_Y - config.renderHeight,
        width: config.renderWidth,
        height: config.renderHeight,
        passed: false
    };

    if (type === 'car') {
        return { ...obstacle, type, animationTime: 0, animationFrameIndex: 0 };
    }
    return { ...obstacle, type };
}

export function spawnObstacle(state: ObstacleState) {
    state.obstacles.push(
        // Switch to 'buildingSmall' or 'car' here for manual testing.
        createObstacle('buildingLarge')
    );
}

export function updateObstacleSpawning(state: ObstacleState, deltaTime: number) {
    state.obstacleSpawnTimer += deltaTime;

    if (state.obstacleSpawnTimer >= state.obstacleSpawnInterval) {
        state.obstacleSpawnTimer -= state.obstacleSpawnInterval;

        spawnObstacle(state);
    }
}

function updateObstacleAnimation(obstacle: Obstacle, deltaTime: number) {
    if (obstacle.type !== 'car') {
        return;
    }

    const config = OBSTACLE_CONFIG.car;
    const frameDuration = 1 / config.animationFps;
    obstacle.animationTime += deltaTime;

    while (obstacle.animationTime >= frameDuration) {
        obstacle.animationTime -= frameDuration;
        obstacle.animationFrameIndex =
            (obstacle.animationFrameIndex + 1) % config.sprite.frameCount;
    }
}

export function updateObstacles(state: ObstacleState, worldSpeed: number, deltaTime: number) {
    for (const obstacle of state.obstacles) {
        const speed = Math.max(
            0,
            worldSpeed * OBSTACLE_CONFIG[obstacle.type].movementMultiplier
        );
        obstacle.x -= speed * deltaTime;
        updateObstacleAnimation(obstacle, deltaTime);
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
