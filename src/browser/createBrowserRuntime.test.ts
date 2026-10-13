// src/browser/createBrowserRuntime.test.ts

// @vitest-environment jsdom

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {createBrowserRuntime} from './createBrowserRuntime';
import {bindInput} from "../game/input/browserInput.ts";
import {startGame} from "../game/Game.ts";

// Test is intentionally mock heavy compared to core tests since this is a wiring layer
const mocks = vi.hoisted(() => ({
    game: {
        pause: vi.fn(),
        resume: vi.fn(),
        restart: vi.fn(),
        destroy: vi.fn(),
        pressJump: vi.fn(),
        pressRestart: vi.fn(),
        getGameStatus: vi.fn(),
    },

    sounds: {
        play: vi.fn(),
        unlock: vi.fn(),
        dispose: vi.fn(),
    },

    unbindInput: vi.fn(),
}));

vi.mock('../game/Game', () => ({
    startGame: vi.fn(() => mocks.game),
}));

vi.mock('../audio/sounds', () => ({
    createSounds: vi.fn(() => mocks.sounds),
}));

vi.mock('../game/input/browserInput', () => ({
    bindInput: vi.fn(() => mocks.unbindInput),
}));

describe('createBrowserRuntime', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function createRuntime() {
        const canvas = document.createElement('canvas');

        vi.spyOn(canvas, 'getContext')
            .mockReturnValue({} as CanvasRenderingContext2D);

        return createBrowserRuntime({
            canvas,
            accentColor: '#414141',
        });
    }

    it('delegates lifecycle methods to the game session', () => {
        const runtime = createRuntime();

        runtime.pause();
        runtime.resume();
        runtime.restart();

        expect(mocks.game.pause).toHaveBeenCalledOnce();
        expect(mocks.game.resume).toHaveBeenCalledOnce();
        expect(mocks.game.restart).toHaveBeenCalledOnce();
    });

    it('cleans up runtime resources when destroyed', () => {
        const runtime = createRuntime();

        runtime.destroy();

        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('continues cleanup, preserves the first error, and does not retry a failed destroy', () => {
        const runtime = createRuntime();
        const firstError = new Error('input cleanup failed');

        mocks.unbindInput.mockImplementationOnce(() => {
            throw firstError;
        });
        mocks.game.destroy.mockImplementationOnce(() => {
            throw new Error('game cleanup failed');
        });

        let thrownError: unknown;
        try {
            runtime.destroy();
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBe(firstError);
        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();

        expect(() => runtime.destroy()).not.toThrow();

        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it.each([null, undefined, 0, false, ''])('preserves the first thrown cleanup value %j', (firstError) => {
        const runtime = createRuntime();
        mocks.unbindInput.mockImplementationOnce(() => {
            throw firstError;
        });
        mocks.game.destroy.mockImplementationOnce(() => {
            throw new Error('later cleanup failed');
        });

        let didThrow = false;
        let thrownError: unknown;
        try {
            runtime.destroy();
        } catch (error) {
            didThrow = true;
            thrownError = error;
        }

        expect(didThrow).toBe(true);
        expect(thrownError).toBe(firstError);
        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('destroys runtime resources only once', () => {
        const runtime = createRuntime();

        runtime.destroy();
        runtime.destroy();

        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('ignores lifecycle calls after destroy', () => {
        const runtime = createRuntime();

        runtime.destroy();

        runtime.pause();
        runtime.resume();
        runtime.restart();

        expect(mocks.game.pause).not.toHaveBeenCalled();
        expect(mocks.game.resume).not.toHaveBeenCalled();
        expect(mocks.game.restart).not.toHaveBeenCalled();
    });

    it('disposes sounds when game initialization fails', () => {
        vi.mocked(startGame).mockImplementationOnce(() => {
            throw new Error('game initialization failed');
        });

        const canvas = document.createElement('canvas');

        vi.spyOn(canvas, 'getContext')
            .mockReturnValue({} as CanvasRenderingContext2D);

        expect(() => {
            createBrowserRuntime({
                canvas,
                accentColor: '#414141',
            });
        }).toThrow('game initialization failed');

        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('preserves the game initialization error when audio rollback also fails', () => {
        const initializationError = new Error('game initialization failed');
        vi.mocked(startGame).mockImplementationOnce(() => {
            throw initializationError;
        });
        mocks.sounds.dispose.mockImplementationOnce(() => {
            throw new Error('audio cleanup failed');
        });

        let thrownError: unknown;
        try {
            createRuntime();
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBe(initializationError);
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('destroys the game and disposes sounds when input binding fails', () => {
        vi.mocked(bindInput).mockImplementationOnce(() => {
            throw new Error('input binding failed');
        });

        const canvas = document.createElement('canvas');

        vi.spyOn(canvas, 'getContext')
            .mockReturnValue({} as CanvasRenderingContext2D);

        expect(() => {
            createBrowserRuntime({
                canvas,
                accentColor: '#414141',
            });
        }).toThrow('input binding failed');

        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });

    it('continues rollback and preserves the initialization error when cleanup throws', () => {
        vi.mocked(bindInput).mockImplementationOnce(() => {
            throw new Error('input binding failed');
        });

        mocks.sounds.dispose.mockImplementationOnce(() => {
            throw new Error('audio cleanup failed');
        });

        const canvas = document.createElement('canvas');

        vi.spyOn(canvas, 'getContext')
            .mockReturnValue({} as CanvasRenderingContext2D);

        expect(() => {
            createBrowserRuntime({
                canvas,
                accentColor: '#414141',
            });
        }).toThrow('input binding failed');

        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });
});
