import { CAT_BOTTOM_PADDING, PLAYER_SCALE } from '../constants';
import type { Obstacle, Player, Rect } from '../types';

const PLAYER_HITBOXES = {
    grounded: {
        offsetX: 10,
        offsetY: 311 * PLAYER_SCALE - 73 - CAT_BOTTOM_PADDING,
        width: 91,
        height: 73,
    },

    airborne: {
        offsetX: 20,
        offsetY: 311 * PLAYER_SCALE - 80 - CAT_BOTTOM_PADDING,
        width: 80,
        height: 35,
    },
} as const;

export function getPlayerBounds(player: Player): Rect {
    const hitbox = player.isGrounded
        ? PLAYER_HITBOXES.grounded
        : PLAYER_HITBOXES.airborne;

    return {
        x: player.x + hitbox.offsetX,
        y: player.y + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height,
    };
}

export function getObstacleBounds(obstacle: Obstacle): Rect {
    return {
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
    };
}

export function rectanglesOverlap(a: Rect, b: Rect) {
    return (
        a.x + a.width > b.x &&
        a.x < b.x + b.width &&
        a.y + a.height > b.y &&
        a.y < b.y + b.height
    );
}

export function isPlayerCollidingWithObstacle(player: Player, obstacles: Obstacle[]) {
    const playerBounds =
        getPlayerBounds(player);

    for (const obstacle of obstacles) {
        const obstacleBounds =
            getObstacleBounds(obstacle);

        if (
            rectanglesOverlap(
                playerBounds,
                obstacleBounds
            )
        ) {
            return true
        }
    }
    return false
}
