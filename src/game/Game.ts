import {resetInput} from './input/input';
import {bindInput} from './input/browserInput';
import {render} from './render/renderer';
import {loadSprites} from './render/sprites';
import {debugGameState} from './debug/debugGameState';
import {startGameLoop} from "./loop/gameLoop.ts";
import {createGameState} from "./gameState.ts";
import {type OnSoundEvent, updateGame} from "./updateGame.ts";
import {MAX_DELTA_TIME} from "./constants.ts";

export function startGame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onSoundEvent: OnSoundEvent = () => {
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
            updateGame(state, deltaTime, onSoundEvent);
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
