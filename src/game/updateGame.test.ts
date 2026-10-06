import {beforeEach, describe, expect, it, vi} from "vitest";
import {GAME_STATE, type GameData, PLAYER_STATE, SOUND_EVENT} from "./types.ts";
import {updateGame} from "./updateGame.ts";
import {updatePlayer} from "./player/playerPhysics.ts";
import {resetInput} from "./input/input.ts";
import {recordHighScoreCompletedRun, updateScore} from "./scoring/scoring.ts";
import {updateDifficulty} from "./difficulty/difficulty.ts";
import {isPlayerCollidingWithObstacle} from "./collision/collision.ts";
import {RESTART_COOLDOWN_SECONDS} from "./constants.ts";
import {updatePlayerAnimation} from "./player/playerAnimation.ts";
import {updateObstacles} from "./obstacles/obstacles.ts";

vi.mock("./input/input", () => ({
    resetInput: vi.fn(),
}));
vi.mock("./player/playerPhysics", () => ({
    updatePlayer: vi.fn(),
}));
vi.mock("./player/playerAnimation", () => ({
    updatePlayerAnimation: vi.fn(),
}));

vi.mock("./obstacles/obstacles", () => ({
    resetObstacles: vi.fn(),
    updateObstacles: vi.fn(),
    updateObstacleSpawning: vi.fn(),
}));

vi.mock("./environment/cloud", () => ({
    updateClouds: vi.fn(),
}));

vi.mock("./environment/ground", () => ({
    updateGroundDetails: vi.fn(),
}));

vi.mock("./collision/collision", () => ({
    isPlayerCollidingWithObstacle: vi.fn(),
}));

vi.mock("./scoring/scoring", () => ({
    recordHighScoreCompletedRun: vi.fn(),
    resetRunScore: vi.fn(),
    updateScore: vi.fn(),
}));

vi.mock("./difficulty/difficulty", () => ({
    resetDifficulty: vi.fn(),
    updateDifficulty: vi.fn(),
}));

vi.mock("./player/player", () => ({
    resetPlayer: vi.fn(),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

function createGameState(
    overrides: Partial<GameData> = {},
): GameData {
    return {
        gameState: GAME_STATE.RUNNING,
        restartCooldown: 0,

        input: {
            jumpPressed: false,
            restartPressed: false,
        },

        player: {
            isGrounded: true,
            state: PLAYER_STATE.RUNNING,
            hitPose: null,
        },

        obstacles: [],
        clouds: [],
        groundDetails: [],

        distance: 0,
        score: 0,
        highScore: 0,

        worldSpeed: 100,
        difficultyLevel: 1,

        ...overrides,
    } as GameData;
}

describe("updateGame", () => {
    it("waits in READY until jump is pressed", () => {
        const state = createGameState({
            gameState: GAME_STATE.READY,
        })
        updateGame(state, 0.016)

        expect(state.gameState).toBe(GAME_STATE.READY)
        expect(updatePlayer).not.toHaveBeenCalled()
        expect(updateScore).not.toHaveBeenCalled()
        expect(updateDifficulty).not.toHaveBeenCalled()
        expect(resetInput).toHaveBeenCalledWith(state.input)
    })

    it("starts the game when jump is pressed in READY", () => {
        const state = createGameState({
            gameState: GAME_STATE.READY,
        })
        state.input.jumpPressed = true

        const onSoundEvent = vi.fn() // explain this line
        updateGame(state, 0.029, onSoundEvent)

        expect(state.gameState).toBe(GAME_STATE.RUNNING)
        expect(onSoundEvent).toHaveBeenCalledWith(SOUND_EVENT.START)

        // Start input should not become a normal jump.
        expect(state.input.jumpPressed).toBe(false);
        expect(onSoundEvent).not.toHaveBeenCalledWith(SOUND_EVENT.JUMP);
    })

    it("plays the jump sound for a jump in RUNNING", () => {
        const state = createGameState()
        state.input.jumpPressed = true

        const onSoundEvent = vi.fn()
        vi.mocked(updatePlayer).mockReturnValue(true)

        updateGame(state, 0.011, onSoundEvent)
        expect(onSoundEvent).toHaveBeenCalledWith(SOUND_EVENT.JUMP)
    })

    it("enters GAME_OVER when the player collides with an obstacle", () => {
        const state = createGameState()
        vi.mocked(isPlayerCollidingWithObstacle).mockReturnValue(true)

        const onSoundEvent = vi.fn()
        updateGame(state, 0.012, onSoundEvent)

        // Game over
        expect(recordHighScoreCompletedRun).toHaveBeenCalledWith(state)
        expect(state.gameState).toBe(GAME_STATE.GAME_OVER)
        expect(state.restartCooldown).toBe(RESTART_COOLDOWN_SECONDS)
        expect(state.player.hitPose).toBe("ground")
        expect(state.player.state).toBe(PLAYER_STATE.HIT)
        expect(updatePlayerAnimation).toHaveBeenCalledWith(state.player, 0)

        expect(onSoundEvent).toHaveBeenCalledWith(SOUND_EVENT.GAME_OVER)

        // Score should not update
        expect(updateScore).not.toHaveBeenCalled()
    })

    it("counts down the restart cooldown without updating the game", () => {
        const state = createGameState({
            gameState: GAME_STATE.GAME_OVER,
            restartCooldown: 2,
        });

        updateGame(state, 0.5);

        expect(state.restartCooldown).toBe(1.5);

        expect(updatePlayer).not.toHaveBeenCalled();
        expect(updateObstacles).not.toHaveBeenCalled();
        expect(updateScore).not.toHaveBeenCalled();

        expect(resetInput).toHaveBeenCalledWith(state.input);
    });

    it("does not let the restart cooldown go below zero", () => {
        const state = createGameState({
            gameState: GAME_STATE.GAME_OVER,
            restartCooldown: 0.1,
        });

        updateGame(state, 0.5);

        expect(state.restartCooldown).toBe(0);
    });

})
