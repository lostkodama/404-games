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
const CAT_FRAME_WIDTH = 271.5;
const CAT_FRAME_HEIGHT = 311;
const CAT_FRAME_COUNT = 16;
const CAT_BOTTOM_PADDING = 23;

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GROUND_Y = 320;

const RUN_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];
const JUMP_FRAME = 11;
const FALL_FRAME = 12  ;

const RUN_ANIMATION_FPS = 11;
const RUN_FRAME_DURATION = 1 / RUN_ANIMATION_FPS;

const PLAYER_SCALE = 0.4
const GRAVITY = 1400;
const JUMP_VELOCITY = -520;

const MAX_DELTA_TIME = 0.05;

const WORLD_SPEED = 200; // 200 game pixels / second
const OBSTACLE_RESET_GAP = 150;


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
    y: GROUND_Y - (271.5 * PLAYER_SCALE) + CAT_BOTTOM_PADDING,
    width: 271.5 * PLAYER_SCALE,
    height: 311 * PLAYER_SCALE,

    frame: 0,

    velocityY: 0,
    isGrounded: true,

    animationTime: 0,
    animationFrameIndex: 0,

    state: 'idle' as PlayerState,
};

const PLAYER_GROUND_Y = GROUND_Y - player.height + CAT_BOTTOM_PADDING;
const obstacle = {
    x: 500,
    y: GROUND_Y - 55,

    width: 40,
    height: 55,
};

const groundMarker = {
    x: 300,
    width: 40,
};

const catSpriteSheet = new Image();
let catSpriteLoaded = false;
catSpriteSheet.onload = () => {
    catSpriteLoaded = true;
};
catSpriteSheet.src = '/sprites/cat-run-jump.png';

// input state
const input = {
    jumpPressed: false,
};

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

function handleKeyDown(event: KeyboardEvent) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault(); // Prevents default behaviour such as scroll down

        triggerAction('jump');
    }
}

function handlePointerDown(
    event: PointerEvent
) {
    event.preventDefault();

    triggerAction('jump');
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
    // if (player.isGrounded) {
    //     player.state = 'idle';
    // } else if (player.velocityY < 0) {
    //     player.state = 'jumping';
    // } else {
    //     player.state = 'falling';
    // }
}

function updatePlayerAnimation(
    deltaTime: number
) {
    if (!player.isGrounded) {
        if (player.velocityY < 0) {
            player.frame = JUMP_FRAME; // Less than 0 is UP
        } else {
            player.frame = FALL_FRAME; // More than 0 is DOWN
        }

        return;
    }

    player.animationTime += deltaTime; // elapsed time per frame

    while (
        player.animationTime >=
        RUN_FRAME_DURATION
        ) {
        player.animationTime -=
            RUN_FRAME_DURATION;

        player.animationFrameIndex =
            (
                player.animationFrameIndex + 1
            ) % RUN_FRAMES.length;
    }

    player.frame = RUN_FRAMES[player.animationFrameIndex];
}

function drawBackground() {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawObstacle() {
    ctx.fillStyle = '#555';

    ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
    );
}

function updateObstacle(
    deltaTime: number
) {
    obstacle.x -=
        WORLD_SPEED * deltaTime;

    if (obstacle.x + obstacle.width < 0) { // If obstacle is off screen
        resetObstacle()
    }
}

function resetObstacle() {
    obstacle.x = GAME_WIDTH + OBSTACLE_RESET_GAP;
}

function drawGround() {
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();
}

function drawGroundMarker() {
    ctx.strokeStyle = '#aaa';

    ctx.beginPath();

    ctx.moveTo(
        groundMarker.x,
        GROUND_Y + 10
    );

    ctx.lineTo(
        groundMarker.x +
        groundMarker.width,
        GROUND_Y + 10
    );

    ctx.stroke();
}

function updateGroundMarker(
    deltaTime: number
) {
    groundMarker.x -=
        WORLD_SPEED * deltaTime;

    if (
        groundMarker.x +
        groundMarker.width <
        0
    ) {
        groundMarker.x =
            GAME_WIDTH;
    }
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

function drawPlayer() {
    // Rectangle
    if (!catSpriteLoaded) {
        ctx.strokeStyle = '#171717';

        ctx.strokeRect(
            player.x,
            PLAYER_GROUND_Y,
            player.width,
            player.height
        );

        return;
    }

    drawPlayerFrame(player.frame)
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


// drawing
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(); // background

    drawGround(); // world
    drawGroundMarker();

    drawObstacle(); // game objects
    drawPlayer();

    //drawForeground(); // foreground
}


// logic, update values
function update(deltaTime: number) {
    updatePlayer(deltaTime);
    updatePlayerAnimation(deltaTime);

    updateObstacle(deltaTime);
    resetInput();
}

let previousTime: number | undefined;

function gameLoop(currentTime: number) {
    if (previousTime === undefined) {
        previousTime = currentTime;
    }

    const rawDeltaTime = (currentTime - previousTime) / 1000;
    const deltaTime = Math.min(rawDeltaTime, MAX_DELTA_TIME); // time passed since previous frame

    previousTime = currentTime;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop); // method that tells the browser to perform the methods inside the function
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