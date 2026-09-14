import './style.css'

import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d');

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const GROUND_Y = 320;

const obstacle = {
    x: 430,
    width: 40,
    height: 55,
};

const scale = 0.75;

const cat = {
    x: 100,
    width: 73 * scale,
    height: 56 * scale, // TODO: MXN_ mind sprite ratio
};

const catImage = new Image();

let catImageLoaded = false;

catImage.onload = () => {
    catImageLoaded = true;
};

catImage.src = '/sprites/cat-idle.png';

if (!ctx) {
    throw new Error('2D rendering context not available');
}

let playerX = 0;
let previousTime: number | undefined;


// logic, update values
function update(_deltaTime: number) {
}

function drawBackground() {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawGround() {
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();
}

function drawObstacle() {
    const obstacleY = GROUND_Y - obstacle.height;

    ctx.fillStyle = '#555';

    ctx.fillRect(
        obstacle.x,
        obstacleY,
        obstacle.width,
        obstacle.height
    );
}

function drawForeground() {
    ctx.fillStyle = '#d4d4d4';

    ctx.fillRect(
        0,
        GROUND_Y + 20,
        GAME_WIDTH,
        GAME_HEIGHT - GROUND_Y - 20
    );
}

function drawCat() {
    const catY = GROUND_Y - cat.height;

    if (!catImageLoaded) {
        ctx.strokeStyle = '#171717';

        ctx.strokeRect(
            cat.x,
            catY,
            cat.width,
            cat.height
        );

        return;
    }

    ctx.drawImage(
        catImage,
        cat.x,
        catY,
        cat.width,
        cat.height
    );
}

// drawing
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(); // background

    drawGround(); // world

    drawObstacle(); // game objects
    drawCat();

    drawForeground(); // foreground
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