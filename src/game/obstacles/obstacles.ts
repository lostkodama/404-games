import { GROUND_Y, OBSTACLE_SPAWN_X } from '../constants';
import { OBSTACLE_CONFIG } from './obstacleConfig';
import { selectObstaclePattern } from './obstacleSelection';
import { BUILDING_GROUP_GAP, OBSTACLE_PATTERNS } from './obstaclePatterns';
import type { Obstacle, ObstacleState, ObstaclePattern } from '../types';

export function createObstacle(pattern: ObstaclePattern): Obstacle {
    const { type, count } = OBSTACLE_PATTERNS[pattern];
    const config = OBSTACLE_CONFIG[type];
    const segments = Array.from({ length: count }, (_, index) => ({
        type,
        offsetX: index * (config.renderWidth + BUILDING_GROUP_GAP),
        width: config.renderWidth,
        height: config.renderHeight,
    }));
    const obstacle = {
        pattern,
        segments,
        x: OBSTACLE_SPAWN_X,
        y: GROUND_Y - config.renderHeight,
        width: count * config.renderWidth + (count - 1) * BUILDING_GROUP_GAP,
        height: config.renderHeight,
        passed: false
    };

    if (type === 'car') {
        return { ...obstacle, type, animationTime: 0, animationFrameIndex: 0 };
    }
    return { ...obstacle, type };
}

export function spawnObstacle(
    state: ObstacleState,
    difficultyLevel: number,
    random: () => number = Math.random
) {
    const pattern = selectObstaclePattern(difficultyLevel, state.lastSpawnedObstacle?.pattern, random);
    const obstacle = createObstacle(pattern);
    state.obstacles.push(obstacle);
    state.lastSpawnedObstacle = obstacle;
    // Sample the gap after this spawned pattern once, and retain it until
    // the next spawn. Pattern selection and gap selection use separate draws.
    const { minNextGap, maxNextGap } = OBSTACLE_PATTERNS[pattern];
    state.nextObstacleGap = minNextGap + Math.floor(
        random() * (maxNextGap - minNextGap + 1)
    );
}

export function updateObstacleSpawning(
    state: ObstacleState,
    difficultyLevel: number,
    random: () => number = Math.random
) {
    const previous = state.lastSpawnedObstacle;
    const previousRight = previous ? previous.x + previous.width : undefined;

    if (previousRight === undefined || OBSTACLE_SPAWN_X - previousRight >= state.nextObstacleGap) {
        spawnObstacle(state, difficultyLevel, random);
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

    // A restarted run uses the initial unlock pool, not the previous run’s level.
    spawnObstacle(state, 0, random);
}
