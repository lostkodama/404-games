import {Error404GameElement, registerError404Game} from '404-games/web-component';

export {Error404GameElement, registerError404Game};

export function mount() {
    registerError404Game();
    const element = document.createElement('error-404-game');
    document.body.appendChild(element);
    return element;
}
