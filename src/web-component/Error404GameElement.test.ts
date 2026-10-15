// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {create404Game} from '../public';
import {Error404GameElement} from './Error404GameElement';

vi.mock('../public', () => ({create404Game: vi.fn()}));

// Registration is local to this test environment; production registration is Group 2.
customElements.define('error-404-game', Error404GameElement);

function createController() {
    return {pause: vi.fn(), resume: vi.fn(), restart: vi.fn(), destroy: vi.fn()};
}

let controllers: ReturnType<typeof createController>[];

beforeEach(() => {
    controllers = [];
    vi.mocked(create404Game).mockReset();
    vi.mocked(create404Game).mockImplementation(() => {
        const controller = createController();
        controllers.push(controller);
        return controller;
    });
});

afterEach(() => document.body.replaceChildren());

function createElement() {
    return document.createElement('error-404-game') as Error404GameElement;
}

describe('Error404GameElement lifecycle', () => {
    it('only creates a game when connected and uses itself as the light DOM container', () => {
        const element = createElement();
        element.connectedCallback();
        expect(create404Game).not.toHaveBeenCalled();

        document.body.appendChild(element);

        expect(create404Game).toHaveBeenCalledExactlyOnceWith({container: element});
        expect(element.shadowRoot).toBeNull();
        expect('destroy' in element).toBe(false);
    });

    it('does not create duplicate games for repeated connected callbacks', () => {
        const element = createElement();
        document.body.appendChild(element);
        element.connectedCallback();
        element.connectedCallback();
        expect(create404Game).toHaveBeenCalledOnce();
    });

    it('destroys on removal and safely ignores repeated disconnection', () => {
        const element = createElement();
        document.body.appendChild(element);
        element.remove();
        element.disconnectedCallback();
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
    });

    it('creates a fresh controller on reconnection and delegates only to that controller', () => {
        const element = createElement();
        document.body.appendChild(element);
        element.remove();
        document.body.appendChild(element);
        element.pause();
        element.resume();
        element.restart();

        expect(create404Game).toHaveBeenCalledTimes(2);
        expect(controllers[0]).not.toBe(controllers[1]);
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        for (const method of ['pause', 'resume', 'restart'] as const) {
            expect(controllers[0][method]).not.toHaveBeenCalled();
            expect(controllers[1][method]).toHaveBeenCalledOnce();
        }
        element.remove();
        expect(controllers[1].destroy).toHaveBeenCalledOnce();
    });

    it('delegates pause, resume, and restart to the active game', () => {
        const element = createElement();
        document.body.appendChild(element);
        element.pause();
        element.resume();
        element.restart();
        expect(controllers[0].pause).toHaveBeenCalledOnce();
        expect(controllers[0].resume).toHaveBeenCalledOnce();
        expect(controllers[0].restart).toHaveBeenCalledOnce();
    });

    it('safely ignores lifecycle methods before connection and after removal', () => {
        const element = createElement();
        expect(() => {
            element.pause();
            element.resume();
            element.restart();
            element.disconnectedCallback();
        }).not.toThrow();
        expect(create404Game).not.toHaveBeenCalled();

        document.body.appendChild(element);
        element.remove();
        expect(() => {
            element.pause();
            element.resume();
            element.restart();
        }).not.toThrow();
        expect(controllers[0].pause).not.toHaveBeenCalled();
        expect(controllers[0].resume).not.toHaveBeenCalled();
        expect(controllers[0].restart).not.toHaveBeenCalled();
    });

    it('surfaces initialization failure and can create a game on a later connection', () => {
        const element = createElement();
        const initializationError = new Error('game initialization failed');
        vi.mocked(create404Game).mockImplementationOnce(() => { throw initializationError; });
        const errors: unknown[] = [];
        const onError = (event: ErrorEvent) => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener('error', onError);
        try {
            document.body.appendChild(element);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBe(initializationError);
            expect(create404Game).toHaveBeenCalledOnce();
            expect(controllers).toHaveLength(0);
            expect(() => {
                element.pause();
                element.resume();
                element.restart();
            }).not.toThrow();

            element.remove();
            document.body.appendChild(element);
            expect(create404Game).toHaveBeenCalledTimes(2);
            expect(controllers).toHaveLength(1);
            element.pause();
            element.resume();
            element.restart();
            for (const method of ['pause', 'resume', 'restart'] as const) {
                expect(controllers[0][method]).toHaveBeenCalledOnce();
            }
            element.remove();
            expect(controllers[0].destroy).toHaveBeenCalledOnce();
            expect(errors).toHaveLength(1);
        } finally {
            window.removeEventListener('error', onError);
            element.remove();
        }
    });

    it('surfaces destruction failure, releases the old controller, and reconnects with a fresh game', () => {
        const element = createElement();
        document.body.appendChild(element);
        const oldController = controllers[0];
        const destructionError = new Error('game destruction failed');
        oldController.destroy.mockImplementationOnce(() => { throw destructionError; });
        const errors: unknown[] = [];
        const onError = (event: ErrorEvent) => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener('error', onError);
        try {
            element.remove();
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBe(destructionError);
            expect(() => {
                element.disconnectedCallback();
                element.pause();
                element.resume();
                element.restart();
            }).not.toThrow();
            expect(oldController.destroy).toHaveBeenCalledOnce();

            document.body.appendChild(element);
            expect(create404Game).toHaveBeenCalledTimes(2);
            expect(controllers[1]).not.toBe(oldController);
            element.pause();
            element.resume();
            element.restart();
            for (const method of ['pause', 'resume', 'restart'] as const) {
                expect(oldController[method]).not.toHaveBeenCalled();
                expect(controllers[1][method]).toHaveBeenCalledOnce();
            }
            element.remove();
            expect(controllers[1].destroy).toHaveBeenCalledOnce();
            expect(oldController.destroy).toHaveBeenCalledOnce();
            expect(errors).toHaveLength(1);
        } finally {
            window.removeEventListener('error', onError);
            element.remove();
        }
    });

    it('reads the current accent attribute at creation without reacting to changes', () => {
        const element = createElement();
        element.setAttribute('accent-color', '#123456');
        document.body.appendChild(element);
        expect(create404Game).toHaveBeenLastCalledWith({container: element, accentColor: '#123456'});

        element.setAttribute('accent-color', '#abcdef');
        expect(create404Game).toHaveBeenCalledOnce();
        expect(controllers[0].destroy).not.toHaveBeenCalled();

        element.remove();
        document.body.appendChild(element);
        expect(create404Game).toHaveBeenCalledTimes(2);
        expect(create404Game).toHaveBeenLastCalledWith({container: element, accentColor: '#abcdef'});
    });
});
