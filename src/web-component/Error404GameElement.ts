import {create404Game, type GameController} from '../public';

export class Error404GameElement extends HTMLElement {
    #controller: GameController | undefined;

    connectedCallback(): void {
        if (!this.isConnected || this.#controller) return;

        const accentColor = this.getAttribute('accent-color');
        this.#controller = create404Game({
            container: this,
            ...(accentColor === null ? {} : {accentColor}),
        });
    }

    disconnectedCallback(): void {
        const controller = this.#controller;
        this.#controller = undefined; // cleanup first before destroy (safety)
        controller?.destroy();
    }

    pause(): void {
        this.#controller?.pause();
    }

    resume(): void {
        this.#controller?.resume();
    }

    restart(): void {
        this.#controller?.restart();
    }
}
