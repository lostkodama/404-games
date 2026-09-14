import './style.css'

import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d')!; // temporaray !; to avoid error

if (!ctx) {
    throw new Error('2D rendering context not available');
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const GROUND_Y = 320;

const obstacle = {
    x: 430,
    width: 40,
    height: 55,
};


// Note: write specific sprite specs when generating
// Image + frame width and height (consistent ratio) + consistent padding + transparent background + strip or matrix
// source image
const CAT_FRAME_WIDTH = 270;
const CAT_FRAME_HEIGHT = 270;
const CAT_FRAME_COUNT = 8;
const CAT_BOTTOM_PADDING = 8;

// render image
const cat = {
    x: 100,
    width: 60,
    height: 60,
};

const catSpriteSheet = new Image();

let catImageLoaded = false;

catSpriteSheet.onload = () => {
    catImageLoaded = true;
};

let currentCatFrame = 1;

catSpriteSheet.src = '/sprites/cat-run.png';

let previousTime: number | undefined;

// logic, update values
function update(_deltaTime: number) {
    // Blank for now
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

function drawCatFrame(frame: number) {
    const sourceX =
        frame * CAT_FRAME_WIDTH;

    const sourceY = 0;

    const y =
        GROUND_Y - cat.height + CAT_BOTTOM_PADDING;

    ctx.drawImage(
        catSpriteSheet,

        sourceX,
        sourceY,
        CAT_FRAME_WIDTH,
        CAT_FRAME_HEIGHT,

        cat.x,
        y,
        cat.width,
        cat.height
    );
}

// temporary -> <- for debuyg
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        currentCatFrame =
            (currentCatFrame + 1) % CAT_FRAME_COUNT;
    }

    if (event.key === 'ArrowLeft') {
        currentCatFrame =
            (currentCatFrame - 1 + CAT_FRAME_COUNT) %
            CAT_FRAME_COUNT;
    }
});


function setCatFrame(frame: number) {
    if (frame < 0 || frame >= CAT_FRAME_COUNT) {
        return;
    }

    currentCatFrame = frame;
}

setCatFrame(0)

function drawCat() {
    const y = GROUND_Y - cat.height;

    if (!catImageLoaded) {
        ctx.strokeStyle = '#171717';

        ctx.strokeRect(
            cat.x,
            y,
            cat.width,
            cat.height
        );

        return;
    }

    drawCatFrame(currentCatFrame)

    ctx.strokeStyle = 'red';

    ctx.strokeRect(
        cat.x,
        y,
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