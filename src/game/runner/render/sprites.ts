import type { ObstacleSprite, SpriteAssets } from './spriteTypes';
import {OBSTACLE_CONFIG, type ObstacleConfigSprite} from '../obstacles/obstacleConfig';
import type {ObstacleType} from '../types';
import carUrl from './assets/car.png?url&no-inline';
import catUrl from './assets/cat-run-jump.png?url&no-inline';

// Asset URLs belong to the browser loader, not gameplay metadata.
const OBSTACLE_SPRITE_URLS: Partial<Record<ObstacleType, string>> = {
    car: carUrl,
};

function loadObstacleSprite(config: ObstacleConfigSprite, src: string): ObstacleSprite {
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
    sprite.image.src = src;
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
                    const src = OBSTACLE_SPRITE_URLS[type as ObstacleType];
                    if (src === undefined) {
                        throw new Error(`Sprite URL not configured for obstacle: ${type}`);
                    }
                    return [[type, loadObstacleSprite(config.sprite, src)
                    ]];
                })
        ) as SpriteAssets['obstacles'],
    };
    assets.catSpriteSheet.onload = () => { assets.catSpriteLoaded = true; };
    assets.catSpriteSheet.src = catUrl;
    return assets;
}
