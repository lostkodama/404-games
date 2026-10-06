import type {ObstacleType} from '../types';

export interface ObstacleSprite {
    image: HTMLImageElement;
    loaded: boolean;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    columns: number;
}

export interface SpriteAssets {
    catSpriteSheet: HTMLImageElement;
    catSpriteLoaded: boolean;
    obstacles: Partial<Record<ObstacleType, ObstacleSprite>>;
}
