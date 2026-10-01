import {IDLE_FRAME, PLAYER_GROUND_Y, PLAYER_SCALE, RUN_FRAMES} from '../constants';
import {type Player, PLAYER_STATE} from '../types';

export function createPlayer(): Player {
    return {
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
    };
}

export function resetPlayer(player: Player) {
    player.hitPose = null;
    player.x = 100;
    player.y = PLAYER_GROUND_Y;

    player.velocityY = 0;
    player.isGrounded = true;

    player.frame = RUN_FRAMES[0];

    player.animationTime = 0;
    player.animationFrameIndex = 0;

    player.state = PLAYER_STATE.RUNNING;
    player.previousState = PLAYER_STATE.RUNNING;
}
