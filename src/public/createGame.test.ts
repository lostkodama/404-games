// src/public/createGame.test.ts

// @vitest-environment jsdom

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {create404Game} from './createGame';
import {createBrowserRuntime} from "../browser/createBrowserRuntime.ts";

const mocks = vi.hoisted(() => ({
    runtime: {
        pause: vi.fn(),
        resume: vi.fn(),
        restart: vi.fn(),
        destroy: vi.fn(),
    },
}));

vi.mock('../browser/createBrowserRuntime', () => ({
    createBrowserRuntime: vi.fn(() => mocks.runtime),
}));

describe('create404Game', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a canvas inside the provided container', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        expect(container.querySelector('canvas')).not.toBeNull();

        game.destroy();
    });

    it('removes its canvas and preserves the error when runtime initialization fails', () => {
        const container = document.createElement('div');
        const initializationError = new Error('runtime initialization failed');
        let createdCanvas: HTMLCanvasElement | undefined;

        vi.mocked(createBrowserRuntime).mockImplementationOnce(({canvas}) => {
            createdCanvas = canvas;
            expect(canvas.parentNode).toBe(container);
            throw initializationError;
        });

        let thrownError: unknown;
        try {
            create404Game({container});
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBe(initializationError);
        expect(createBrowserRuntime).toHaveBeenCalledOnce();
        expect(createdCanvas).toBeInstanceOf(HTMLCanvasElement);
        expect(createdCanvas!.parentNode).toBeNull();
        expect(container.querySelectorAll('canvas')).toHaveLength(0);
    });

    it('delegates lifecycle methods to the runtime', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.pause();
        game.resume();
        game.restart();

        expect(mocks.runtime.pause).toHaveBeenCalledOnce();
        expect(mocks.runtime.resume).toHaveBeenCalledOnce();
        expect(mocks.runtime.restart).toHaveBeenCalledOnce();

        game.destroy();
    });

    it('destroys the runtime and removes the canvas', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.destroy();

        expect(mocks.runtime.destroy).toHaveBeenCalledOnce();
        expect(container.querySelector('canvas')).toBeNull();
    });

    it('can be destroyed multiple times safely', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.destroy();
        game.destroy();

        expect(mocks.runtime.destroy).toHaveBeenCalledOnce();
        expect(container.querySelector('canvas')).toBeNull();
    });

    it('ignores lifecycle calls after destroy', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.destroy();

        game.pause();
        game.resume();
        game.restart();

        expect(mocks.runtime.pause).not.toHaveBeenCalled();
        expect(mocks.runtime.resume).not.toHaveBeenCalled();
        expect(mocks.runtime.restart).not.toHaveBeenCalled();
    });

    it('throws when options are missing', () => {
        expect(() => {
            create404Game(undefined as never);
        }).toThrow('options are required');
    });

    it('throws when container is not an element', () => {
        expect(() => {
            create404Game({
                container: {} as HTMLElement,
            });
        }).toThrow('container must be an HTML element');
    });

    it('throws when accentColor is not a string', () => {
        const container = document.createElement('div');

        expect(() => {
            create404Game({
                container,
                accentColor: 123 as unknown as string,
            });
        }).toThrow('accentColor must be a non-empty string');

        expect(container.querySelector('canvas')).toBeNull();
    });

    it('throws when accentColor is empty', () => {
        const container = document.createElement('div');

        expect(() => {
            create404Game({
                container,
                accentColor: '   ',
            });
        }).toThrow('accentColor must be a non-empty string');

        expect(container.querySelector('canvas')).toBeNull();
    });

    it('uses the default accent color when none is provided', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        expect(createBrowserRuntime).toHaveBeenCalledWith(
            expect.objectContaining({
                accentColor: '#414141',
            }),
        );

        game.destroy();
    });

    it('forwards a custom accent color to the runtime', () => {
        const container = document.createElement('div');

        const game = create404Game({
            container,
            accentColor: '#ff0000',
        });

        expect(createBrowserRuntime).toHaveBeenCalledWith(
            expect.objectContaining({
                accentColor: '#ff0000',
            }),
        );

        game.destroy();
    });
    it('removes the canvas even when runtime destroy throws', () => {
        const container = document.createElement('div');

        mocks.runtime.destroy.mockImplementationOnce(() => {
            throw new Error('runtime destroy failed');
        });

        const game = create404Game({ container });

        expect(() => {
            game.destroy();
        }).toThrow('runtime destroy failed');

        expect(container.querySelector('canvas')).toBeNull();
    });
});
