import {GAME_STATE, type GameData, type SoundEvent, PLAYER_STATE, SOUND_EVENT} from "./types.ts";
import {resetInput} from "./input/input.ts";
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

export type OnSoundEvent = (event: SoundEvent) => void;

export function updateGame(state: GameData, deltaTime: number, onSoundEvent: OnSoundEvent = () => {
}) {
    let isInitialStart = state.gameState === GAME_STATE.READY;
    if (state.gameState === GAME_STATE.GAME_OVER) {

        if (state.restartCooldown > 0) {
            state.restartCooldown = Math.max(0, state.restartCooldown - deltaTime);
            resetInput(state.input);
            return;
        }
        if (!state.input.restartPressed) {
            resetInput(state.input);
            return;
        }
        resetGame(state);
        isInitialStart = true;
        onSoundEvent(SOUND_EVENT.START);
        state.input. jumpPressed = false;
    }

    if (state.gameState === GAME_STATE.READY) {
        if (!state.input.jumpPressed) {
            resetInput(state.input);
            return;
        }
        state.gameState = GAME_STATE.RUNNING;
        onSoundEvent(SOUND_EVENT.START);
        state.input. jumpPressed = false;
    }

    const jumped = updatePlayer(state.player, state.input, deltaTime);

    // Starting and restarting already play the start sound; later jumps keep their effect.
    if (jumped && !isInitialStart) onSoundEvent(SOUND_EVENT.JUMP);

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
        onSoundEvent(SOUND_EVENT.GAME_OVER);
    }

    if (state.gameState === GAME_STATE.RUNNING) {
        updateScore(state, state.worldSpeed, deltaTime);
        const previousLevel = state.difficultyLevel;
        updateDifficulty(state, state.score);
        if (state.difficultyLevel > previousLevel) onSoundEvent(SOUND_EVENT.LEVEL_UP);
    }

    resetInput(state.input);
}

export function resetGame(state: GameData) {
    resetRunScore(state)
    state.restartCooldown = 0;
    resetDifficulty(state)

    resetPlayer(state.player);
    resetObstacles(state);

    state.gameState = GAME_STATE.RUNNING;
}

function gameOver(state: GameData) {
    recordHighScoreCompletedRun(state)
    state.gameState = GAME_STATE.GAME_OVER;
    state.restartCooldown = RESTART_COOLDOWN_SECONDS;
    state.player.hitPose = state.player.isGrounded ? 'ground' : 'airborne';
    state.player.state = PLAYER_STATE.HIT;
    // Collision follows animation in update(); select the frozen hit frame now.
    updatePlayerAnimation(state.player, 0);
}
