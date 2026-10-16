import {describe, expect, it} from 'vitest';
import {IDLE_FRAME, PLAYER_GROUND_Y, PLAYER_SCALE, RUN_FRAMES} from '../constants.ts';
import {PLAYER_STATE} from '../types.ts';
import {createPlayer, resetPlayer} from './player.ts';

describe('player creation and reset', () => {
    it('creates a grounded idle player with the configured sprite dimensions', () => {
        const player = createPlayer();

        expect(player).toMatchObject({
            x: 100,
            y: PLAYER_GROUND_Y,
            width: 271.5 * PLAYER_SCALE,
            height: 311 * PLAYER_SCALE,
            frame: IDLE_FRAME,
            hitPose: null,
            velocityY: 0,
            isGrounded: true,
            animationTime: 0,
            animationFrameIndex: 0,
            state: PLAYER_STATE.IDLE,
            previousState: PLAYER_STATE.IDLE,
        });
    });

    it('clears transient movement and hit state when resetting the player', () => {
        const player = createPlayer();
        player.x = 450;
        player.y = PLAYER_GROUND_Y - 80;
        player.velocityY = -200;
        player.isGrounded = false;
        player.hitPose = 'airborne';
        player.frame = 12;
        player.animationTime = 0.08;
        player.animationFrameIndex = 5;
        player.state = PLAYER_STATE.HIT;
        player.previousState = PLAYER_STATE.FALLING;

        resetPlayer(player);

        expect(player).toMatchObject({
            x: 100,
            y: PLAYER_GROUND_Y,
            hitPose: null,
            velocityY: 0,
            isGrounded: true,
            frame: RUN_FRAMES[0],
            animationTime: 0,
            animationFrameIndex: 0,
            state: PLAYER_STATE.RUNNING,
            previousState: PLAYER_STATE.RUNNING,
        });
    });
});
