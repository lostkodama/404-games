// @vitest-environment jsdom
import {StrictMode, act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect, it, vi} from 'vitest';
import * as ReactEntry from '../react';
import {ReactDemo} from './ReactDemo';

const mocks = vi.hoisted(() => ({createRuntime: vi.fn()}));
vi.mock('../browser/createBrowserRuntime', () => ({
    createBrowserRuntime: mocks.createRuntime,
}));

it('exports only the React component at runtime', () => {
    expect(Object.keys(ReactEntry)).toEqual(['Error404Game']);
    expect(customElements.get('error-404-game')).toBeUndefined();
    expect(mocks.createRuntime).not.toHaveBeenCalled();
});

it('supports Strict Mode consumer controls, state-driven accent replacement, and unmount cleanup through the real factory', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const makeRuntime = () => ({pause: vi.fn(), resume: vi.fn(), restart: vi.fn(), destroy: vi.fn()});
    const runtimes: ReturnType<typeof makeRuntime>[] = [];
    const active = new Set<ReturnType<typeof makeRuntime>>();
    mocks.createRuntime.mockImplementation(() => {
        expect(active.size).toBe(0);
        const runtime = makeRuntime();
        runtime.destroy.mockImplementation(() => { active.delete(runtime); });
        runtimes.push(runtime);
        active.add(runtime);
        return runtime;
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
        await act(async () => root.render(<StrictMode><ReactDemo /></StrictMode>));
        expect(runtimes.length).toBeGreaterThan(1);
        expect(active.size).toBe(1);
        const container = host.querySelector('.react-game')!;
        const firstCanvas = container.querySelector('canvas')!;
        expect(firstCanvas).toBeInstanceOf(HTMLCanvasElement);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
        expect(mocks.createRuntime).toHaveBeenLastCalledWith({canvas: firstCanvas, accentColor: '#414141'});
        expect(host.querySelector('error-404-game')).toBeNull();
        const firstRuntime = runtimes.at(-1)!;
        const initialCount = runtimes.length;
        const buttons = Array.from(host.querySelectorAll('button'));
        const click = async (label: string) => {
            const button = buttons.find((button) => button.textContent === label)!;
            await act(async () => button.click());
        };
        await click('Pause');
        await click('Resume');
        await click('Restart');
        for (const method of ['pause', 'resume', 'restart'] as const) {
            expect(firstRuntime[method]).toHaveBeenCalledOnce();
        }
        expect(mocks.createRuntime).toHaveBeenCalledTimes(initialCount);

        const previousCount = runtimes.length;
        const select = host.querySelector('select')!;
        await act(async () => {
            select.value = '#00448c';
            select.dispatchEvent(new Event('change', {bubbles: true}));
        });
        const secondCanvas = container.querySelector('canvas')!;
        expect(firstRuntime.destroy).toHaveBeenCalledOnce();
        expect(firstCanvas.parentNode).toBeNull();
        expect(secondCanvas).not.toBe(firstCanvas);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
        expect(mocks.createRuntime).toHaveBeenCalledTimes(previousCount + 1);
        expect(mocks.createRuntime).toHaveBeenLastCalledWith({canvas: secondCanvas, accentColor: '#00448c'});
        expect(select.value).toBe('#00448c');
        expect(active.size).toBe(1);

        const secondRuntime = runtimes.at(-1)!;
        await click('Pause');
        await click('Resume');
        await click('Restart');
        for (const method of ['pause', 'resume', 'restart'] as const) {
            expect(firstRuntime[method]).toHaveBeenCalledOnce();
            expect(secondRuntime[method]).toHaveBeenCalledOnce();
        }
        await act(async () => root.unmount());
        expect(host.children).toHaveLength(0);
        expect(secondCanvas.parentNode).toBeNull();
        expect(active.size).toBe(0);
        for (const runtime of runtimes) expect(runtime.destroy).toHaveBeenCalledOnce();
    } finally {
        await act(async () => root.unmount());
        host.remove();
        vi.unstubAllGlobals();
    }
});
