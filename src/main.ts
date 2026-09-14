import './style.css'

import './style.css';

type GameAction =
    | 'jump'
    | 'pause'
    | 'restart';

type PlayerState =
    | 'idle'
    | 'jumping'
    | 'falling';

// Note: write specific sprite specs when generating
// Image + frame width and height (consistent ratio) + consistent padding + transparent background + strip or matrix
// source image
const CAT_FRAME_WIDTH = 270;
const CAT_FRAME_HEIGHT = 270;
const CAT_FRAME_COUNT = 8;
const CAT_BOTTOM_PADDING = 8;

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GROUND_Y = 320;



const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d')!; // temporaray !; to avoid error
if (!ctx) {
    throw new Error('2D rendering context not available');
}

const player = {
    x: 100,
    y: GROUND_Y - 60 + CAT_BOTTOM_PADDING,
    width: 60,
    height: 60,

    frame: 0,
    state: 'idle' as PlayerState,

    velocityY: 0,
    isGrounded: true,
};
const GRAVITY = 1400;
const JUMP_VELOCITY = -520;
const PLAYER_GROUND_Y = GROUND_Y - player.height + CAT_BOTTOM_PADDING;

const obstacle = {
    x: 430,
    width: 40,
    height: 55,
};

// input state
const input = {
    jumpPressed: false,
};

const catSpriteSheet = new Image();

let catImageLoaded = false;

catSpriteSheet.onload = () => {
    catImageLoaded = true;
};

catSpriteSheet.src = '/sprites/cat-run.png';

let previousTime: number | undefined;

function handleKeyDown(event: KeyboardEvent) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault();

        triggerAction('jump');
    }
}

function handlePointerDown(
    event: PointerEvent
) {
    event.preventDefault();

    triggerAction('jump');
}

function triggerAction(action: GameAction) {
    switch (action) {
        case 'jump':
            input.jumpPressed = true;
            break;
    }
}

function resetInput() {
    input.jumpPressed = false;
}

function setCatFrame(frame: number) {
    if (frame < 0 || frame >= CAT_FRAME_COUNT) {
        return;
    }

    player.frame = frame;
}

function updatePlayer(deltaTime: number) {
    // TODO: uncomment for debugging
    // console.log({
    //     y: player.y,
    //     velocityY: player.velocityY,
    //     grounded: player.isGrounded,
    //     state: player.state,
    // });

    if (input.jumpPressed && player.isGrounded) {
        player.velocityY = JUMP_VELOCITY;
        player.isGrounded = false;
        console.log('Player jump action received');
    }

    player.velocityY += GRAVITY * deltaTime; // change of velocity because of acceleration (gravity x time)
    player.y += player.velocityY * deltaTime; // change of position because of velocity (velocity x time)

    // Stop at landing
    if (player.y >= PLAYER_GROUND_Y) {
        player.y = PLAYER_GROUND_Y;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // update states
    if (player.isGrounded) {
        player.state = 'idle';
    } else if (player.velocityY < 0) {
        player.state = 'jumping';
    } else {
        player.state = 'falling';
    }
}

// logic, update values
function update(deltaTime: number) {
    updatePlayer(deltaTime);

    resetInput();
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

function drawPlayerFrame(frame: number) {
    const sourceX =
        frame * CAT_FRAME_WIDTH;

    const sourceY = 0;

    ctx.drawImage(
        catSpriteSheet,

        sourceX,
        sourceY,
        CAT_FRAME_WIDTH,
        CAT_FRAME_HEIGHT,

        player.x,
        player.y,
        player.width,
        player.height
    );
}

function drawPlayer() {
    const y = GROUND_Y - player.height;

    if (!catImageLoaded) {
        ctx.strokeStyle = '#171717';

        ctx.strokeRect(
            player.x,
            y,
            player.width,
            player.height
        );

        return;
    }

    drawPlayerFrame(player.frame)
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

// drawing
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(); // background

    drawGround(); // world

    drawObstacle(); // game objects
    drawPlayer();

    drawForeground(); // foreground
}

const MAX_DELTA_TIME = 0.05;
function gameLoop(currentTime: number) {
    if (previousTime === undefined) {
        previousTime = currentTime;
    }

    const rawDeltaTime = (currentTime - previousTime) / 1000;
    const deltaTime =
        Math.min(rawDeltaTime, MAX_DELTA_TIME);

    previousTime = currentTime;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}
// temporary -> <- for debuyg
window.addEventListener('keydown', handleKeyDown);

// handle touch
canvas.addEventListener(
    'pointerdown',       // prefer over touchstart bec it handles mouse, touch, stylus
    handlePointerDown
);
setCatFrame(0)


requestAnimationFrame(gameLoop);