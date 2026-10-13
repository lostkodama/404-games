// src/browser/createBrowserRuntime.ts

import {createSounds} from "../audio/sounds.ts";
import {startGame} from "../game/Game.ts";
import {bindInput} from "../game/input/browserInput.ts";

export type GameRuntime = {
    pause(): void;
    resume(): void;
    restart(): void;
    destroy(): void;
};

type BrowserRuntimeOptions = {
    canvas: HTMLCanvasElement;
    accentColor: string;
};

export function createBrowserRuntime(
    options: BrowserRuntimeOptions,
): GameRuntime {
    const {canvas, accentColor} = options;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Unable to create 2D canvas context');
    }

    const sounds = createSounds();
    let game: ReturnType<typeof startGame>

    try {
        game = startGame(canvas, context, {accentColor}, sounds.play);
    } catch (error) {
        try {
            sounds.dispose();
        } catch {
            // Preserve the initialization error if rollback also fails.
        }
        throw error;
    }

    let unbindInput: () => void;

    try {
        unbindInput = bindInput({
            canvas,
            onJump: game.pressJump,
            onRestart: game.pressRestart,
            getGameStatus: game.getGameStatus,
            onInteraction: sounds.unlock,
        });
    } catch (error) {
        try {
            runCleanup([
                sounds.dispose,
                game?.destroy,
            ])
        } catch {

        }
        throw error;
    }

    let isDestroyed = false;

    return {
        pause() {
            if (isDestroyed) return
            game.pause()
        },

        resume() {
            if (isDestroyed) return
            game.resume()
        },

        restart() {
            if (isDestroyed) return
            game.restart()
        },

        destroy() {
            if (isDestroyed) return

            isDestroyed = true

            runCleanup([
                unbindInput,
                game.destroy,
                sounds.dispose,
            ]);
        },
    };
}

function runCleanup(cleanups: Array<() => void>): void {
    let hasError = false
    let firstError: unknown;

    for (const cleanup of cleanups) {
        try {
            cleanup();
        } catch (error) {
            if (!hasError) {
                firstError = error;
            }
            hasError = true
        }
    }

    if (hasError) {
        throw firstError;
    }
}
