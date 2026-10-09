// @vitest-environment jsdom

import {describe, expect, it} from 'vitest';

import {create404Game} from './createGame';
import type {GameOptions} from "./GameOptions.ts";
import type {GameController} from "./GameController.ts";

describe('create404Game', () => {
    it('creates a canvas inside the provided container', () => {
        const container = document.createElement('div');

        create404Game({container});

        expect(container.querySelector('canvas')).not.toBeNull();
    });

    it('removes the canvas when destroyed', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.destroy();

        expect(container.querySelector('canvas')).toBeNull();
    });

    it('can be destroyed multiple times safely', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        expect(() => {
            game.destroy();
            game.destroy();
        }).not.toThrow();

        expect(container.querySelector('canvas')).toBeNull();
    });

    it('ignores lifecycle calls after destroy', () => {
        const container = document.createElement('div');

        const game = create404Game({container});

        game.destroy();

        expect(() => {
            game.pause();
            game.resume();
            game.restart();
        }).not.toThrow();

        expect(container.querySelector('canvas')).toBeNull();
    });

    it('throws when options are missing', () => {
        expect(() => {
            create404Game(undefined as unknown as GameOptions);
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
        }).toThrow('accentColor must be a string');

        expect(container.querySelector('canvas')).toBeNull();
    });
});

describe('public API', () => {
    it('exports create404Game', () => {
        expect(create404Game).toBeTypeOf('function');
    });

    it('exposes the expected public types', () => {
        const options: GameOptions = {
            container: document.createElement('div'),
        };

        const controller: GameController = create404Game(options);

        expect(controller.pause).toBeTypeOf('function');
        expect(controller.resume).toBeTypeOf('function');
        expect(controller.restart).toBeTypeOf('function');
        expect(controller.destroy).toBeTypeOf('function');

        controller.destroy();
    });
});