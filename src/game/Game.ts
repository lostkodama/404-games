import {resetInput, triggerAction} from './input/input';
import {type GameState, SOUND_EVENT} from './types';
import {render} from './render/renderer';
import {loadSprites} from './render/sprites';
import {debugGameState} from './debug/debugGameState';
import {startGameLoop} from "./loop/gameLoop.ts";
import {createGameState} from "./gameState.ts";
import {type OnSoundEvent, resetGame, updateGame} from "./updateGame.ts";
import {MAX_DELTA_TIME} from "./constants.ts";

export type GameSession = {
    pressJump(): void;
    pressRestart(): void;
    getGameStatus(): GameState;
    redraw(): void;
    pause(): void;
    resume(): void;
    restart(): void;
    destroy(): void;
};

type GamePresentationOptions = {
    accentColor: string;
};

export function startGame(
    document: Document,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    presentation: GamePresentationOptions,
    onSoundEvent: OnSoundEvent = () => {
    },
): GameSession {
    const state = createGameState();
    debugGameState('initial state', state);
    const assets = loadSprites();

    function renderCurrentState() {
        render(ctx, canvas, state, assets, presentation);
    }

    const gameLoop = startGameLoop({
        document,
        maxDeltaTime: MAX_DELTA_TIME,
        onFrame(deltaTime) {
            const previousGameState = state.gameState;
            updateGame(state, deltaTime, onSoundEvent);
            if (state.gameState !== previousGameState) {
                debugGameState(`${previousGameState} → ${state.gameState}`, state);
            }
            renderCurrentState()
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

        redraw() {
            renderCurrentState()
        },

        pause() {
            resetInput(state.input)
            gameLoop.pause()
        },

        resume() {
            resetInput(state.input)
            gameLoop.resume()
        },

        restart() {
            resetInput(state.input)
            resetGame(state)

            onSoundEvent(SOUND_EVENT.START) // MXN_ ??

            gameLoop.resume()
        },

        destroy() {
            gameLoop.stop();
        },
    }
}
