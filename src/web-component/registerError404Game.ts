import {Error404GameElement} from './Error404GameElement';

export function registerError404Game(): void {
    if (!customElements.get('error-404-game')) {
        customElements.define('error-404-game', Error404GameElement);
    }
}
