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

export function bindInput(canvas: HTMLCanvasElement, input: InputState, getGameState: () => GameState) {
    window.addEventListener('keydown', event => handleKeyDown(input, getGameState(), event));
    canvas.addEventListener('pointerdown', event => handlePointerDown(input, getGameState(), event));
}
