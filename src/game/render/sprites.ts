import type { ObstacleSprite, SpriteAssets } from '../types';
import { OBSTACLE_CONFIG } from '../obstacles/obstacleConfig';
import type { ObstacleConfig } from '../obstacles/obstacleConfig';

function loadObstacleSprite(config: ObstacleConfig['sprite']): ObstacleSprite {
    const sprite: ObstacleSprite = {
        image: new Image(),
        loaded: false,
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight,
        frameCount: config.frameCount,
        columns: config.columns,
    };

    sprite.image.onload = () => {
        sprite.loaded = true;
    };
    sprite.image.src = config.src;
    return sprite;
}

export function loadSprites(): SpriteAssets {
    const assets: SpriteAssets = {
        catSpriteSheet: new Image(),
        catSpriteLoaded: false,
        obstacles: Object.fromEntries(
            Object.entries(OBSTACLE_CONFIG).map(([type, config]) => [type, loadObstacleSprite(config.sprite)])
        ) as SpriteAssets['obstacles'],
    };
    assets.catSpriteSheet.onload = () => { assets.catSpriteLoaded = true; };
    assets.catSpriteSheet.src = '/sprites/cat-run-jump.png';
    return assets;
}
