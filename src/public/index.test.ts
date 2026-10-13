// src/public/index.test.ts

// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

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

import {
    create404Game,
    type GameController,
    type GameOptions,
} from './index';

describe('public API', () => {
    it('exports create404Game through the public entry point', () => {
        expect(create404Game).toBeTypeOf('function');
    });

    it('exposes the expected public contracts', () => {
        const options: GameOptions = {
            container: document.createElement('div'),
        };

        const game: GameController = create404Game(options);

        expect(game.pause).toBeTypeOf('function');
        expect(game.resume).toBeTypeOf('function');
        expect(game.restart).toBeTypeOf('function');
        expect(game.destroy).toBeTypeOf('function');

        game.destroy();
    });
});