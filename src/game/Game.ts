import {
    MAX_DELTA_TIME,
} from './constants';
import { debugGameState } from './debug/debugGameState';
import { createGameState } from './gameState';
import { bindInput, resetInput } from './input/input';
import { startGameLoop } from './loop/gameLoop';
import { render } from './render/renderer';
import { loadSprites } from './render/sprites';
import { updateGame, type OnGameEvent } from './updateGame';

export type { GameEvent } from './types';
export { createGameState } from './gameState';
export { resetGame, updateGame as update } from './updateGame';

export function startGame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onEvent: OnGameEvent = () => {
    },
    onInteraction: () => void = () => {
    },
) {
    const state = createGameState();
    debugGameState('initial state', state);
    const assets = loadSprites();

    const unbindInput = bindInput(canvas, state.input, () => state.gameState, onInteraction);

    const stopGameLoop = startGameLoop({
        maxDeltaTime: MAX_DELTA_TIME,
        onFrame(deltaTime) {
            updateGame(state, deltaTime, onEvent);
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

    return() => {
        stopGameLoop()
        unbindInput()
    }
}
