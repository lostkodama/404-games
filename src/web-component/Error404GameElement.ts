import {create404Game, type GameController} from '../public';

export class Error404GameElement extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['accent-color'];
    }

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
        this.#destroyGame();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (name !== 'accent-color' || oldValue === newValue || !this.isConnected) return;
        this.#destroyGame();
        this.connectedCallback();
    }

    #destroyGame(): void {
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
