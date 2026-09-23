import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(() => server.close());
const { createGameState, update } = await server.ssrLoadModule('/src/game/Game.ts');
const { createObstacle } = await server.ssrLoadModule('/src/game/obstacles/obstacles.ts');
const { SCORE_SCALE } = await server.ssrLoadModule('/src/game/constants.ts');

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
    assert.deepEqual(events, ['jump']);
});

test('collision emits game-over once; restart emits start once', () => {
    const state = createGameState();
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
