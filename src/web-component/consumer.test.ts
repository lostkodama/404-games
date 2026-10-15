// @vitest-environment jsdom
import {afterEach, expect, it, vi} from 'vitest';
import {Error404GameElement, registerError404Game} from './index';

const mocks = vi.hoisted(() => ({createRuntime: vi.fn()}));
vi.mock('../browser/createBrowserRuntime', () => ({
    createBrowserRuntime: mocks.createRuntime,
}));

afterEach(() => document.body.replaceChildren());

it('supports a plain HTML consumer through registration, controls, accent changes, removal and reconnection', () => {
    const createRuntime = () => ({pause: vi.fn(), resume: vi.fn(), restart: vi.fn(), destroy: vi.fn()});
    const runtimes: ReturnType<typeof createRuntime>[] = [];
    mocks.createRuntime.mockImplementation(() => {
        const runtime = createRuntime();
        runtimes.push(runtime);
        return runtime;
    });
    document.body.innerHTML = '<error-404-game accent-color="#123456"></error-404-game>';
    const host = document.querySelector('error-404-game')!;
    expect(customElements.get('error-404-game')).toBeUndefined();
    expect(host.querySelector('canvas')).toBeNull();
    expect(mocks.createRuntime).not.toHaveBeenCalled();

    registerError404Game();
    registerError404Game();
    expect(host).toBeInstanceOf(Error404GameElement);
    const game = host as Error404GameElement;
    const firstCanvas = game.querySelector('canvas')!;
    expect(firstCanvas).toBeInstanceOf(HTMLCanvasElement);
    expect(mocks.createRuntime).toHaveBeenCalledExactlyOnceWith({canvas: firstCanvas, accentColor: '#123456'});
    expect(game.shadowRoot).toBeNull();
    for (const action of ['pause', 'resume', 'restart'] as const) {
        game[action]();
        expect(runtimes[0][action]).toHaveBeenCalledOnce();
    }

    game.setAttribute('accent-color', '#abcdef');
    const secondCanvas = game.querySelector('canvas')!;
    expect(runtimes[0].destroy).toHaveBeenCalledOnce();
    expect(firstCanvas.parentNode).toBeNull();
    expect(game.querySelectorAll('canvas')).toHaveLength(1);
    expect(secondCanvas).not.toBe(firstCanvas);
    expect(mocks.createRuntime).toHaveBeenCalledTimes(2);
    expect(mocks.createRuntime).toHaveBeenLastCalledWith({canvas: secondCanvas, accentColor: '#abcdef'});
    for (const action of ['pause', 'resume', 'restart'] as const) {
        game[action]();
        expect(runtimes[0][action]).toHaveBeenCalledOnce();
        expect(runtimes[1][action]).toHaveBeenCalledOnce();
    }

    game.remove();
    expect(runtimes[1].destroy).toHaveBeenCalledOnce();
    expect(secondCanvas.parentNode).toBeNull();
    expect(game.querySelector('canvas')).toBeNull();
    for (const action of ['pause', 'resume', 'restart'] as const) {
        game[action]();
        expect(runtimes[1][action]).toHaveBeenCalledOnce();
    }
    game.setAttribute('accent-color', '#654321');
    expect(mocks.createRuntime).toHaveBeenCalledTimes(2);

    document.body.appendChild(game);
    const thirdCanvas = game.querySelector('canvas')!;
    expect(mocks.createRuntime).toHaveBeenCalledTimes(3);
    expect(thirdCanvas).not.toBe(secondCanvas);
    expect(mocks.createRuntime).toHaveBeenLastCalledWith({canvas: thirdCanvas, accentColor: '#654321'});
    expect(game.querySelectorAll('canvas')).toHaveLength(1);
    for (const action of ['pause', 'resume', 'restart'] as const) {
        game[action]();
        expect(runtimes[2][action]).toHaveBeenCalledOnce();
        expect(runtimes[1][action]).toHaveBeenCalledOnce();
    }
    game.remove();
    expect(runtimes[2].destroy).toHaveBeenCalledOnce();
    expect(thirdCanvas.parentNode).toBeNull();
});
