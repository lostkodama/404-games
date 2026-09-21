import { GAME_WIDTH, INITIAL_SPAWN_INTERVAL, INITIAL_WORLD_SPEED, MAX_DELTA_TIME, MAX_WORLD_SPEED, MIN_SPAWN_INTERVAL, SCORE_SCALE, SPAWN_INTERVAL_REDUCTION, SPEED_INCREASE_PER_LEVEL } from './constants';
import type { GameData } from './types';
import { createPlayer, resetPlayer, setCatFrame } from './player/player';
import { updatePlayer } from './player/playerPhysics';
import { updatePlayerAnimation } from './player/playerAnimation';
import { bindInput, createInput, resetInput } from './input/input';
import { resetObstacles, updateObstacles, updateObstacleSpawning } from './obstacles/obstacles';
import { isPlayerCollidingWithObstacle } from './collision/collision';
import { loadSprites, render } from './render/renderer';

export function createGameState(): GameData {
    return {
        gameState: 'running',
        player: createPlayer(),
        input: createInput(),
        obstacles: [],
        obstacleSpawnTimer: 0,
        obstacleSpawnInterval: INITIAL_SPAWN_INTERVAL,
        groundMarker: { x: 300, width: 40 },
        score: 0,
        distance: 0,
        difficultyLevel: 0,
        worldSpeed: INITIAL_WORLD_SPEED,
        collisionDetected: false,
    };
}

function updateScore(state: GameData, deltaTime: number) {
    state.distance += state.worldSpeed * deltaTime
    state.score = Math.floor(
        state.distance * SCORE_SCALE
    );
}

function updateDifficulty(state: GameData) {
    state.difficultyLevel =
        Math.floor(state.score / 100);

    state.worldSpeed =
        INITIAL_WORLD_SPEED +
        state.difficultyLevel *
        SPEED_INCREASE_PER_LEVEL;

    state.worldSpeed =
        Math.min(
            state.worldSpeed,
            MAX_WORLD_SPEED
        );

    state.obstacleSpawnInterval =
        INITIAL_SPAWN_INTERVAL -
        state.difficultyLevel *
        SPAWN_INTERVAL_REDUCTION;

    state.obstacleSpawnInterval =
        Math.max(
            state.obstacleSpawnInterval,
            MIN_SPAWN_INTERVAL
        );
}

function gameOver(state: GameData) {
    state.gameState = 'gameOver';
}

function updateCollision(state: GameData) {
    if (isPlayerCollidingWithObstacle(state.player, state.obstacles)) {
        gameOver(state);
    }
}

function updateGroundMarker(state: GameData, deltaTime: number) {
    state.groundMarker.x -=
        state.worldSpeed * deltaTime;

    if (
        state.groundMarker.x +
        state.groundMarker.width <
        0
    ) {
        state.groundMarker.x =
            GAME_WIDTH;
    }
}

export function resetGame(state: GameData) {
    state.distance = 0;
    state.worldSpeed = INITIAL_WORLD_SPEED; // will be reset even without
    state.obstacleSpawnInterval = INITIAL_SPAWN_INTERVAL;

    resetPlayer(state.player);
    resetObstacles(state);

    state.gameState = 'running';
}

export function update(state: GameData, deltaTime: number) {
    if (state.gameState === 'gameOver') {
        if (state.input.restartPressed) {
            resetGame(state);
        }

        resetInput(state.input);
        return;
    }

    updatePlayer(state.player, state.input, deltaTime);
    updatePlayerAnimation(state.player, deltaTime);

    updateObstacleSpawning(state, deltaTime);
    updateObstacles(state, state.worldSpeed, deltaTime);

    updateGroundMarker(state, deltaTime);

    updateCollision(state);

    if (state.gameState === 'running') {
        updateScore(state, deltaTime);
        updateDifficulty(state);
    }

    // Mind the order. Should be after updating player and obstacle position.
    if (state.collisionDetected) {
        console.log('Collision!');
    }

    resetInput(state.input);
}

export function startGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const state = createGameState();
    const assets = loadSprites();
    let previousTime: number | undefined;

    function gameLoop(currentTime: number) {
        if (previousTime === undefined) {
            previousTime = currentTime;
        }

        const rawDeltaTime = (currentTime - previousTime) / 1000;
        const deltaTime = Math.min(rawDeltaTime, MAX_DELTA_TIME);
        previousTime = currentTime;

        update(state, deltaTime);
        render(ctx, canvas, state, assets);

        requestAnimationFrame(gameLoop);
    }

    bindInput(canvas, state.input, () => state.gameState);
    setCatFrame(state.player, 0);
    requestAnimationFrame(gameLoop);
}
