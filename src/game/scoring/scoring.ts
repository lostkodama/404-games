import type {GameData} from "../types.ts";
import {SCORE_SCALE} from "../constants.ts";

type RunScoreState = Pick<GameData, 'distance' | 'score'>;

export function updateScore(state: RunScoreState, worldSpeed: number, deltaTime: number,
) {
    state.distance += worldSpeed * deltaTime;
    state.score = Math.floor(state.distance * SCORE_SCALE);
}

type HighScoreState = Pick<GameData, 'score' | 'highScore'>;

export function recordHighScoreCompletedRun(state: HighScoreState) {
    state.highScore = Math.max(state.highScore, state.score);
}

export function resetRunScore(state: RunScoreState) {
    state.distance = 0;
    state.score = 0;
}