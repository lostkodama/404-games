import { CAT_BOTTOM_PADDING, CAT_FRAME_COUNT, GROUND_Y, PLAYER_GROUND_Y, PLAYER_SCALE, RUN_FRAMES } from '../constants';
import type { Player } from '../types';

export function createPlayer(): Player {
    return {
    x: 100,
    y: GROUND_Y - (271.5 * PLAYER_SCALE) + CAT_BOTTOM_PADDING,
    width: 271.5 * PLAYER_SCALE,
    height: 311 * PLAYER_SCALE,

    frame: 0,

    velocityY: 0,
    isGrounded: true,

    animationTime: 0,
    animationFrameIndex: 0,

    state: 'running',
};
}

export function setCatFrame(player: Player, frame: number) {
    if (frame < 0 || frame >= CAT_FRAME_COUNT) {
        return;
    }

    player.frame = frame;
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
}
