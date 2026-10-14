// src/game/loop/gameLoop.test.ts

// @vitest-environment jsdom

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    startGameLoop,
    type GameLoopController,
} from './gameLoop';

describe('startGameLoop', () => {
    let frameCallback: FrameRequestCallback | undefined;
    let loops: GameLoopController[];

    const onFrame = vi.fn();
    const onSuspend = vi.fn();
    const onResume = vi.fn();

    beforeEach(() => {
        frameCallback = undefined;
        loops = [];

        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn((callback: FrameRequestCallback) => {
                frameCallback = callback;
                return 1;
            }),
        );

        vi.stubGlobal(
            'cancelAnimationFrame',
            vi.fn(),
        );

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });

        vi.clearAllMocks();
    });

    afterEach(() => {
        // Important:
        // removes visibilitychange listeners even if a test fails
        for (const loop of loops) {
            loop.stop();
        }

        vi.unstubAllGlobals();
    });

    function createLoop(): GameLoopController {
        const loop = startGameLoop({
            document,
            maxDeltaTime: 0.1,
            onFrame,
            onSuspend,
            onResume,
        });

        loops.push(loop);

        return loop;
    }

    function runFrame(time: number): void {
        const callback = frameCallback;

        if (!callback) {
            throw new Error('No animation frame scheduled');
        }

        // Simulate the browser consuming the scheduled frame.
        frameCallback = undefined;

        callback(time);
    }

    function setVisibility(
        visibilityState: DocumentVisibilityState,
    ): void {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: visibilityState,
        });

        document.dispatchEvent(
            new Event('visibilitychange'),
        );
    }

    it('schedules a frame when started', () => {
        createLoop();

        expect(requestAnimationFrame).toHaveBeenCalledOnce();
    });

    it('does not schedule a frame when created while hidden', () => {
        setVisibility('hidden');
        createLoop();

        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(onFrame).not.toHaveBeenCalled();
    });

    it('schedules its first frame with zero delta after becoming visible', () => {
        setVisibility('hidden');
        createLoop();

        setVisibility('visible');

        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(onResume).toHaveBeenCalledOnce();

        runFrame(5000);

        expect(onFrame).toHaveBeenCalledExactlyOnceWith(0);
    });

    it('stays manually paused when created hidden and then made visible', () => {
        setVisibility('hidden');
        const loop = createLoop();

        loop.pause();
        setVisibility('visible');

        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(onFrame).not.toHaveBeenCalled();

        loop.resume();

        expect(requestAnimationFrame).toHaveBeenCalledOnce();

        runFrame(5000);

        expect(onFrame).toHaveBeenCalledExactlyOnceWith(0);
    });

    it('runs frames while active', () => {
        createLoop();

        runFrame(1000);
        runFrame(1016);

        expect(onFrame).toHaveBeenCalledTimes(2);
        expect(onFrame).toHaveBeenLastCalledWith(0.016);
    });

    it('caps delta time at maxDeltaTime', () => {
        createLoop();

        runFrame(1000);
        runFrame(2000);

        expect(onFrame).toHaveBeenLastCalledWith(0.1);
    });

    it('pauses the game loop', () => {
        const loop = createLoop();

        loop.pause();

        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });

    it('resumes the game loop after pause', () => {
        const loop = createLoop();

        loop.pause();
        loop.resume();

        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

        runFrame(1000);

        expect(onFrame).toHaveBeenCalledOnce();
    });

    it('handles repeated pause and resume calls safely', () => {
        const loop = createLoop();

        loop.pause();
        loop.pause();

        expect(cancelAnimationFrame).toHaveBeenCalledOnce();

        loop.resume();
        loop.resume();

        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    });

    it('resets timing after pause so paused time is not included in delta time', () => {
        const loop = createLoop();

        runFrame(1000);
        runFrame(1016);

        expect(onFrame).toHaveBeenLastCalledWith(0.016);

        loop.pause();
        loop.resume();

        // A large amount of real time passes.
        runFrame(5000);

        // First frame after resume establishes a new timestamp.
        expect(onFrame).toHaveBeenLastCalledWith(0);
    });

    it('suspends when the document becomes hidden', () => {
        createLoop();

        setVisibility('hidden');

        expect(onSuspend).toHaveBeenCalledOnce();
        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });

    it('resumes after browser suspension when not manually paused', () => {
        createLoop();

        setVisibility('hidden');
        setVisibility('visible');

        expect(onSuspend).toHaveBeenCalledOnce();
        expect(onResume).toHaveBeenCalledOnce();

        // Initial frame + frame scheduled after visibility restore.
        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    });

    it('stays manually paused after browser suspend and resume', () => {
        const loop = createLoop();

        loop.pause();

        setVisibility('hidden');

        expect(onSuspend).toHaveBeenCalledOnce();

        setVisibility('visible');

        expect(onResume).toHaveBeenCalledOnce();

        // Only the initial RAF was requested.
        // Visibility restore must not override manual pause.
        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

        loop.resume();

        // Manual resume now schedules the next frame.
        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    });

    it('resets timing after browser suspension', () => {
        createLoop();

        runFrame(1000);
        runFrame(1016);

        setVisibility('hidden');
        setVisibility('visible');

        runFrame(5000);

        expect(onFrame).toHaveBeenLastCalledWith(0);
    });

    it('stops the game loop', () => {
        const loop = createLoop();

        loop.stop();

        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });

    it('does not schedule another frame after stop', () => {
        const loop = createLoop();

        loop.stop();
        loop.resume();

        // Only the initial RAF.
        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('handles repeated stop calls safely', () => {
        const loop = createLoop();

        loop.stop();
        loop.stop();

        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });

    it('does not respond to visibility changes after stop', () => {
        const loop = createLoop();

        loop.stop();

        setVisibility('hidden');
        setVisibility('visible');

        expect(onSuspend).not.toHaveBeenCalled();
        expect(onResume).not.toHaveBeenCalled();

        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
});
