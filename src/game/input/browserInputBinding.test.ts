// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';
import {bindInput} from './browserInput';
import {GAME_STATE, type GameState} from '../types';

describe('browser input binding', () => {
    it('handles keyboard input only from the supplied window and removes that listener on unbind', () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        const ownerWindow = iframe.contentWindow! as Window & typeof globalThis;
        const canvas = ownerWindow.document.createElement('canvas');
        const onJump = vi.fn();
        const onRestart = vi.fn();
        const onInteraction = vi.fn();
        const unbind = bindInput({
            canvas,
            window: ownerWindow,
            onJump,
            onRestart,
            onInteraction,
            getGameStatus: () => GAME_STATE.RUNNING,
        });

        try {
            const unrelatedEvent = new KeyboardEvent('keydown', {code: 'Space', cancelable: true});
            window.dispatchEvent(unrelatedEvent);
            expect(onJump).not.toHaveBeenCalled();
            expect(onInteraction).not.toHaveBeenCalled();
            expect(unrelatedEvent.defaultPrevented).toBe(false);

            const owningEvent = new ownerWindow.KeyboardEvent('keydown', {code: 'Space', cancelable: true});
            ownerWindow.dispatchEvent(owningEvent);
            expect(onJump).toHaveBeenCalledOnce();
            expect(onInteraction).toHaveBeenCalledOnce();
            expect(owningEvent.defaultPrevented).toBe(true);

            unbind();
            const afterUnbind = new ownerWindow.KeyboardEvent('keydown', {code: 'Space', cancelable: true});
            ownerWindow.dispatchEvent(afterUnbind);
            expect(onJump).toHaveBeenCalledOnce();
            expect(onInteraction).toHaveBeenCalledOnce();
            expect(onRestart).not.toHaveBeenCalled();
            expect(afterUnbind.defaultPrevented).toBe(false);
        } finally {
            unbind();
            iframe.remove();
        }
    });

    it('routes events using current status, unlocks interaction, and unbinds both listeners', () => {
        const canvas = document.createElement('canvas');
        const onJump = vi.fn();
        const onRestart = vi.fn();
        const onInteraction = vi.fn();
        let status: GameState = GAME_STATE.READY;
        const unbind = bindInput({
            canvas, window, onJump, onRestart, onInteraction,
            getGameStatus: () => status,
        });
        const key = (code: string, repeat = false) => {
            const event = new KeyboardEvent('keydown', {code, repeat, cancelable: true});
            window.dispatchEvent(event);
            return event;
        };
        const pointer = () => {
            const event = new Event('pointerdown', {cancelable: true});
            canvas.dispatchEvent(event);
            return event;
        };
        try {
            expect(key('Space').defaultPrevented).toBe(true);
            expect(onJump).toHaveBeenCalledOnce();
            expect(key('Space', true).defaultPrevented).toBe(false);
            expect(key('Escape').defaultPrevented).toBe(false);
            expect(onInteraction).toHaveBeenCalledOnce();
            status = GAME_STATE.RUNNING;
            expect(key('ArrowUp').defaultPrevented).toBe(true);
            expect(pointer().defaultPrevented).toBe(true);
            expect(onJump).toHaveBeenCalledTimes(3);
            status = GAME_STATE.GAME_OVER;
            key('Space');
            pointer();
            expect(onRestart).toHaveBeenCalledTimes(2);
            expect(onInteraction).toHaveBeenCalledTimes(5);
            unbind();
            expect(key('Space').defaultPrevented).toBe(false);
            expect(pointer().defaultPrevented).toBe(false);
            expect(onRestart).toHaveBeenCalledTimes(2);
            expect(onInteraction).toHaveBeenCalledTimes(5);
        } finally {
            unbind();
        }
    });
});
