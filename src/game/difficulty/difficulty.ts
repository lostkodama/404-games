import type {GameData} from "../types.ts";
import {
    INITIAL_WORLD_SPEED,
    MAX_WORLD_SPEED, SCORE_PER_DIFFICULTY_LEVEL,
    SPEED_INCREASE_PER_LEVEL
} from "../constants.ts";

type DifficultyState = Pick<GameData, 'difficultyLevel' | 'worldSpeed'>

export function updateDifficulty(state: DifficultyState, score: number) {
    state.difficultyLevel =
        Math.floor(score / SCORE_PER_DIFFICULTY_LEVEL);

    state.worldSpeed =
        INITIAL_WORLD_SPEED +
        state.difficultyLevel *
        SPEED_INCREASE_PER_LEVEL;

    state.worldSpeed =
        Math.min(
            state.worldSpeed,
            MAX_WORLD_SPEED
        );
}

export function resetDifficulty(state: DifficultyState) {
    state.difficultyLevel = 0
    state.worldSpeed = INITIAL_WORLD_SPEED;
}