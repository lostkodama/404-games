// src/browser/createBrowserRuntime.test.ts

// @vitest-environment jsdom

import {
    beforeEach,
    afterEach,
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
        redraw: vi.fn(),
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

let resizeCallback: ResizeObserverCallback;

const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();
let mediaQueries: Array<{
    query: string;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatchEvent: (event: Event) => boolean;
}>;
const matchMedia = vi.fn((query: string) => {
    const target = new EventTarget();
    const mediaQuery = {
        query,
        addEventListener: vi.fn(target.addEventListener.bind(target)),
        removeEventListener: vi.fn(target.removeEventListener.bind(target)),
        dispatchEvent: target.dispatchEvent.bind(target),
    };
    mediaQueries.push(mediaQuery);
    return mediaQuery as unknown as MediaQueryList;
});

class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
    }

    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
}

beforeEach(() => {
    mediaQueries = [];
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.clearAllMocks();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

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
        expect(disconnect).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();

        expect(() => runtime.destroy()).not.toThrow();

        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(disconnect).toHaveBeenCalledOnce();
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
        expect(observe).not.toHaveBeenCalled();
        expect(disconnect).not.toHaveBeenCalled();
        expect(bindInput).not.toHaveBeenCalled();
    });

    it('initializes the game before observe can deliver a resize callback', () => {
        observe.mockImplementationOnce(() => {
            expect(startGame).toHaveBeenCalledOnce();
            resizeCallback([], {} as ResizeObserver);
        });
        const runtime = createRuntime();
        expect(mocks.game.redraw).toHaveBeenCalledOnce();
        runtime.destroy();
    });

    it('rolls back game and audio when the ResizeObserver constructor fails', () => {
        const initializationError = new Error('observer construction failed');
        vi.stubGlobal('ResizeObserver', class {
            constructor() { throw initializationError; }
        });
        mocks.sounds.dispose.mockImplementationOnce(() => {
            throw new Error('audio cleanup failed');
        });

        let thrown: unknown;
        try { createRuntime(); } catch (error) { thrown = error; }

        expect(thrown).toBe(initializationError);
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(bindInput).not.toHaveBeenCalled();
        expect(disconnect).not.toHaveBeenCalled();
    });

    it('disconnects and continues rollback when observe and disconnect both fail', () => {
        const initializationError = new Error('observe failed');
        observe.mockImplementationOnce(() => { throw initializationError; });
        disconnect.mockImplementationOnce(() => { throw new Error('disconnect failed'); });

        let thrown: unknown;
        try { createRuntime(); } catch (error) { thrown = error; }

        expect(thrown).toBe(initializationError);
        expect(disconnect).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(bindInput).not.toHaveBeenCalled();
        resizeCallback([], {} as ResizeObserver);
        expect(mocks.game.redraw).not.toHaveBeenCalled();
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
        const initializationError = new Error('input binding failed');
        vi.mocked(bindInput).mockImplementationOnce(() => {
            throw initializationError;
        });

        disconnect.mockImplementationOnce(() => { throw new Error('disconnect failed'); });

        mocks.sounds.dispose.mockImplementationOnce(() => {
            throw new Error('audio cleanup failed');
        });

        const canvas = document.createElement('canvas');

        vi.spyOn(canvas, 'getContext')
            .mockReturnValue({} as CanvasRenderingContext2D);

        let thrown: unknown;
        try {
            createBrowserRuntime({
                canvas,
                accentColor: '#414141',
            });
        } catch (error) { thrown = error; }

        expect(thrown).toBe(initializationError);
        expect(disconnect).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
        resizeCallback([], {} as ResizeObserver);
        expect(mocks.game.redraw).not.toHaveBeenCalled();
    });

    it('redraws the game when the canvas is resized', () => {

        const canvas = document.createElement('canvas')
        vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)

        const runtime = createBrowserRuntime({
            canvas,
            accentColor: '#414141'
        })

        expect(observe).toHaveBeenCalledWith(canvas)

        // resize change
        resizeCallback!([], {} as ResizeObserver)
        expect(mocks.game.redraw).toHaveBeenCalledOnce();

        // destroy
        runtime.destroy();
        expect(disconnect).toHaveBeenCalledOnce();
        resizeCallback([], {} as ResizeObserver);
        expect(mocks.game.redraw).toHaveBeenCalledOnce();
    });

    it('redraws and re-registers observation after successive DPR changes', () => {
        const runtime = createRuntime();
        expect(matchMedia).toHaveBeenLastCalledWith('(resolution: 1dppx)');

        vi.stubGlobal('devicePixelRatio', 2);
        mediaQueries[0].dispatchEvent(new Event('change'));
        expect(mocks.game.redraw).toHaveBeenCalledOnce();
        expect(matchMedia).toHaveBeenLastCalledWith('(resolution: 2dppx)');
        expect(mediaQueries[0].removeEventListener).toHaveBeenCalledOnce();

        vi.stubGlobal('devicePixelRatio', 3);
        mediaQueries[1].dispatchEvent(new Event('change'));
        expect(mocks.game.redraw).toHaveBeenCalledTimes(2);
        expect(matchMedia).toHaveBeenLastCalledWith('(resolution: 3dppx)');
        expect(mediaQueries[1].removeEventListener).toHaveBeenCalledOnce();
        expect(mocks.game.pause).not.toHaveBeenCalled();
        expect(mocks.game.resume).not.toHaveBeenCalled();
        expect(mocks.game.restart).not.toHaveBeenCalled();

        runtime.destroy();
    });

    it('removes DPR listeners and ignores queued changes after destroy', () => {
        const runtime = createRuntime();
        const queuedCallback = mediaQueries[0].addEventListener.mock.calls[0][1] as EventListener;

        runtime.destroy();
        runtime.destroy();

        expect(mediaQueries[0].removeEventListener).toHaveBeenCalledExactlyOnceWith('change', queuedCallback);
        mediaQueries[0].dispatchEvent(new Event('change'));
        queuedCallback(new Event('change'));
        expect(mocks.game.redraw).not.toHaveBeenCalled();
        expect(matchMedia).toHaveBeenCalledOnce();
    });

    it('observes DPR using the canvas owning window', () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const ownerWindow = iframe.contentWindow!;
        const addEventListener = vi.fn();
        const removeEventListener = vi.fn();
        const ownerMatchMedia = vi.fn(() => ({addEventListener, removeEventListener}));
        Object.defineProperty(ownerWindow, 'devicePixelRatio', {value: 2, configurable: true});
        Object.defineProperty(ownerWindow, 'matchMedia', {value: ownerMatchMedia, configurable: true});
        const ownerResizeObserver = vi.fn(function (callback: ResizeObserverCallback) {
            return new ResizeObserverMock(callback);
        });
        Object.defineProperty(ownerWindow, 'ResizeObserver', {value: ownerResizeObserver, configurable: true});
        const canvas = ownerWindow.document.createElement('canvas');
        vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

        let runtime: ReturnType<typeof createBrowserRuntime> | undefined;
        try {
            runtime = createBrowserRuntime({canvas, accentColor: '#414141'});
            expect(ownerMatchMedia).toHaveBeenCalledExactlyOnceWith('(resolution: 2dppx)');
            expect(matchMedia).not.toHaveBeenCalled();
            expect(ownerResizeObserver).toHaveBeenCalledOnce();
        } finally {
            runtime?.destroy();
            iframe.remove();
        }
        expect(removeEventListener).toHaveBeenCalledOnce();
    });

    it('rolls back runtime resources when DPR observation fails', () => {
        matchMedia.mockImplementationOnce(() => {
            throw new Error('DPR observation failed');
        });

        expect(createRuntime).toThrow('DPR observation failed');
        expect(mocks.unbindInput).toHaveBeenCalledOnce();
        expect(disconnect).toHaveBeenCalledOnce();
        expect(mocks.game.destroy).toHaveBeenCalledOnce();
        expect(mocks.sounds.dispose).toHaveBeenCalledOnce();
    });
});
