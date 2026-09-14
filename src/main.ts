import './style.css'

import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
    throw new Error('2D rendering context not available');
}

let playerX = 0;
let previousTime: number | undefined;

// logic, update values
function update(deltaTime: number) {
    playerX += 100 * deltaTime; // 100 pixels per second

    if(playerX > canvas.width) {
        playerX = -40;
    }
}

// drawing
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#171717';
    ctx.fillRect(playerX, 180, 40, 40);
}

function gameLoop(currentTime: number) {
    if (previousTime === undefined) {
        previousTime = currentTime;
    }

    const deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);