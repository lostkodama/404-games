import {describe, expect, it} from "vitest";
import {recordHighScoreCompletedRun, resetRunScore, updateScore} from "./scoring.ts";
import {SCORE_SCALE} from "../constants.ts";

describe("updateScore", () => {
    it("increases distance based on worldSpeed and deltaTime", () => {
        const state = {
            distance: 0,
            score: 0,
        }

        updateScore(state, 100, 0.5)
        expect(state.distance).toBe(50);
    });

    it("calculates score from the updated distance", () => {
        const state = {
            distance: 10,
            score: 0,
        }

        updateScore(state, 100, 0.5)

        const expectedDistance = 60
        const expectedScore = Math.floor(state.distance * SCORE_SCALE)

        expect(state.distance).toBe(expectedDistance)
        expect(state.score).toBe(expectedScore)
    })

    it("accumulates distance across multiple updates", () => {
        const state = {
            distance: 20,
            score: 0
        }

        updateScore(state, 100, 0.25)
        updateScore(state, 100, 0.25)

        const expectedDistance = 70

        expect(state.distance).toBe(expectedDistance)
        expect(state.score).toBe(Math.floor(expectedDistance * SCORE_SCALE))
    })
});

describe("recordHighScoreCompletedRun", () => {
    it("updates the highScore when the current score is higher", () => {
        const state = {
            score: 120,
            highScore: 110,
        }

        recordHighScoreCompletedRun(state)
        expect(state.highScore).toBe(120)
    })

    it("keeps the highScore when the current score is lower", () => {
        const state = {
            score: 60,
            highScore: 61,
        }

        recordHighScoreCompletedRun(state)
        expect(state.highScore).toBe(61)
    })

    it("keeps the highScore when the current score is equal to highScore", () => {
        const state = {
            score: 100,
            highScore: 100,
        }

        recordHighScoreCompletedRun(state)
        expect(state.highScore).toBe(100)
    })
});

describe("resetRunScore", () => {
    it("resets score and distance to zero", () => {
        const state = {
            score: 90,
            distance: 1000,
        }
        resetRunScore(state)
        expect(state.score).toBe(0)
        expect(state.distance).toBe(0)
    })
})