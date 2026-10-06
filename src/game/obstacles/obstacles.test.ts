import {describe, expect, it} from 'vitest';
import {GROUND_Y, OBSTACLE_SPAWN_X} from '../constants.ts';
import type {ObstacleState} from '../types.ts';
import {createObstacle, resetObstacles, spawnObstacle, updateObstacleSpawning, updateObstacles} from './obstacles.ts';

function createObstacleState(): ObstacleState {
    return {
        obstacles: [],
        nextObstacleGap: 0,
        lastSpawnedObstacle: null,
    };
}

describe('createObstacle', () => {
    it('creates a triple small-building pattern with correctly spaced segments', () => {
        const obstacle = createObstacle('tripleBuildingSmall');

        expect(obstacle).toEqual({
            pattern: 'tripleBuildingSmall',
            type: 'buildingSmall',
            x: OBSTACLE_SPAWN_X,
            y: GROUND_Y - 35,
            width: 100,
            height: 35,
            passed: false,
            segments: [
                {type: 'buildingSmall', offsetX: 0, width: 32, height: 35},
                {type: 'buildingSmall', offsetX: 34, width: 32, height: 35},
                {type: 'buildingSmall', offsetX: 68, width: 32, height: 35},
            ],
        });
    });

    it('initializes animation state for a car obstacle', () => {
        const obstacle = createObstacle('car');
        if (obstacle.type !== 'car') {
            throw new Error('Expected a car obstacle');
        }

        expect(obstacle).toMatchObject({
            type: 'car',
            width: 40,
            height: 55,
            y: GROUND_Y - 55,
            animationTime: 0,
            animationFrameIndex: 0,
        });
    });
});

describe('spawnObstacle', () => {
    it('spawns an obstacle, stores it as the spacing reference, and samples its following gap', () => {
        const state = createObstacleState();
        const rolls = [0, 0.999];
        let rollIndex = 0;

        spawnObstacle(state, 0, () => rolls[rollIndex++]);

        expect(state.obstacles).toHaveLength(1);
        expect(state.obstacles[0]).toBe(state.lastSpawnedObstacle);
        expect(state.lastSpawnedObstacle?.pattern).toBe('buildingSmall');
        expect(state.nextObstacleGap).toBe(600);
        expect(rollIndex).toBe(2);
    });
});

describe('updateObstacleSpawning', () => {
    it('waits until the configured gap is reached before spawning the next obstacle', () => {
        const state = createObstacleState();
        spawnObstacle(state, 0, () => 0);
        const previous = state.lastSpawnedObstacle!;
        const beforeSpawnCount = state.obstacles.length;

        previous.x = OBSTACLE_SPAWN_X - previous.width - state.nextObstacleGap + 1;
        updateObstacleSpawning(state, 0, () => 0);
        expect(state.obstacles).toHaveLength(beforeSpawnCount);

        previous.x -= 1;
        updateObstacleSpawning(state, 0, () => 0);
        expect(state.obstacles).toHaveLength(beforeSpawnCount + 1);
    });
});

describe('updateObstacles', () => {
    it('moves obstacles by their configured effective speed and advances car frames', () => {
        const building = createObstacle('buildingSmall');
        const car = createObstacle('car');
        if (car.type !== 'car') {
            throw new Error('Expected a car obstacle');
        }
        const state: ObstacleState = {
            obstacles: [building, car],
            nextObstacleGap: 0,
            lastSpawnedObstacle: car,
        };

        updateObstacles(state, 100, 0.125);

        expect(building.x).toBe(OBSTACLE_SPAWN_X - 12.5);
        expect(car.x).toBe(OBSTACLE_SPAWN_X - 10);
        expect(car.animationFrameIndex).toBe(1);
        expect(car.animationTime).toBeCloseTo(0);
    });

    it('keeps the last-spawned spacing reference moving after it leaves the active list', () => {
        const last = createObstacle('buildingSmall');
        last.x = -last.width - 1;
        const state: ObstacleState = {
            obstacles: [],
            nextObstacleGap: 0,
            lastSpawnedObstacle: last,
        };

        updateObstacles(state, 100, 0.5);

        expect(state.obstacles).toEqual([]);
        expect(last.x).toBe(-last.width - 51);
    });
});

describe('resetObstacles', () => {
    it('resets the active obstacles and seeds a level-zero obstacle', () => {
        const staleObstacle = createObstacle('car');
        const state: ObstacleState = {
            obstacles: [staleObstacle],
            nextObstacleGap: 99,
            lastSpawnedObstacle: staleObstacle,
        };

        resetObstacles(state, () => 0);

        expect(state.obstacles).toHaveLength(1);
        expect(state.obstacles[0]).not.toBe(staleObstacle);
        expect(state.obstacles[0].pattern).toBe('buildingSmall');
        expect(state.lastSpawnedObstacle).toBe(state.obstacles[0]);
        expect(state.nextObstacleGap).toBe(450);
    });
});
