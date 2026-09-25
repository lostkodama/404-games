import {CAT_BOTTOM_PADDING, CAT_FRAME_HEIGHT, PLAYER_SCALE} from '../constants';
import { OBSTACLE_CONFIG } from '../obstacles/obstacleConfig';
import type { Obstacle, ObstacleSegment, Player, Rect } from '../types';

const PLAYER_HITBOXES = {
    grounded: {
        offsetX: 10,
        offsetY: CAT_FRAME_HEIGHT * PLAYER_SCALE - 50 - CAT_BOTTOM_PADDING,
        width: 60,
        height: 50,
    },

    airborne: {
        offsetX: 20,
        offsetY: CAT_FRAME_HEIGHT * PLAYER_SCALE - 55 - CAT_BOTTOM_PADDING,
        width: 50,
        height: 27,
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

    if(sprite == null) {
        return {
            x: obstacle.x + collision.offsetX + segment.offsetX,
            y: obstacle.y + obstacle.height - segment.height + collision.offsetY,
            width: collision.width,
            height: collision.height
        }
    }

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
