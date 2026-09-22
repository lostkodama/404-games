import type { ObstacleSprite, SpriteAssets } from '../types';

// car.png is a 2172 x 151 horizontal strip with eight equal frame cells.
const CAR_FRAMES: Pick<ObstacleSprite, 'frameWidth' | 'frameHeight' | 'frameCount' | 'columns'> = {
    frameWidth: 2172 / 8,
    frameHeight: 151,
    frameCount: 8,
    columns: 8,
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
