import { CAT_BOTTOM_PADDING, PLAYER_SCALE } from '../constants';
import { OBSTACLE_CONFIG } from '../obstacles/obstacleConfig';
import type { Obstacle, ObstacleSegment, Player, Rect } from '../types';

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

export function getObstacleBounds(obstacle: Obstacle): Rect[] {
    return obstacle.segments.map(segment => getObstacleSegmentBounds(obstacle, segment));
}

function getObstacleSegmentBounds(obstacle: Obstacle, segment: ObstacleSegment): Rect {
    const { sprite, collision } = OBSTACLE_CONFIG[segment.type];
    // Match the renderer's aspect-preserving, centered, bottom-aligned fit.
    const scale = Math.min(
        segment.width / sprite.frameWidth,
        segment.height / sprite.frameHeight
    );
    const spriteX = obstacle.x + segment.offsetX + (segment.width - sprite.frameWidth * scale) / 2;
    const spriteY = obstacle.y + obstacle.height - sprite.frameHeight * scale;

    return {
        x: spriteX + collision.offsetX * scale,
        y: spriteY + collision.offsetY * scale,
        width: collision.width * scale,
        height: collision.height * scale,
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
        for (const bounds of getObstacleBounds(obstacle)) {
            if (rectanglesOverlap(playerBounds, bounds)) {
                return true;
            }
        }
    }
    return false;
}
