import {resetInput, triggerAction} from './input/input';
import type {GameState} from './types';
import {render} from './render/renderer';
import {loadSprites} from './render/sprites';
import {debugGameState} from './debug/debugGameState';
import {startGameLoop} from "./loop/gameLoop.ts";
import {createGameState} from "./gameState.ts";
import {type OnSoundEvent, updateGame} from "./updateGame.ts";
import {MAX_DELTA_TIME} from "./constants.ts";

export type GameSession = {
    pressJump(): void;
    pressRestart(): void;
    getGameStatus(): GameState;
    pause(): void;
    resume(): void;
    restart(): void;
    destroy(): void;
};

export function startGame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onSoundEvent: OnSoundEvent = () => {
    },
): GameSession {
    const state = createGameState();
    debugGameState('initial state', state);
    const assets = loadSprites();

    const stopGameLoop = startGameLoop({
        maxDeltaTime: MAX_DELTA_TIME,
        onFrame(deltaTime) {
            const previousGameState = state.gameState;
            updateGame(state, deltaTime, onSoundEvent);
            if (state.gameState !== previousGameState) {
                debugGameState(`${previousGameState} → ${state.gameState}`, state);
            }
            render(ctx, canvas, state, assets);
        },
        onSuspend() {
            resetInput(state.input)
            debugGameState('browser suspend', state)
        },
        onResume() {
            resetInput(state.input)
            debugGameState('browser resume', state)
        },
    })

    return {
        pressJump() {
            triggerAction(state.input, 'jump');
        },

        pressRestart() {
            triggerAction(state.input, 'restart');
        },

        getGameStatus() {
            return state.gameState;
        },

        pause() {
            // wire in next
        },

        resume() {
            // wire in next
        },

        restart() {
            // wire in next
        },

        destroy() {
            stopGameLoop();
        },
    }
}
