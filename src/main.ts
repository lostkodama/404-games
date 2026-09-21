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
const FALL_FRAME = 12;

const RUN_ANIMATION_FPS = 11;
const RUN_FRAME_DURATION = 1 / RUN_ANIMATION_FPS;

const PLAYER_SCALE = 0.4
const GRAVITY = 1300;
const JUMP_VELOCITY = -560;

const MAX_DELTA_TIME = 0.05;

const INITIAL_WORLD_SPEED = 180;
const MAX_WORLD_SPEED = 500;
let difficultyLevel = 0;
const SPEED_INCREASE_PER_LEVEL = 20;

let worldSpeed = INITIAL_WORLD_SPEED;


const OBSTACLE_SPAWN_X =
    GAME_WIDTH + 80;

let collisionDetected = false;

const canvas = document.querySelector<HTMLCanvasElement>('#game')!; // temporary !; to avoid warning
if (!canvas) {
    throw new Error('Game canvas not found');
}

const ctx = canvas.getContext('2d')!; // temporary !; to avoid warning
if (!ctx) {
    throw new Error('2D rendering context not available');
}

type GameState =
    | 'ready' // TODO: start screen
    | 'running'
    | 'gameOver';

let gameState: GameState = 'running';

// Player
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

const PLAYER_HITBOXES = {
    grounded: {
        offsetX: 10,
        offsetY: player.height - 73 - CAT_BOTTOM_PADDING,
        width: 91,
        height: 73,
    },

    airborne: {
        offsetX: 20,
        offsetY: player.height - 80 - CAT_BOTTOM_PADDING,
        width: 80,
        height: 35,
    },
};

const catSpriteSheet = new Image();
let catSpriteLoaded = false;
catSpriteSheet.onload = () => {
    catSpriteLoaded = true;
};
catSpriteSheet.src = '/sprites/cat-run-jump.png';

// Obstacles
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 55;
const INITIAL_SPAWN_INTERVAL = 2;
const MIN_SPAWN_INTERVAL = 1.3;

let obstacleSpawnTimer = 0;
const SPAWN_INTERVAL_REDUCTION = 0.1;

let obstacleSpawnInterval = INITIAL_SPAWN_INTERVAL

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;

    passed: boolean;
};

let obstacles: Obstacle[] = [];

const groundMarker = {
    x: 300,
    width: 40,
};

// Input state
const input = {
    jumpPressed: false,
    restartPressed: false,
};

// Obstacles
function createObstacle(): Obstacle {
    return {
        x: OBSTACLE_SPAWN_X,
        y: GROUND_Y - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        passed: false
    };
}
let score = 0; // score by distance
const SCORE_SCALE = 0.05
let distance = 0

function updateScore(deltaTime: number) {
    distance += worldSpeed * deltaTime
    score = Math.floor(
        distance * SCORE_SCALE
    );
}

function drawScore() {
    ctx.save();

    ctx.fillStyle = '#171717';
    ctx.font = '20px monospace';
    ctx.textAlign = 'right';

    ctx.fillText(
        score.toString(),
        GAME_WIDTH - 20,
        30
    );

    ctx.restore();
}

function updateDifficulty() {
    difficultyLevel =
        Math.floor(score / 100);

    worldSpeed =
        INITIAL_WORLD_SPEED +
        difficultyLevel *
        SPEED_INCREASE_PER_LEVEL;

    worldSpeed =
        Math.min(
            worldSpeed,
            MAX_WORLD_SPEED
        );

    obstacleSpawnInterval =
        INITIAL_SPAWN_INTERVAL -
        difficultyLevel *
        SPAWN_INTERVAL_REDUCTION;

    obstacleSpawnInterval =
        Math.max(
            obstacleSpawnInterval,
            MIN_SPAWN_INTERVAL
        );
}

function spawnObstacle() {
    obstacles.push(
        createObstacle()
    );
}

function updateObstacleSpawning(
    deltaTime: number
) {
    obstacleSpawnTimer += deltaTime;

    if (obstacleSpawnTimer >= obstacleSpawnInterval) {
        obstacleSpawnTimer -= obstacleSpawnInterval;

        spawnObstacle();
    }
}

// Input methods
function triggerAction(action: GameAction) {
    switch (action) {
        case 'jump':
            input.jumpPressed = true;
            break;
        case 'restart':
            input.restartPressed = true;
            break;
        case 'pause':
            break;
    }
}

function resetInput() {
    input.jumpPressed = false;
    input.restartPressed = false;
}

function handleKeyDown(
    event: KeyboardEvent
) {
    if (event.repeat) {
        return;
    }

    if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
    ) {
        event.preventDefault();

        if (gameState === 'gameOver') {
            triggerAction('restart');
            return;
        }

        triggerAction('jump');
    }
}

function handlePointerDown(
    event: PointerEvent
) {
    event.preventDefault();

    if (gameState === 'gameOver') {
        triggerAction('restart');
        return;
    }

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
    if (player.isGrounded) {
        player.state = 'idle';
    } else if (player.velocityY < 0) {
        player.state = 'jumping';
    } else {
        player.state = 'falling';
    }
}

// Bounds
function getPlayerBounds(): Rect {
    const hitbox = player.isGrounded
        ? PLAYER_HITBOXES.grounded
        : PLAYER_HITBOXES.airborne;

    return {
        x: player.x + hitbox.offsetX,
        y: player.y + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height,
    };
}

function getObstacleBounds(
    obstacle: Obstacle
): Rect {
    return {
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
    };
}

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function rectanglesOverlap(
    a: Rect,
    b: Rect
) {
    return (
        a.x + a.width > b.x &&
        a.x < b.x + b.width &&
        a.y + a.height > b.y &&
        a.y < b.y + b.height
    );
}

function gameOver() {
    gameState = 'gameOver';
}

function isPlayerCollidingWithObstacle() {
    const playerBounds =
        getPlayerBounds();

    for (const obstacle of obstacles) {
        const obstacleBounds =
            getObstacleBounds(obstacle);

        if (
            rectanglesOverlap(
                playerBounds,
                obstacleBounds
            )
        ) {
            return true
        }
    }
    return false
}

function updateCollision() {
    if (isPlayerCollidingWithObstacle()) {
        gameOver();
    }
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

function drawObstacles() {
    ctx.fillStyle = '#555';

    for (const obstacle of obstacles) {
        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    }
}

function updateObstacles(
    deltaTime: number
) {
    for (const obstacle of obstacles) {
        obstacle.x -=
            worldSpeed * deltaTime;
    }

    // remove obstacles out of screen
    obstacles = obstacles.filter(
        (obstacle) =>
            obstacle.x + obstacle.width >= 0
    );
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

// for understanding the visual
function updateGroundMarker(
    deltaTime: number
) {
    groundMarker.x -=
        worldSpeed * deltaTime;

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

function drawGameOver() {
    if (gameState !== 'gameOver') {
        return;
    }

    ctx.fillStyle =
        'rgba(255, 255, 255, 0.75)';

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    ctx.fillStyle = '#171717';
    ctx.textAlign = 'center';

    ctx.font =
        'bold 32px sans-serif';

    ctx.fillText(
        'Game Over',
        GAME_WIDTH / 2,
        170
    );

    ctx.font =
        '16px sans-serif';

    ctx.fillText(
        'Press Space or tap to restart',
        GAME_WIDTH / 2,
        210
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

    drawGround(); // worlds
    drawGroundMarker();

    drawObstacles(); // game objects
    drawPlayer();

    drawDebugBounds();
    drawDebugDifficulty();

    drawForeground(); // foreground
    drawScore();

    drawGameOver();
}

function drawDebugDifficulty() {
    ctx.save();

    ctx.fillStyle = '#171717';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    ctx.fillText(
        `Speed: ${worldSpeed}`,
        20,
        55
    );

    ctx.fillText(
        `Level: ${difficultyLevel}`,
        20,
        72
    );

    ctx.fillText(
        `Spawn: ${obstacleSpawnInterval.toFixed(2)}`,
        20,
        89
    );

    ctx.restore();
}

function drawDebugBounds() {
    const playerBounds =
        getPlayerBounds();

    for (const obstacle of obstacles) {
        const bounds =
            getObstacleBounds(obstacle);

        ctx.strokeRect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );
    }

    ctx.strokeStyle = 'red';

    ctx.strokeRect(
        playerBounds.x,
        playerBounds.y,
        playerBounds.width,
        playerBounds.height
    );

    ctx.strokeStyle = 'blue';
}

function resetGame() {
    distance = 0;
    worldSpeed = INITIAL_WORLD_SPEED; // will be reset even without
    obstacleSpawnInterval = INITIAL_SPAWN_INTERVAL;

    resetPlayer();
    resetObstacles();

    gameState = 'running';
}

function resetPlayer() {
    player.x = 100;
    player.y = PLAYER_GROUND_Y;

    player.velocityY = 0;
    player.isGrounded = true;

    player.frame = RUN_FRAMES[0];

    player.animationTime = 0;
    player.animationFrameIndex = 0;

    player.state = 'idle';
}

function resetObstacles() {
    obstacles = [];
    obstacleSpawnTimer = 0;

    spawnObstacle();
}

// logic, update values
function update(deltaTime: number) {
    if (gameState === 'gameOver') {
        if (input.restartPressed) {
            resetGame();
        }

        resetInput();
        return;
    }

    updatePlayer(deltaTime);
    updatePlayerAnimation(deltaTime);

    updateObstacleSpawning(deltaTime);
    updateObstacles(deltaTime);

    updateGroundMarker(deltaTime)
    
    updateCollision()

    if (gameState === 'running') {
        updateScore(deltaTime);
        updateDifficulty();
    }

    // Mind the order. Should be after updating player and obstacle position.
    if (collisionDetected) {
        console.log('Collision!');
    }

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