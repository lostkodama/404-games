import {CAT_BOTTOM_PADDING, GROUND_Y, PLAYER_GROUND_Y, PLAYER_SCALE, RUN_FRAMES} from '../constants';
import type {Player} from '../types';

export function createPlayer(): Player {
    return {
        x: 100,
        y: GROUND_Y - (271.5 * PLAYER_SCALE) + CAT_BOTTOM_PADDING,
        width: 271.5 * PLAYER_SCALE,
        height: 311 * PLAYER_SCALE,

        frame: RUN_FRAMES[0],

        velocityY: 0,
        isGrounded: true,

        animationTime: 0,
        animationFrameIndex: 0,

        state: 'running',
        previousState: 'running',
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
