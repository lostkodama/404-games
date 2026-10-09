// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';
import {bindInput} from './browserInput';
import {GAME_STATE, type GameState} from '../types';

describe('browser input binding', () => {
    it('routes events using current status, unlocks interaction, and unbinds both listeners', () => {
        const canvas = document.createElement('canvas');
        const onJump = vi.fn();
        const onRestart = vi.fn();
        const onInteraction = vi.fn();
        let status: GameState = GAME_STATE.READY;
        const unbind = bindInput({
            canvas, onJump, onRestart, onInteraction,
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
