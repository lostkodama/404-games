import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(() => server.close());
const { createGameState, resetGame, update } = await server.ssrLoadModule('/src/game/Game.ts');
const { createObstacle } = await server.ssrLoadModule('/src/game/obstacles/obstacles.ts');
const { SCORE_SCALE, IDLE_FRAME, PLAYER_GROUND_Y, JUMP_VELOCITY, GRAVITY } = await server.ssrLoadModule('/src/game/constants.ts');

test('initial update is silent; only a successful jump emits jump', () => {
    const state = createGameState();
    const events = [];
    const emit = event => events.push(event);
    update(state, 0, emit);
    assert.deepEqual(events, []);
    state.input.jumpPressed = true;
    update(state, 0.01, emit);
    state.input.jumpPressed = true;
    update(state, 0.01, emit);
    assert.deepEqual(events, ['start', 'jump']);
});

test('collision emits game-over once; restart emits start once', () => {
    const state = createGameState();
    resetGame(state);
    const obstacle = createObstacle('buildingSmall');
    obstacle.x = state.player.x;
    state.obstacles = [obstacle];
    state.lastSpawnedObstacle = obstacle;
    const events = [];
    const emit = event => events.push(event);
    update(state, 0, emit);
    assert.equal(state.gameState, 'gameOver');
    update(state, 0, emit);
    assert.deepEqual(events, ['gameOver']);
    state.input.restartPressed = true;
    update(state, 0, emit);
    update(state, 0, emit);
    assert.deepEqual(events, ['gameOver', 'start']);
});

test('level advancement emits once and resetting the level stays silent', () => {
    const state = createGameState();
    const events = [];
    const emit = event => events.push(event);
    resetGame(state);
    state.distance = 100 / SCORE_SCALE;
    update(state, 0, emit);
    update(state, 0, emit);
    assert.deepEqual(events, ['levelUp']);
    state.distance = 200 / SCORE_SCALE;
    update(state, 0, emit);
    assert.deepEqual(events, ['levelUp', 'levelUp']);
    state.gameState = 'gameOver';
    state.input.restartPressed = true;
    update(state, 0, emit);
    update(state, 0, emit);
    assert.deepEqual(events, ['levelUp', 'levelUp', 'start']);
});

test('ready freezes the player, world, spawning, score and difficulty', () => {
    const state = createGameState();
    assert.equal(state.gameState, 'ready');
    assert.equal(state.player.state, 'idle');
    assert.equal(state.player.frame, IDLE_FRAME);
    assert.equal(state.player.y, PLAYER_GROUND_Y);
    const before = structuredClone(state);
    for (let frame = 0; frame < 120; frame++) update(state, 0.05);
    assert.deepEqual(state, before);
});

test('first jump starts immediately using normal physics, then lands and runs', () => {
    const state = createGameState();
    state.input.jumpPressed = true;
    update(state, 0.01);
    assert.equal(state.gameState, 'running');
    assert.equal(state.player.state, 'jumping');
    assert.equal(state.player.velocityY, JUMP_VELOCITY + GRAVITY * 0.01);
    assert.equal(state.player.y, PLAYER_GROUND_Y + state.player.velocityY * 0.01);
    assert.equal(state.input.jumpPressed, false);
    for (let frame = 0; frame < 80; frame++) update(state, 0.01);
    assert.equal(state.player.state, 'running');
    assert.equal(state.player.isGrounded, true);
    assert.ok(state.player.animationTime > 0);
});

test('restart returns directly to running without an automatic jump', () => {
    const state = createGameState();
    state.gameState = 'gameOver';
    state.input.restartPressed = true;
    update(state, 0.01);
    assert.equal(state.gameState, 'running');
    assert.equal(state.player.state, 'running');
    assert.equal(state.player.isGrounded, true);
    assert.equal(state.player.velocityY, 0);
});

test('idle animation uses its static frame without advancing time', async () => {
    const { updatePlayerAnimation } = await server.ssrLoadModule('/src/game/player/playerAnimation.ts');
    const state = createGameState();
    updatePlayerAnimation(state.player, 1);
    assert.equal(state.player.frame, IDLE_FRAME);
    assert.equal(state.player.animationTime, 0);
});
