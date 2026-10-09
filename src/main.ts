import './style.css';

// Canvas-only fonts need an explicit load; keep the game usable if loading fails.
void document.fonts.load('700 32px "Space Grotesk"').catch(() => {});

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
    throw new Error('2D rendering context not available');
}

// const sounds = createSounds();
// const stopGame = startGame(canvas, ctx, sounds.play, sounds.unlock);

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        // stopGame();
        // sounds.dispose();
    });
}
