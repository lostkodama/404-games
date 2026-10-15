import './style.css';
import {registerError404Game, type Error404GameElement} from './web-component';

// Canvas-only fonts need an explicit load; keep the game usable if loading fails.
void document.fonts.load('700 32px "Space Grotesk"').catch(() => {
});

const demo = document.querySelector<HTMLElement>('#demo');
if (!demo) throw new Error('Demo container not found');

registerError404Game();

// Restore the host if a previous HMR disposal removed it.
const game = demo.querySelector<Error404GameElement>('error-404-game')
    ?? document.createElement('error-404-game') as Error404GameElement;
if (!game.isConnected) {
    game.setAttribute('accent-color', '#414141');
    demo.prepend(game);
}

const unbindControls: Array<() => void> = [];
for (const action of ['pause', 'resume', 'restart'] as const) {
    const button = demo.querySelector<HTMLButtonElement>(`#${action}`);
    const handleClick = () => game[action]();
    button?.addEventListener('click', handleClick);
    unbindControls.push(() => button?.removeEventListener('click', handleClick));
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        for (const unbind of unbindControls) unbind();
        game.remove();
    });
}
