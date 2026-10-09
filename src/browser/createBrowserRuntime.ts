// src/browser/createBrowserRuntime.ts

import {createSounds} from "../audio/sounds.ts";
import {startGame} from "../game/Game.ts";
import {bindInput} from "../game/input/browserInput.ts";

// TODO: MXNN_ create browser runtime

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
    const game = startGame(canvas, context, sounds.play);

    const unbindInput = bindInput({
        canvas,
        onJump: () => game.pressJump(),
        onRestart: () => game.pressRestart(),
        getGameStatus: () => game.getGameStatus(),
        onInteraction: sounds.unlock,
    });

    return {
        pause() {
            game.pause()
        },

        resume() {
            game.resume()
        },

        restart() {
            game.restart()
        },

        destroy() {
            unbindInput();
            game.destroy()
            sounds.dispose()
        },
    };
}