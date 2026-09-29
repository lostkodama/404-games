import {
    RESTART_COOLDOWN_SECONDS,
    INITIAL_WORLD_SPEED,
    MAX_DELTA_TIME,
} from './constants';
import type { GameData } from './types';
import { createPlayer, resetPlayer } from './player/player';
import { updatePlayer } from './player/playerPhysics';
import { updatePlayerAnimation } from './player/playerAnimation';
import { bindInput, createInput, resetInput } from './input/input';
import { resetObstacles, updateObstacles, updateObstacleSpawning } from './obstacles/obstacles';
import { isPlayerCollidingWithObstacle } from './collision/collision';
import { render } from './render/renderer';
import { loadSprites } from './render/sprites';
import { debugGameState } from './debug/debugGameState';
import {createClouds, updateClouds} from "./environment/cloud.ts";
import {createGroundDetails, updateGroundDetails} from "./environment/ground.ts";
import {recordHighScoreCompletedRun, resetRunScore, updateScore} from "./scoring/scoring.ts";
import {resetDifficulty, updateDifficulty} from "./difficulty/difficulty.ts";

export type GameEvent = 'start' | 'jump' | 'gameOver' | 'levelUp';
type OnGameEvent = (event: GameEvent) => void;

export function createGameState(): GameData {
    return {
        gameState: 'ready',
        restartCooldown: 0,
        player: createPlayer(),
        input: createInput(),
        obstacles: [],
        nextObstacleGap: 0, // No previous obstacle; the first spawn chooses its gap.
        lastSpawnedObstacle: null,
        groundDetails: createGroundDetails(),
        score: 0,
        highScore: 0,
        distance: 0,
        difficultyLevel: 0,
        worldSpeed: INITIAL_WORLD_SPEED,
        clouds: createClouds(),
    };
}

function gameOver(state: GameData) {
    recordHighScoreCompletedRun(state)
    state.gameState = 'gameOver';
    state.restartCooldown = RESTART_COOLDOWN_SECONDS;
    state.player.hitPose = state.player.isGrounded ? 'ground' : 'airborne';
    state.player.state = 'hit';
    // Collision follows animation in update(); select the frozen hit frame now.
    updatePlayerAnimation(state.player, 0);
    debugGameState('enter game over', state);
}

export function resetGame(state: GameData) {
    debugGameState('before reset', state);
    resetRunScore(state)
    state.restartCooldown = 0;
    resetDifficulty(state)

    resetPlayer(state.player);
    resetObstacles(state);

    state.gameState = 'running';
    debugGameState('after reset', state);
}

export function update(state: GameData, deltaTime: number, onEvent: OnGameEvent = () => {}) {
    let isInitialStart = state.gameState === 'ready';
    if (state.gameState === 'gameOver') {
        if (state.restartCooldown > 0) {
            state.restartCooldown = Math.max(0, state.restartCooldown - deltaTime);
            // Discard even the input on the frame that reaches zero.
            // Restart requires a new action after the prompt becomes available.
            resetInput(state.input);
            return;
        }
        if (!state.input.restartPressed) {
            resetInput(state.input);
            return;
        }

        resetGame(state);
        isInitialStart = true;
        onEvent('start');
        // The accepted restart action also jumps through normal physics below.
        state.input.jumpPressed = true;
    }

    if (state.gameState === 'ready') {
        if (!state.input.jumpPressed) {
            resetInput(state.input);
            return;
        }
        state.gameState = 'running';
        onEvent('start');
        // Keep jumpPressed for the normal physics update below.
    }

    const jumped = updatePlayer(state.player, state.input, deltaTime);

    // Starting and restarting already play the start sound; later jumps keep their effect.
    if (jumped && !isInitialStart) onEvent('jump');

    updatePlayerAnimation(state.player, deltaTime);
    updateObstacles(state, state.worldSpeed, deltaTime);
    updateObstacleSpawning(state, state.difficultyLevel);

    updateClouds(
        state.clouds,
        state.worldSpeed,
        deltaTime
    );

    updateGroundDetails(state.groundDetails, state.worldSpeed, deltaTime);

    // Collision must have updated positions
    if (isPlayerCollidingWithObstacle(state.player, state.obstacles)) {
        gameOver(state);
        onEvent('gameOver');
    }

    if (state.gameState === 'running') {
        updateScore(state, state.worldSpeed, deltaTime);
        const previousLevel = state.difficultyLevel;
        updateDifficulty(state, state.score);
        if (state.difficultyLevel > previousLevel) onEvent('levelUp');
    }

    resetInput(state.input);
}

export function startGame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onEvent: OnGameEvent = () => {},
    onInteraction: () => void = () => {},
) {
    const state = createGameState();
    debugGameState('initial state', state);
    const assets = loadSprites();
    let previousTime: number | undefined;
    let frameId: number | undefined;

    let isSuspended = false;

    function gameLoop(currentTime: number) {
        frameId = undefined

        if (isSuspended) {
            return;
        }

        if (previousTime === undefined) {
            previousTime = currentTime;
        }

        const rawDeltaTime = (currentTime - previousTime) / 1000;
        const deltaTime = Math.min(rawDeltaTime, MAX_DELTA_TIME);
        previousTime = currentTime;

        update(state, deltaTime, onEvent);
        render(ctx, canvas, state, assets);

        frameId = requestAnimationFrame(gameLoop);
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            if (!isSuspended) debugGameState('browser suspend', state);
            isSuspended = true;

            if (frameId !== undefined) {
                cancelAnimationFrame(frameId);
                frameId = undefined;
            }

            return
        }

        resetInput(state.input);

        if (isSuspended) debugGameState('browser resume', state);
        isSuspended = false;
        previousTime = undefined;

        if (frameId === undefined) {
            frameId = requestAnimationFrame(gameLoop);
        }
    }

    document.addEventListener(
        'visibilitychange',
        handleVisibilityChange
    );

    const unbindInput = bindInput(canvas, state.input, () => state.gameState, onInteraction);
    frameId = requestAnimationFrame(gameLoop);
    return () => {
        if (frameId !== undefined) {
            cancelAnimationFrame(frameId);
            frameId = undefined;
        }
        unbindInput();

        document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange
        );
    };
}