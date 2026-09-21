import './style.css';
import { startGame } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
    throw new Error('2D rendering context not available');
}

startGame(canvas, ctx);
