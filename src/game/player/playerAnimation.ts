import { IDLE_FRAME, FALL_FRAME, JUMP_FRAME, RUN_FRAME_DURATION, HIT_GROUND_FRAME, HIT_AIRBORNE_FRAME, RUN_FRAMES } from '../constants';
import type { Player } from '../types';

export function updatePlayerAnimation(player: Player, deltaTime: number) {
    const stateChanged = player.state != player.previousState

    if(stateChanged) {
        player.animationTime = 0 // Reset animation time on state change
        player.previousState = player.state
    }

    switch (player.state) {
        case 'idle':
            player.frame = IDLE_FRAME;
            return;

        case 'jumping':
            player.frame = JUMP_FRAME;
            return;

        case 'falling':
            player.frame = FALL_FRAME;
            return;

        case 'hit':
            player.frame = player.hitPose === 'airborne' ? HIT_AIRBORNE_FRAME : HIT_GROUND_FRAME;
            return;

        case 'running':
            break;
    }

    player.animationTime += deltaTime; // elapsed time per frame

    while (player.animationTime >= RUN_FRAME_DURATION) {
        player.animationTime -= RUN_FRAME_DURATION;

        player.animationFrameIndex =
            (player.animationFrameIndex + 1) % RUN_FRAMES.length;
    }

    player.frame = RUN_FRAMES[player.animationFrameIndex];
}
