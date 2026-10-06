import {describe, expect, it} from 'vitest';
import {INITIAL_WORLD_SPEED} from './constants.ts';
import {GAME_STATE, PLAYER_STATE} from './types.ts';
import {createGameState} from './gameState.ts';

describe('createGameState', () => {
    it('creates a ready-to-play state with reset run data', () => {
        const state = createGameState();

        expect(state.gameState).toBe(GAME_STATE.READY);
        expect(state.restartCooldown).toBe(0);
        expect(state.player.state).toBe(PLAYER_STATE.IDLE);
        expect(state.player.isGrounded).toBe(true);
        expect(state.input).toEqual({jumpPressed: false, restartPressed: false});
        expect(state.obstacles).toEqual([]);
        expect(state.lastSpawnedObstacle).toBeNull();
        expect(state.nextObstacleGap).toBe(0);
        expect(state.score).toBe(0);
        expect(state.highScore).toBe(0);
        expect(state.distance).toBe(0);
        expect(state.difficultyLevel).toBe(0);
        expect(state.worldSpeed).toBe(INITIAL_WORLD_SPEED);
    });

    it('creates independent mutable player and scenery collections per game', () => {
        const first = createGameState();
        const second = createGameState();

        expect(first.player).not.toBe(second.player);
        expect(first.input).not.toBe(second.input);
        expect(first.clouds).not.toBe(second.clouds);
        expect(first.groundDetails).not.toBe(second.groundDetails);
        expect(first.clouds[0]).not.toBe(second.clouds[0]);
        expect(first.groundDetails[0]).not.toBe(second.groundDetails[0]);
    });
});
