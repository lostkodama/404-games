// @vitest-environment jsdom
import {StrictMode, act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {create404Game} from '../public';
import {Error404Game} from './Error404Game';

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
