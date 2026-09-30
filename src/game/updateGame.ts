import type {GameData, GameEvent} from "./types.ts";
import {resetInput} from "./input/input.ts";
import {debugGameState} from "./debug/debugGameState.ts";
import {updatePlayer} from "./player/playerPhysics.ts";
import {updatePlayerAnimation} from "./player/playerAnimation.ts";
import {resetObstacles, updateObstacles, updateObstacleSpawning} from "./obstacles/obstacles.ts";
import {updateClouds} from "./environment/cloud.ts";
import {updateGroundDetails} from "./environment/ground.ts";
import {isPlayerCollidingWithObstacle} from "./collision/collision.ts";
import {recordHighScoreCompletedRun, resetRunScore, updateScore} from "./scoring/scoring.ts";
import {resetDifficulty, updateDifficulty} from "./difficulty/difficulty.ts";
import {resetPlayer} from "./player/player.ts";
import {RESTART_COOLDOWN_SECONDS} from "./constants.ts";

export type OnGameEvent = (event: GameEvent) => void;

export function updateGame(state: GameData, deltaTime: number, onEvent: OnGameEvent = () => {
}) {
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
