import { FALL_FRAME, JUMP_FRAME, RUN_FRAME_DURATION, RUN_FRAMES } from '../constants';
import type { Player } from '../types';

export function updatePlayerAnimation(player: Player, deltaTime: number) {
    if (!player.isGrounded) {
        if (player.velocityY < 0) {
            player.frame = JUMP_FRAME; // Less than 0 is UP
        } else {
            player.frame = FALL_FRAME; // More than 0 is DOWN
        }

        return;
    }

    player.animationTime += deltaTime; // elapsed time per frame

    while (player.animationTime >= RUN_FRAME_DURATION) {
        player.animationTime -= RUN_FRAME_DURATION;

        player.animationFrameIndex =
            (player.animationFrameIndex + 1) % RUN_FRAMES.length;
    }

    player.frame = RUN_FRAMES[player.animationFrameIndex];
}
