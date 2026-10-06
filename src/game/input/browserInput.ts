import {GAME_STATE, type GameState, type InputState} from '../types';
import {triggerAction} from './input';

// Owns keyboard/pointer translation, preventDefault, listeners, and cleanup
export function handleKeyDown(input: InputState, gameState: GameState, event: KeyboardEvent) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault();

        if (gameState === GAME_STATE.GAME_OVER) {
            triggerAction(input, 'restart');
            return;
        }

        triggerAction(input, 'jump');
    }
}

export function handlePointerDown(input: InputState, gameState: GameState, event: PointerEvent) {
    event.preventDefault();

    if (gameState === GAME_STATE.GAME_OVER) {
        triggerAction(input, 'restart');
        return;
    }

    triggerAction(input, 'jump');
}

export function bindInput(
    canvas: HTMLCanvasElement,
    input: InputState,
    getGameState: () => GameState,
    onInteraction: () => void = () => {},
) {
    const keyDown = (event: KeyboardEvent) => {
        if (!event.repeat && (event.code === 'Space' || event.code === 'ArrowUp')) {
            onInteraction();
        }
        handleKeyDown(input, getGameState(), event);
    };
    const pointerDown = (event: PointerEvent) => {
        onInteraction();
        handlePointerDown(input, getGameState(), event);
    };
    window.addEventListener('keydown', keyDown);
    canvas.addEventListener('pointerdown', pointerDown);
    return () => {
        window.removeEventListener('keydown', keyDown);
        canvas.removeEventListener('pointerdown', pointerDown);
    };
}
