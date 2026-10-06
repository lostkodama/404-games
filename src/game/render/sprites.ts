import type { ObstacleSprite, SpriteAssets } from './spriteTypes';
import {OBSTACLE_CONFIG, type ObstacleConfigSprite} from '../obstacles/obstacleConfig';

function loadObstacleSprite(config: ObstacleConfigSprite): ObstacleSprite {
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
            Object.entries(OBSTACLE_CONFIG).filter(([_, config]) => config.sprite != null)
                .flatMap(([type, config]) => {
                    if (config.sprite === null) {
                        return [];
                    }
                    return [[type, loadObstacleSprite(config.sprite)
                    ]];
                })
        ) as SpriteAssets['obstacles'],
    };
    assets.catSpriteSheet.onload = () => { assets.catSpriteLoaded = true; };
    assets.catSpriteSheet.src = '/sprites/cat-run-jump.png';
    return assets;
}
