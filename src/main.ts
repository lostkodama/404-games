import './style.css';
import {create404Game} from "./public/createGame.ts";

// Canvas-only fonts need an explicit load; keep the game usable if loading fails.
void document.fonts.load('700 32px "Space Grotesk"').catch(() => {
});

const container = document.querySelector<HTMLElement>('#game');
if (!container) {
    throw new Error('Game container not found');
}

// const sounds = createSounds();
// const stopGame = startGame(canvas, ctx, sounds.play, sounds.unlock);

const game = create404Game({container: container, accentColor: '#00448c'})

// const pause = document.getElementById('pause') as HTMLButtonElement;
// const resume = document.getElementById('resume') as HTMLButtonElement;
// const restart = document.getElementById('restart') as HTMLButtonElement;
// const destroy = document.getElementById('destroy') as HTMLButtonElement;

// const handlePause = () => game.pause();
// const handleResume = () => game.resume();
// const handleRestart = () => game.restart();
// const handleDestroy = () => game.destroy();

// pause?.addEventListener('click', handlePause);
// resume?.addEventListener('click', handleResume);
// restart?.addEventListener('click', handleRestart);
// destroy?.addEventListener('click', handleDestroy);

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        // pause?.removeEventListener('click', handlePause);
        // resume?.removeEventListener('click', handleResume);
        // restart?.removeEventListener('click', handleRestart);
        // destroy?.removeEventListener('click', handleDestroy);

        game.destroy();
    });
}