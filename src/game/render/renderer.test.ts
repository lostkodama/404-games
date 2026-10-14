// @vitest-environment jsdom
import {expect, it, vi} from 'vitest';
import {render} from './renderer';
import {createGameState} from '../gameState';
import {CAT_FRAME_HEIGHT, CAT_FRAME_WIDTH} from '../constants';
import type {SpriteAssets} from './spriteTypes';

it('keeps canvas state balanced when repeatedly rendering a loaded player sprite', () => {
    const canvas = document.createElement('canvas');
    const state = createGameState();
    state.clouds = [];
    state.groundDetails = [];
    const assets: SpriteAssets = {
        catSpriteSheet: document.createElement('img'),
        catSpriteLoaded: true,
        obstacles: {},
    };
    let depth = 0;
    const context = {
        save: vi.fn(() => { depth++; }),
        restore: vi.fn(() => {
            expect(depth).toBeGreaterThan(0);
            depth--;
        }),
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn(),
        drawImage: vi.fn(),
        getTransform: vi.fn(() => ({a: 1, d: 1})),
    };

    for (let frame = 0; frame < 10; frame++) {
        render(context as unknown as CanvasRenderingContext2D, canvas, state, assets, {accentColor: '#414141'});
        expect(depth).toBe(0);
        expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
    }

    expect(context.drawImage).toHaveBeenCalledTimes(10);
    expect(context.drawImage).toHaveBeenLastCalledWith(
        assets.catSpriteSheet,
        state.player.frame * CAT_FRAME_WIDTH, 0, CAT_FRAME_WIDTH, CAT_FRAME_HEIGHT,
        state.player.x, state.player.y, state.player.width, state.player.height,
    );
});
