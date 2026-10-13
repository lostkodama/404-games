// src/public/createGame.ts

import { createBrowserRuntime } from '../browser/createBrowserRuntime';
import type { GameController } from './GameController';
import type { GameOptions } from './GameOptions';

const DEFAULT_ACCENT_COLOR = '#414141';

export function create404Game(
    options: GameOptions,
): GameController {
    validateOptions(options);

    const { container } = options;
    const accentColor =
        options.accentColor ?? DEFAULT_ACCENT_COLOR;

    const canvas = createCanvas(container);

    let runtime;

    try {
        runtime = createBrowserRuntime({
            canvas,
            accentColor,
        });
    } catch (error) {
        canvas.remove();
        throw error;
    }

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

            try {
                runtime.destroy();
            } finally {
                canvas.remove();
            }
        },
    };
}

function validateOptions(options: GameOptions): void {
    if (!options || typeof options !== 'object') {
        throw new Error('options are required');
    }

    const { container, accentColor } = options;

    if (!isHTMLElement(container)) {
        throw new Error('container must be an HTML element');
    }

    if (
        accentColor !== undefined &&
        (
            typeof accentColor !== 'string' ||
            accentColor.trim() === ''
        )
    ) {
        throw new Error('accentColor must be a non-empty string');
    }
}

function isHTMLElement(
    value: unknown,
): value is HTMLElement {
    if (
        !value ||
        typeof value !== 'object'
    ) {
        return false;
    }

    const element = value as Element;

    const ownerDocument = element.ownerDocument;

    if (!ownerDocument) {
        return false;
    }

    const HTMLElementConstructor =
        ownerDocument.defaultView?.HTMLElement;

    if (!HTMLElementConstructor) {
        return false;
    }

    return value instanceof HTMLElementConstructor;
}

function createCanvas(
    container: HTMLElement,
): HTMLCanvasElement {
    const canvas =
        container.ownerDocument.createElement('canvas');

    container.appendChild(canvas);

    return canvas;
}