import {GAME_STATE, type GameState} from '../types';

type InputActions = {
    onJump: () => void;
    onRestart: () => void;
};

type BrowserInputOptions = InputActions & {
    canvas: HTMLCanvasElement;
    getGameStatus: () => GameState;
    onInteraction?: () => void;
};

// Owns keyboard/pointer translation, preventDefault, listeners, and cleanup
export function handleKeyDown(actions: InputActions, gameState: GameState, event: KeyboardEvent) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault();

        if (gameState === GAME_STATE.GAME_OVER) {
            actions.onRestart();
            return;
        }

        actions.onJump();
    }
}

export function handlePointerDown(actions: InputActions, gameState: GameState, event: PointerEvent) {
    event.preventDefault();

    if (gameState === GAME_STATE.GAME_OVER) {
        actions.onRestart();
        return;
    }

    actions.onJump();
}

export function bindInput({
    canvas,
    onJump,
    onRestart,
    getGameStatus,
    onInteraction = () => {},
}: BrowserInputOptions) {
    const actions = {onJump, onRestart};
    const keyDown = (event: KeyboardEvent) => {
        if (!event.repeat && (event.code === 'Space' || event.code === 'ArrowUp')) {
            onInteraction();
        }
        handleKeyDown(actions, getGameStatus(), event);
    };
    const pointerDown = (event: PointerEvent) => {
        onInteraction();
        handlePointerDown(actions, getGameStatus(), event);
    };
    window.addEventListener('keydown', keyDown);
    canvas.addEventListener('pointerdown', pointerDown);

    return () => {
        window.removeEventListener('keydown', keyDown);
        canvas.removeEventListener('pointerdown', pointerDown);
    };
}
