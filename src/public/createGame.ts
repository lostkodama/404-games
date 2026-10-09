// src/public/createGame.ts

import { createBrowserRuntime } from '../browser/createBrowserRuntime';
import type { GameController } from './GameController';
import type { GameOptions } from './GameOptions';

const DEFAULT_ACCENT_COLOR = '#ff5c5c';

export function create404Game(
    options: GameOptions,
): GameController {
    validateOptions(options);

    const { container } = options;
    const accentColor =
        options.accentColor ?? DEFAULT_ACCENT_COLOR;

    const canvas = createCanvas(container);

    const runtime = createBrowserRuntime({
        canvas,
        accentColor,
    });

    let isDestroyed = false;

    return {
        pause() {
            if (isDestroyed) {
                return;
            }

            runtime.pause();
        },

        resume() {
            if (isDestroyed) {
                return;
            }

            runtime.resume();
        },

        restart() {
            if (isDestroyed) {
                return;
            }

            runtime.restart();
        },

        destroy() {
            if (isDestroyed) {
                return;
            }

            isDestroyed = true;

            runtime.destroy();
            canvas.remove();
        },
    };
}

function validateOptions(options: GameOptions): void {
    if (!options || typeof options !== 'object') {
        throw new Error('options are required');
    }

    const { container, accentColor } = options;

    if (
        !container ||
        typeof container !== 'object' ||
        container.nodeType !== 1 ||
        typeof container.appendChild !== 'function'
    ) {
        throw new Error('container must be an HTML element');
    }

    if (
        accentColor !== undefined &&
        typeof accentColor !== 'string'
    ) {
        throw new Error('accentColor must be a string');
    }
}

function createCanvas(
    container: HTMLElement,
): HTMLCanvasElement {
    const canvas =
        container.ownerDocument.createElement('canvas');

    container.appendChild(canvas);

    return canvas;
}