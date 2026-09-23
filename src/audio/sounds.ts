import startUrl from './assets/start.wav?url';
import jumpUrl from './assets/jump.wav?url';
import gameOverUrl from './assets/game-over.wav?url';
import levelUpUrl from './assets/level-up.wav?url';
import type { GameEvent } from '../game/Game';

const EFFECTS: Record<GameEvent, { src: string; volume: number }> = {
    start: { src: startUrl, volume: 0.3 },
    jump: { src: jumpUrl, volume: 0.25 },
    gameOver: { src: gameOverUrl, volume: 0.3 },
    levelUp: { src: levelUpUrl, volume: 0.3 },
};

export function createSounds() {
    let muted = false;
    let disposed = false;
    const effects = Object.fromEntries(
        Object.entries(EFFECTS).map(([name, config]) => {
            const audio = new Audio(config.src);
            audio.preload = 'auto';
            audio.volume = config.volume;
            return [name, { audio, ready: false, unlocking: undefined }];
        }),
    ) as Record<GameEvent, {
        audio: HTMLAudioElement;
        ready: boolean;
        unlocking: Promise<void> | undefined;
    }>;

    // Call synchronously from a user gesture. Prime each reusable element
    // silently, since some browsers grant playback permission per element.
    function unlock() {
        if (disposed) return;
        for (const effect of Object.values(effects)) {
            if (effect.ready || effect.unlocking) continue;
            effect.audio.muted = true;
            try {
                effect.unlocking = effect.audio.play().then(() => {
                    effect.audio.pause();
                    effect.audio.currentTime = 0;
                    effect.ready = true;
                }).catch(() => {
                    // A later user gesture can retry denied/failed playback.
                }).finally(() => {
                    effect.audio.muted = muted;
                    effect.unlocking = undefined;
                });
            } catch {
                effect.audio.muted = muted;
            }
        }
    }

    async function play(name: GameEvent) {
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
        muted = value;
        for (const effect of Object.values(effects)) {
            effect.audio.muted = value || Boolean(effect.unlocking);
            if (value) effect.audio.pause();
        }
    }

    function dispose() {
        disposed = true;
        for (const { audio } of Object.values(effects)) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }
    }

    return { play, unlock, setMuted, dispose };
}
