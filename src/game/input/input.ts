import type { GameAction, GameState, InputState } from '../types';

export function createInput(): InputState {
    return { jumpPressed: false, restartPressed: false };
}

export function triggerAction(input: InputState, action: GameAction) {
    switch (action) {
        case 'jump':
            input.jumpPressed = true;
            break;
        case 'restart':
            input.restartPressed = true;
            break;
        case 'pause':
            break;
    }
}

export function resetInput(input: InputState) {
    input.jumpPressed = false;
    input.restartPressed = false;
}

export function handleKeyDown(input: InputState, gameState: GameState, event: KeyboardEvent) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault();

        if (gameState === 'gameOver') {
            triggerAction(input, 'restart');
            return;
        }

        triggerAction(input, 'jump');
    }
}

export function handlePointerDown(input: InputState, gameState: GameState, event: PointerEvent) {
    event.preventDefault();

    if (gameState === 'gameOver') {
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
