// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Error404GameElement, registerError404Game} from './index';
import {create404Game} from '../public';

const mocks = vi.hoisted(() => ({
    runtime: {pause: vi.fn(), resume: vi.fn(), restart: vi.fn(), destroy: vi.fn()},
    createRuntime: vi.fn(),
}));

vi.mock('../browser/createBrowserRuntime', () => ({
    createBrowserRuntime: mocks.createRuntime,
}));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRuntime.mockReturnValue(mocks.runtime);
});

afterEach(() => document.body.replaceChildren());

describe('Web Component public entry and registration', () => {
    it('exports the class and helper without registering on import', () => {
        expect(Error404GameElement.prototype).toBeInstanceOf(HTMLElement);
        expect(registerError404Game).toBeTypeOf('function');
        expect(customElements.get('error-404-game')).toBeUndefined();
    });

    it('registers the element once and safely supports repeated calls and imports', async () => {
        const define = vi.spyOn(customElements, 'define');
        try {
            registerError404Game();
            registerError404Game();
            const entry = await import('./index');
            entry.registerError404Game();
            expect(define).toHaveBeenCalledExactlyOnceWith('error-404-game', Error404GameElement);
            expect(customElements.get('error-404-game')).toBe(Error404GameElement);
            expect(document.createElement('error-404-game')).toBeInstanceOf(Error404GameElement);
        } finally {
            define.mockRestore();
        }
    });

    it('uses real factory defaults again when accent-color is removed', () => {
        registerError404Game();
        const element = document.createElement('error-404-game');
        element.setAttribute('accent-color', '#123456');
        document.body.appendChild(element);
        expect(mocks.createRuntime).toHaveBeenLastCalledWith({
            canvas: element.querySelector('canvas'), accentColor: '#123456',
        });
        element.removeAttribute('accent-color');
        expect(mocks.runtime.destroy).toHaveBeenCalledOnce();
        expect(element.querySelectorAll('canvas')).toHaveLength(1);
        expect(mocks.createRuntime).toHaveBeenLastCalledWith({
            canvas: element.querySelector('canvas'), accentColor: '#414141',
        });
    });

    it.each(['', '   '])('preserves public validation for blank accent %j and recovers after removal', (accentColor) => {
        registerError404Game();
        const element = document.createElement('error-404-game') as Error404GameElement;
        document.body.appendChild(element);
        let expectedError: unknown;
        try {
            create404Game({container: document.createElement('div'), accentColor});
        } catch (error) {
            expectedError = error;
        }
        expect(expectedError).toBeInstanceOf(Error);
        const errors: unknown[] = [];
        const onError = (event: ErrorEvent) => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener('error', onError);
        try {
            element.setAttribute('accent-color', accentColor);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBeInstanceOf(Error);
            expect((errors[0] as Error).message).toBe((expectedError as Error).message);
            expect(mocks.runtime.destroy).toHaveBeenCalledOnce();
            expect(mocks.createRuntime).toHaveBeenCalledOnce();
            expect(element.querySelector('canvas')).toBeNull();
            element.pause();
            element.resume();
            element.restart();
            expect(mocks.runtime.pause).not.toHaveBeenCalled();
            expect(mocks.runtime.resume).not.toHaveBeenCalled();
            expect(mocks.runtime.restart).not.toHaveBeenCalled();

            element.removeAttribute('accent-color');
            expect(mocks.createRuntime).toHaveBeenCalledTimes(2);
            expect(element.querySelectorAll('canvas')).toHaveLength(1);
            expect(errors).toHaveLength(1);
        } finally {
            element.remove();
            window.removeEventListener('error', onError);
        }
    });
});
