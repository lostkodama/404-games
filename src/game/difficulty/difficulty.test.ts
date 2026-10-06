import {describe, expect, it} from 'vitest';
import {INITIAL_WORLD_SPEED, MAX_WORLD_SPEED} from '../constants.ts';
import {resetDifficulty, updateDifficulty} from './difficulty.ts';

describe('difficulty progression', () => {
    it.each([
        [0, 0, 260],
        [99, 0, 260],
        [100, 1, 280],
        [199, 1, 280],
    ])('maps score %i to level %i and speed %i', (score, expectedLevel, expectedSpeed) => {
        const state = {difficultyLevel: 0, worldSpeed: 0};

        updateDifficulty(state, score);

        expect(state.difficultyLevel).toBe(expectedLevel);
        expect(state.worldSpeed).toBe(expectedSpeed);
    });

    it('caps world speed while continuing to derive the level from score', () => {
        const state = {difficultyLevel: 0, worldSpeed: 0};

        updateDifficulty(state, 2200);

        expect(state.difficultyLevel).toBe(22);
        expect(state.worldSpeed).toBe(MAX_WORLD_SPEED);
    });

    it('resets to level zero and the initial world speed', () => {
        const state = {difficultyLevel: 12, worldSpeed: MAX_WORLD_SPEED};

        resetDifficulty(state);

        expect(state).toEqual({difficultyLevel: 0, worldSpeed: INITIAL_WORLD_SPEED});
    });
});
