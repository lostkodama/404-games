import startUrl from './assets/start.wav?url&no-inline';
import jumpUrl from './assets/jump.wav?url&no-inline';
import gameOverUrl from './assets/game-over.wav?url&no-inline';
import levelUpUrl from './assets/level-up.wav?url&no-inline';
import type {SoundEvent} from "../game/runner/types.ts";

const EFFECTS: Record<SoundEvent, { src: string; volume: number }> = {
    start: { src: startUrl, volume: 0.3 },
    jump: { src: jumpUrl, volume: 0.25 },
    gameOver: { src: gameOverUrl, volume: 0.3 },
    levelUp: { src: levelUpUrl, volume: 0.3 },
};

export function createSounds() {
    let muted = false;
    let disposed = false;
    const ownedAudio: HTMLAudioElement[] = [];
    let effects: Record<SoundEvent, {
        audio: HTMLAudioElement;
        ready: boolean;
        unlocking: Promise<void> | undefined;
    }>;

    try {
        effects = Object.fromEntries(
            Object.entries(EFFECTS).map(([name, config]) => {
                const audio = new Audio(config.src);
                ownedAudio.push(audio);
                audio.preload = 'auto';
                audio.volume = config.volume;
                return [name, { audio, ready: false, unlocking: undefined }];
            }),
        ) as typeof effects;
    } catch (error) {
        try {
            dispose();
        } catch {
            // Preserve the initialization error if rollback also fails.
        }
        throw error;
    }

    // Call synchronously from a user gesture. Prime each reusable element
    // silently, since some browsers grant playback permission per element.
    function unlock() {
        if (disposed) return;
        for (const effect of Object.values(effects)) {
            if (effect.ready || effect.unlocking) continue;
            effect.audio.muted = true;
            try {
                effect.unlocking = effect.audio.play().then(() => {
                    if (disposed) return;
                    effect.audio.pause();
                    effect.audio.currentTime = 0;
                    effect.ready = true;
                }).catch(() => {
                    // A later user gesture can retry denied/failed playback.
                }).finally(() => {
                    if (!disposed) effect.audio.muted = muted;
                    effect.unlocking = undefined;
                });
            } catch {
                effect.audio.muted = muted;
            }
        }
    }

    async function play(name: SoundEvent) {
        if (disposed || muted) return;
        const effect = effects[name];
        try {
            if (effect.unlocking) await effect.unlocking;
            if (disposed || muted || !effect.ready) return;
            effect.audio.currentTime = 0;
            await effect.audio.play();
        } catch {
            // Missing assets and autoplay rejection must never stop gameplay.
        }
    }

    function setMuted(value: boolean) {
        if (disposed) return;
        muted = value;
        for (const effect of Object.values(effects)) {
            effect.audio.muted = value || Boolean(effect.unlocking);
            if (value) effect.audio.pause();
        }
    }

    function dispose() {
        if (disposed) return;
        disposed = true;
        let hasError = false;
        let firstError: unknown;
        for (const audio of ownedAudio) {
            for (const cleanup of [
                () => audio.pause(),
                () => audio.removeAttribute('src'),
                () => audio.load(),
            ]) {
                try {
                    cleanup();
                } catch (error) {
                    if (!hasError) firstError = error;
                    hasError = true;
                }
            }
        }
        if (hasError) throw firstError;
    }

    return { play, unlock, setMuted, dispose };
}
