import type { ObstacleSprite, SpriteAssets } from '../types';

// Fill these in when car.png is added. Frames are read left-to-right,
// then top-to-bottom in an evenly spaced grid with no gaps or margins.
// Leave unset rather than guessing the sheet's dimensions or frame count.
const CAR_FRAMES: Pick<ObstacleSprite, 'frameWidth' | 'frameHeight' | 'frameCount' | 'columns'> = {
    frameWidth: null,
    frameHeight: null,
    frameCount: null,
    columns: null,
};

function loadObstacleSprite(src: string, isStatic: boolean): ObstacleSprite {
    const sprite: ObstacleSprite = {
        image: new Image(),
        loaded: false,
        frameWidth: null,
        frameHeight: null,
        frameCount: isStatic ? 1 : CAR_FRAMES.frameCount,
        columns: isStatic ? 1 : CAR_FRAMES.columns,
    };

    if (!isStatic) {
        sprite.frameWidth = CAR_FRAMES.frameWidth;
        sprite.frameHeight = CAR_FRAMES.frameHeight;
    }

    sprite.image.onload = () => {
        if (isStatic) {
            sprite.frameWidth = sprite.image.naturalWidth;
            sprite.frameHeight = sprite.image.naturalHeight;
        }
        sprite.loaded = true;
    };
    sprite.image.src = src;
    return sprite;
}

export function loadSprites(): SpriteAssets {
    const assets: SpriteAssets = {
        catSpriteSheet: new Image(),
        catSpriteLoaded: false,
        obstacles: {
            buildingSmall: loadObstacleSprite('/sprites/building-small.png', true),
            buildingLarge: loadObstacleSprite('/sprites/building-large.png', true),
            car: loadObstacleSprite('/sprites/car.png', false),
        },
    };
    assets.catSpriteSheet.onload = () => { assets.catSpriteLoaded = true; };
    assets.catSpriteSheet.src = '/sprites/cat-run-jump.png';
    return assets;
}
