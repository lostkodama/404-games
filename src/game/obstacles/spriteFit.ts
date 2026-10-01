import type { Rect } from '../types';

export type FittedSprite = Rect & {
    scale: number;
};

export function fitSpriteToBounds(
    bounds: Rect,
    spriteWidth: number,
    spriteHeight: number,
): FittedSprite {
    const scale = Math.min(
        bounds.width / spriteWidth,
        bounds.height / spriteHeight,
    );
    const width = spriteWidth * scale;
    const height = spriteHeight * scale;

    return {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + bounds.height - height,
        width,
        height,
        scale,
    };
}
