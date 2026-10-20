import {describe, expect, it} from 'vitest';
import {createGameState} from './gameState';
import {triggerAction} from './input/input';
import {updateGame} from './updateGame';
import {GAME_STATE, PLAYER_STATE, SOUND_EVENT, type SoundEvent} from './types';
import {getPlayerBounds} from './collision/collision';
import {createObstacle} from './obstacles/obstacles';
import {RESTART_COOLDOWN_SECONDS} from './constants';

describe('real Core gameplay integration', () => {
    it('starts, jumps, collides, and restarts without browser setup or module mocks', () => {
        const state = createGameState();
        const events: SoundEvent[] = [];
        const onSoundEvent = (event: SoundEvent) => events.push(event);

        updateGame(state, 0, onSoundEvent);
        expect(state.gameState).toBe(GAME_STATE.READY);

        triggerAction(state.input, 'jump');
        updateGame(state, 0, onSoundEvent);
        expect(state.gameState).toBe(GAME_STATE.RUNNING);
        expect(state.player.isGrounded).toBe(true);
        expect(state.obstacles).toHaveLength(1);

        triggerAction(state.input, 'jump');
        updateGame(state, 0.01, onSoundEvent);
        expect(state.player.state).toBe(PLAYER_STATE.JUMPING);
        expect(state.input.jumpPressed).toBe(false);

        const bounds = getPlayerBounds(state.player);
        const obstacle = createObstacle('buildingSmall');
        obstacle.x = bounds.x;
        obstacle.y = bounds.y;
        state.obstacles = [obstacle];
        state.lastSpawnedObstacle = obstacle;
        state.score = 123;
        state.distance = 2460;
        updateGame(state, 0, onSoundEvent);
        expect(state.gameState).toBe(GAME_STATE.GAME_OVER);
        expect(state.player.state).toBe(PLAYER_STATE.HIT);
        expect(state.highScore).toBe(123);

        triggerAction(state.input, 'restart');
        updateGame(state, RESTART_COOLDOWN_SECONDS, onSoundEvent);
        expect(state.gameState).toBe(GAME_STATE.GAME_OVER);
        expect(state.restartCooldown).toBe(0);
        expect(state.input.restartPressed).toBe(false);

        triggerAction(state.input, 'restart');
        updateGame(state, 0, onSoundEvent);
        expect(state.gameState).toBe(GAME_STATE.RUNNING);
        expect(state.score).toBe(0);
        expect(state.distance).toBe(0);
        expect(state.highScore).toBe(123);
        expect(state.difficultyLevel).toBe(0);
        expect(state.player.isGrounded).toBe(true);
        expect(state.obstacles).toHaveLength(1);
        expect(state.input).toEqual({jumpPressed: false, restartPressed: false});
        expect(events).toEqual([
            SOUND_EVENT.START, SOUND_EVENT.JUMP, SOUND_EVENT.GAME_OVER, SOUND_EVENT.START,
        ]);
    });
});
