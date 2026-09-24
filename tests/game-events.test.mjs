import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(() => server.close());
const { createGameState, resetGame, update } = await server.ssrLoadModule('/src/game/Game.ts');
const { createObstacle } = await server.ssrLoadModule('/src/game/obstacles/obstacles.ts');
const { SCORE_SCALE, IDLE_FRAME, PLAYER_GROUND_Y, JUMP_VELOCITY, GRAVITY } = await server.ssrLoadModule('/src/game/constants.ts');

test('initial jump plays only start; later successful jumps play jump', () => {
    const state = createGameState();
    const events = [];
    const emit = event => events.push(event);
    update(state, 0, emit);
    assert.deepEqual(events, []);
    state.input.jumpPressed = true;
    update(state, 0.01, emit);
    state.input.jumpPressed = true;
    update(state, 0.01, emit);
    assert.deepEqual(events, ['start']);
    assert.equal(state.player.state, 'jumping');
    for (let frame = 0; frame < 80; frame++) update(state, 0.01, emit);
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
    assert.equal(state.restartCooldown, 2);
    update(state, 2, emit);
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

test('restart jumps immediately through normal physics with one input', () => {
    const state = createGameState();
    state.gameState = 'gameOver';
    state.input.restartPressed = true;
    update(state, 0.01);
    assert.equal(state.gameState, 'running');
    assert.equal(state.player.state, 'jumping');
    assert.equal(state.player.isGrounded, false);
    assert.equal(state.player.velocityY, JUMP_VELOCITY + GRAVITY * 0.01);
    assert.equal(state.player.y, PLAYER_GROUND_Y + state.player.velocityY * 0.01);
    assert.deepEqual(state.input, { jumpPressed: false, restartPressed: false });
});

test('idle animation uses its static frame without advancing time', async () => {
    const { updatePlayerAnimation } = await server.ssrLoadModule('/src/game/player/playerAnimation.ts');
    const state = createGameState();
    updatePlayerAnimation(state.player, 1);
    assert.equal(state.player.frame, IDLE_FRAME);
    assert.equal(state.player.animationTime, 0);
});


test('cooldown freezes gameplay and discards inputs, including the expiry frame', async () => {
    const { handleKeyDown, handlePointerDown } = await server.ssrLoadModule('/src/game/input/input.ts');
    const state = createGameState();
    resetGame(state);
    const obstacle = createObstacle('buildingSmall');
    obstacle.x = state.player.x;
    state.obstacles = [obstacle];
    state.lastSpawnedObstacle = obstacle;
    state.input.restartPressed = true; // stale input on the collision frame
    update(state, 0);
    assert.equal(state.restartCooldown, 2);
    assert.equal(state.input.restartPressed, false);
    const frozen = structuredClone(state);
    const press = repeat => handleKeyDown(state.input, state.gameState, {
        code: 'Space', repeat, preventDefault() {},
    });

    for (const remaining of [1, 0]) {
        press(false);
        handlePointerDown(state.input, state.gameState, { preventDefault() {} });
        update(state, 1);
        assert.equal(state.restartCooldown, remaining);
        assert.equal(state.gameState, 'gameOver');
        assert.equal(state.input.restartPressed, false);
        assert.deepEqual({ ...state, restartCooldown: 2 }, frozen);
    }
    press(true); // holding the key after expiry must not restart
    update(state, 0.05);
    assert.equal(state.gameState, 'gameOver');
    press(false); // a fresh press is now accepted
    update(state, 0.05);
    assert.equal(state.gameState, 'running');
    assert.equal(state.restartCooldown, 0);
});

test('cooldown clamps at zero and reset clears an active cooldown', () => {
    const state = createGameState();
    state.gameState = 'gameOver';
    state.restartCooldown = 0.01;
    state.input.restartPressed = true;
    update(state, 0.05);
    assert.equal(state.restartCooldown, 0);
    assert.equal(state.gameState, 'gameOver');
    state.restartCooldown = 2;
    resetGame(state);
    assert.equal(state.restartCooldown, 0);
});

test('restart plays only start, then later jumps play jump again', () => {
    const state = createGameState();
    state.gameState = 'gameOver';
    state.input.restartPressed = true;
    const events = [];
    const emit = event => events.push(event);
    update(state, 0.01, emit);
    assert.deepEqual(events, ['start']);
    assert.equal(state.player.state, 'jumping');
    for (let frame = 0; frame < 80; frame++) update(state, 0.01, emit);
    state.input.jumpPressed = true;
    update(state, 0.01, emit);
    assert.deepEqual(events, ['start', 'jump']);
});

test('high score records completed runs only and survives restart, but not new state', () => {
    const state = createGameState();
    assert.equal(state.highScore, 0);
    resetGame(state);
    const finishRun = () => {
        const obstacle = createObstacle('buildingSmall');
        obstacle.x = state.player.x;
        state.obstacles = [obstacle];
        state.lastSpawnedObstacle = obstacle;
        update(state, 0);
        assert.equal(state.gameState, 'gameOver');
    };

    state.distance = 50 / SCORE_SCALE;
    update(state, 0);
    assert.equal(state.highScore, 0);
    finishRun();
    assert.equal(state.highScore, 50);
    update(state, 2);
    state.input.restartPressed = true;
    update(state, 0);
    assert.equal(state.score, 0);
    assert.equal(state.distance, 0);
    assert.equal(state.highScore, 50);

    for (const score of [48, 50, 51, 52]) {
        state.distance = score / SCORE_SCALE;
        update(state, 0);
        assert.equal(state.score, score);
        assert.equal(state.highScore, 50);
    }
    finishRun();
    assert.equal(state.highScore, 52);
    // Changing score here proves game-over updates do not recommit it.
    state.score = 99;
    update(state, 0.05);
    assert.equal(state.highScore, 52);

    resetGame(state);
    assert.equal(state.score, 0);
    assert.equal(state.highScore, 52);
    state.distance = 40 / SCORE_SCALE;
    update(state, 0);
    finishRun();
    assert.equal(state.highScore, 52);
    assert.equal(createGameState().highScore, 0);
});
