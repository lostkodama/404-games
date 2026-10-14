import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createSounds} from './sounds';

let audios: AudioMock[];

class AudioMock {
    src: string;
    preload = '';
    volume = 1;
    muted = false;
    currentTime = 0;
    pause = vi.fn();
    removeAttribute = vi.fn();
    load = vi.fn();
    play = vi.fn(() => Promise.resolve());

    constructor(src: string) {
        this.src = src;
        audios.push(this);
    }
}

beforeEach(() => {
    audios = [];
    vi.stubGlobal('Audio', AudioMock);
});

afterEach(() => vi.unstubAllGlobals());

function expectAllCleanedOnce() {
    expect(audios).toHaveLength(4);
    for (const audio of audios) {
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(audio.removeAttribute).toHaveBeenCalledExactlyOnceWith('src');
        expect(audio.load).toHaveBeenCalledOnce();
    }
}

describe('sound resource cleanup', () => {
    it.each(['construction', 'configuration'] as const)(
        'rolls back every acquired audio element when later %s fails', (failureStage) => {
            const initializationError = new Error('audio initialization failed');
            vi.stubGlobal('Audio', class extends AudioMock {
                constructor(src: string) {
                    if (failureStage === 'construction' && audios.length === 2) {
                        throw initializationError;
                    }
                    super(src);
                    if (audios.length === 1) {
                        this.pause.mockImplementationOnce(() => { throw new Error('rollback pause failed'); });
                        this.removeAttribute.mockImplementationOnce(() => { throw new Error('rollback source removal failed'); });
                    }
                    if (failureStage === 'configuration' && audios.length === 3) {
                        Object.defineProperty(this, 'volume', {
                            set() { throw initializationError; },
                        });
                    }
                }
            });

            let thrown: unknown;
            try {
                createSounds();
            } catch (error) {
                thrown = error;
            }

            expect(thrown).toBe(initializationError);
            expect(audios).toHaveLength(failureStage === 'construction' ? 2 : 3);
            for (const audio of audios) {
                expect(audio.pause).toHaveBeenCalledOnce();
                expect(audio.removeAttribute).toHaveBeenCalledExactlyOnceWith('src');
                expect(audio.load).toHaveBeenCalledOnce();
            }
        },
    );

    it('cleans every owned audio element once and ignores calls after disposal', async () => {
        const sounds = createSounds();
        sounds.dispose();
        sounds.dispose();
        sounds.unlock();
        sounds.setMuted(true);
        await sounds.play('jump');

        expectAllCleanedOnce();
        for (const audio of audios) {
            expect(audio.play).not.toHaveBeenCalled();
            expect(audio.muted).toBe(false);
        }
    });

    it.each([new Error('first failure'), null, undefined, 0, false, ''])(
        'continues every cleanup operation and preserves first thrown value %j', (firstError) => {
            const sounds = createSounds();
            audios[0].pause.mockImplementationOnce(() => { throw firstError; });
            audios[0].removeAttribute.mockImplementationOnce(() => { throw new Error('later failure'); });
            audios[1].load.mockImplementationOnce(() => { throw new Error('another failure'); });

            let didThrow = false;
            let thrown: unknown;
            try {
                sounds.dispose();
            } catch (error) {
                didThrow = true;
                thrown = error;
            }

            expect(didThrow).toBe(true);
            expect(thrown).toBe(firstError);
            expectAllCleanedOnce();
            expect(() => sounds.dispose()).not.toThrow();
            expectAllCleanedOnce();
        },
    );

    it('does not modify disposed audio when a pending unlock completes', async () => {
        const sounds = createSounds();
        let resolveUnlock!: () => void;
        const unlockPromise = new Promise<void>((resolve) => { resolveUnlock = resolve; });
        for (const audio of audios) audio.play.mockReturnValue(unlockPromise);

        sounds.unlock();
        const pendingPlay = sounds.play('jump');
        sounds.dispose();
        resolveUnlock();
        await pendingPlay;

        expectAllCleanedOnce();
        for (const audio of audios) {
            expect(audio.play).toHaveBeenCalledOnce();
            expect(audio.muted).toBe(true);
        }
    });
});
