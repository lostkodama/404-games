// @vitest-environment jsdom
import {StrictMode, act, createRef, useLayoutEffect} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {create404Game} from '../public';
import {Error404Game, type Error404GameHandle, type Error404GameProps} from './index';

vi.mock('../public', () => ({create404Game: vi.fn()}));

function createController() {
    return {pause: vi.fn(), resume: vi.fn(), restart: vi.fn(), destroy: vi.fn()};
}

let host: HTMLDivElement;
let root: Root | undefined;
let controllers: ReturnType<typeof createController>[];
let active: Set<ReturnType<typeof createController>>;

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    controllers = [];
    active = new Set();
    vi.mocked(create404Game).mockReset();
    vi.mocked(create404Game).mockImplementation(({container}) => {
        expect(container.isConnected).toBe(true);
        expect(active.size).toBe(0);
        const controller = createController();
        controller.destroy.mockImplementation(() => { active.delete(controller); });
        controllers.push(controller);
        active.add(controller);
        return controller;
    });
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
});

async function unmount() {
    await act(async () => root?.unmount());
    root = undefined;
}

afterEach(async () => {
    await unmount();
    host.remove();
    vi.unstubAllGlobals();
});

async function render(accentColor?: string) {
    await act(async () => root!.render(<Error404Game accentColor={accentColor} />));
}

describe('Error404Game React lifecycle', () => {
    it('exposes only controls through the React entry and always targets the active game', async () => {
        const ref = createRef<Error404GameHandle>();
        expect(ref.current).toBeNull();
        await act(async () => root!.render(<Error404Game ref={ref} accentColor="#123456" />));
        const handle = ref.current!;
        expect(Object.keys(handle).sort()).toEqual(['pause', 'restart', 'resume']);
        expect('destroy' in handle).toBe(false);
        for (const action of ['pause', 'resume', 'restart'] as const) {
            handle[action]();
            expect(controllers[0][action]).toHaveBeenCalledOnce();
        }

        await act(async () => root!.render(<Error404Game ref={ref} accentColor="#abcdef" />));
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        for (const action of ['pause', 'resume', 'restart'] as const) {
            ref.current![action]();
            expect(controllers[0][action]).toHaveBeenCalledOnce();
            expect(controllers[1][action]).toHaveBeenCalledOnce();
        }

        await unmount();
        expect(ref.current).toBeNull();
        expect(() => {
            handle.pause();
            handle.resume();
            handle.restart();
        }).not.toThrow();
        for (const action of ['pause', 'resume', 'restart'] as const) {
            expect(controllers[0][action]).toHaveBeenCalledOnce();
            expect(controllers[1][action]).toHaveBeenCalledOnce();
        }
    });

    it('safely ignores controls before the creation effect runs', async () => {
        const ref = createRef<Error404GameHandle>();
        const beforeCreation = vi.fn();
        function Consumer() {
            useLayoutEffect(() => {
                expect(create404Game).not.toHaveBeenCalled();
                expect(ref.current).not.toBeNull();
                ref.current!.pause();
                ref.current!.resume();
                ref.current!.restart();
                beforeCreation();
            }, []);
            return <Error404Game ref={ref} />;
        }
        await act(async () => root!.render(<Consumer />));
        expect(beforeCreation).toHaveBeenCalledOnce();
        for (const action of ['pause', 'resume', 'restart'] as const) {
            expect(controllers[0][action]).not.toHaveBeenCalled();
        }
    });

    it('applies host styling without passing it to the factory or recreating the game', async () => {
        const props: Error404GameProps = {className: 'game-host', style: {width: '640px', marginTop: 8}};
        await act(async () => root!.render(<Error404Game {...props} />));
        const container = host.firstElementChild as HTMLDivElement;
        expect(container.className).toBe('game-host');
        expect(container.style.width).toBe('640px');
        expect(container.style.marginTop).toBe('8px');
        expect(create404Game).toHaveBeenCalledExactlyOnceWith({container});

        await act(async () => root!.render(<Error404Game className="updated" style={{width: '100%'}} />));
        expect(host.firstElementChild).toBe(container);
        expect(container.className).toBe('updated');
        expect(container.style.width).toBe('100%');
        expect(container.style.marginTop).toBe('');
        expect(create404Game).toHaveBeenCalledOnce();
        expect(controllers[0].destroy).not.toHaveBeenCalled();
    });

    it('does not retain a destroyed controller through a handle when replacement creation fails', async () => {
        const ref = createRef<Error404GameHandle>();
        await act(async () => root!.render(<Error404Game ref={ref} accentColor="#123456" />));
        const handle = ref.current!;
        const error = new Error('replacement failed');
        vi.mocked(create404Game).mockImplementationOnce(() => { throw error; });
        await expect(act(async () => root!.render(<Error404Game ref={ref} accentColor="#abcdef" />))).rejects.toBe(error);
        expect(ref.current).toBeNull();
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        handle.pause();
        handle.resume();
        handle.restart();
        for (const action of ['pause', 'resume', 'restart'] as const) {
            expect(controllers[0][action]).not.toHaveBeenCalled();
        }
    });

    it('keeps the handle current across Strict Mode cleanup and recreation', async () => {
        const ref = createRef<Error404GameHandle>();
        await act(async () => root!.render(<StrictMode><Error404Game ref={ref} /></StrictMode>));
        expect(active.size).toBe(1);
        const current = controllers.at(-1)!;
        ref.current!.pause();
        expect(current.pause).toHaveBeenCalledOnce();
        for (const controller of controllers.slice(0, -1)) {
            expect(controller.pause).not.toHaveBeenCalled();
            expect(controller.destroy).toHaveBeenCalledOnce();
        }
        const handle = ref.current!;
        await unmount();
        expect(ref.current).toBeNull();
        handle.pause();
        expect(current.pause).toHaveBeenCalledOnce();
        expect(active.size).toBe(0);
    });

    it('creates one game using its internal div and leaves defaults to the factory', async () => {
        await render();
        const container = host.firstElementChild;
        expect(container).toBeInstanceOf(HTMLDivElement);
        expect(host.children).toHaveLength(1);
        expect(create404Game).toHaveBeenCalledExactlyOnceWith({container});
        expect(active.size).toBe(1);

        await render();
        expect(create404Game).toHaveBeenCalledOnce();
        await unmount();
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        expect(active.size).toBe(0);
    });

    it('forwards accent changes and cleans up before replacement, including removal', async () => {
        await render('#123456');
        const container = host.firstElementChild;
        expect(create404Game).toHaveBeenLastCalledWith({container, accentColor: '#123456'});

        await render('#abcdef');
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        expect(controllers[1]).not.toBe(controllers[0]);
        expect(host.firstElementChild).toBe(container);
        expect(create404Game).toHaveBeenLastCalledWith({container, accentColor: '#abcdef'});
        expect(active.size).toBe(1);

        await render('#abcdef');
        expect(create404Game).toHaveBeenCalledTimes(2);
        await render();
        expect(controllers[1].destroy).toHaveBeenCalledOnce();
        expect(create404Game).toHaveBeenCalledTimes(3);
        expect(create404Game).toHaveBeenLastCalledWith({container});
        await unmount();
        expect(controllers[2].destroy).toHaveBeenCalledOnce();
        expect(active.size).toBe(0);
    });

    it('propagates initialization failure and can mount successfully afterward', async () => {
        const error = new Error('initialization failed');
        vi.mocked(create404Game).mockImplementationOnce(() => { throw error; });
        await expect(render()).rejects.toBe(error);
        expect(active.size).toBe(0);
        expect(controllers).toHaveLength(0);

        await render('#123456');
        expect(active.size).toBe(1);
        await unmount();
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        expect(active.size).toBe(0);
    });

    it('cleans up the previous game before a failing replacement and does not retain it', async () => {
        await render('#123456');
        const error = new Error('replacement failed');
        vi.mocked(create404Game).mockImplementationOnce(() => {
            expect(active.size).toBe(0);
            throw error;
        });

        await expect(render('#abcdef')).rejects.toBe(error);
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        expect(active.size).toBe(0);
        await render('#654321');
        expect(active.size).toBe(1);
        expect(controllers[1]).not.toBe(controllers[0]);
        await unmount();
        expect(controllers[0].destroy).toHaveBeenCalledOnce();
        expect(controllers[1].destroy).toHaveBeenCalledOnce();
    });

    it('passes blank values unchanged to real factory validation', async () => {
        const factory = await vi.importActual<typeof import('../public')>('../public');
        vi.mocked(create404Game).mockImplementationOnce(factory.create404Game);
        await expect(render('')).rejects.toThrow('accentColor must be a non-empty string');
        expect(create404Game).toHaveBeenCalledWith({container: expect.any(HTMLDivElement), accentColor: ''});
        expect(active.size).toBe(0);
    });

    it('keeps one active game through Strict Mode setup/cleanup cycles and updates', async () => {
        await act(async () => root!.render(<StrictMode><Error404Game accentColor="#123456" /></StrictMode>));
        expect(controllers.length).toBeGreaterThan(1);
        expect(active.size).toBe(1);
        const previous = controllers.at(-1)!;

        await act(async () => root!.render(<StrictMode><Error404Game accentColor="#abcdef" /></StrictMode>));
        expect(previous.destroy).toHaveBeenCalledOnce();
        expect(active.size).toBe(1);
        await unmount();
        expect(active.size).toBe(0);
        for (const controller of controllers) expect(controller.destroy).toHaveBeenCalledOnce();
    });
});
