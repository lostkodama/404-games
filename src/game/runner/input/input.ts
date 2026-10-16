import type {GameAction, InputState} from '../types';

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
    }
}

export function resetInput(input: InputState) {
    input.jumpPressed = false;
    input.restartPressed = false;
}
