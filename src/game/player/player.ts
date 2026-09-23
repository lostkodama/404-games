import {IDLE_FRAME, PLAYER_GROUND_Y, PLAYER_SCALE, RUN_FRAMES} from '../constants';
import type {Player} from '../types';

export function createPlayer(): Player {
    return {
        x: 100,
        y: PLAYER_GROUND_Y,
        width: 271.5 * PLAYER_SCALE,
        height: 311 * PLAYER_SCALE,

        frame: IDLE_FRAME,

        velocityY: 0,
        isGrounded: true,

        animationTime: 0,
        animationFrameIndex: 0,

        state: 'idle',
        previousState: 'idle',
    };
}

export function resetPlayer(player: Player) {
    player.x = 100;
    player.y = PLAYER_GROUND_Y;

    player.velocityY = 0;
    player.isGrounded = true;

    player.frame = RUN_FRAMES[0];

    player.animationTime = 0;
    player.animationFrameIndex = 0;

    player.state = 'running';
    player.previousState = 'running';
}
