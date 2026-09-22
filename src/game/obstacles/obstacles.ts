import { GROUND_Y, MAX_OBSTACLE_GAP, MIN_OBSTACLE_GAP, OBSTACLE_SPAWN_X } from '../constants';
import { OBSTACLE_CONFIG } from './obstacleConfig';
import { selectObstacleType } from './obstacleSelection';
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

export function spawnObstacle(state: ObstacleState, random: () => number = Math.random) {
    const type = selectObstacleType(state.lastSpawnedObstacle?.type, random);
    const obstacle = createObstacle(type);
    state.obstacles.push(obstacle);
    state.lastSpawnedObstacle = obstacle;
    // Sample once per successful spawn, not once per update.
    state.nextObstacleGap = MIN_OBSTACLE_GAP + Math.floor(
        random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP + 1)
    );
}

export function updateObstacleSpawning(state: ObstacleState, random: () => number = Math.random) {
    const previous = state.lastSpawnedObstacle;
    const previousRight = previous ? previous.x + previous.width : undefined;

    if (previousRight === undefined || OBSTACLE_SPAWN_X - previousRight >= state.nextObstacleGap) {
        spawnObstacle(state, random);
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

function moveObstacle(obstacle: Obstacle, worldSpeed: number, deltaTime: number) {
    const speed = Math.max(
        0,
        worldSpeed * OBSTACLE_CONFIG[obstacle.type].movementMultiplier
    );
    obstacle.x -= speed * deltaTime;
}

export function updateObstacles(state: ObstacleState, worldSpeed: number, deltaTime: number) {
    // Continue measuring distance after the last obstacle is removed off-screen.
    // While it is still active, the loop below moves the same object only once.
    const previous = state.lastSpawnedObstacle;
    if (previous && !state.obstacles.includes(previous)) {
        moveObstacle(previous, worldSpeed, deltaTime);
    }

    for (const obstacle of state.obstacles) {
        moveObstacle(obstacle, worldSpeed, deltaTime);
        updateObstacleAnimation(obstacle, deltaTime);
    }

    // Remove obstacles that have left the screen.
    state.obstacles = state.obstacles.filter(
        (obstacle) =>
            obstacle.x + obstacle.width >= 0
    );
}

export function resetObstacles(state: ObstacleState, random: () => number = Math.random) {
    state.obstacles = [];
    state.lastSpawnedObstacle = null;

    spawnObstacle(state, random);
}
