import type {GroundDetail} from "./environment/ground.ts";

export type GameAction =
    | 'jump'
    | 'pause'
    | 'restart';

export type PlayerState =
    | 'idle'
    | 'running'
    | 'jumping'
    | 'falling'
    | 'hit';

export type GameState =
    | 'ready' // TODO: start screen
    | 'running'
    | 'gameOver';

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Cloud = {
    x: number;
    y: number;
    scale: number;
};

export type ObstacleType =
    | 'buildingSmall'
    | 'buildingLarge'
    | 'car';

export type ObstaclePattern = ObstacleType | 'doubleBuildingSmall' | 'doubleBuildingLarge';

export interface ObstacleSegment {
    type: ObstacleType;
    offsetX: number;
    width: number;
    height: number;
}

export type Obstacle = {
    pattern: ObstaclePattern;
    segments: ObstacleSegment[];
    x: number;
    y: number;
    width: number;
    height: number;

    passed: boolean;
} & (
    | { type: Exclude<ObstacleType, 'car'> }
    | {
        type: 'car';
        animationTime: number;
        animationFrameIndex: number;
    }
);

export interface Player extends Rect {
    frame: number;
    velocityY: number;
    isGrounded: boolean;
    animationTime: number;
    animationFrameIndex: number;
    state: PlayerState;
    previousState: PlayerState;
}

export interface InputState {
    jumpPressed: boolean;
    restartPressed: boolean;
}

export interface ObstacleState {
    obstacles: Obstacle[];
    nextObstacleGap: number;
    // Retain the spacing reference after it leaves the active obstacle list.
    lastSpawnedObstacle: Obstacle | null;
}

// TODO: Consider composition for GameData and ObstacleState?
export interface GameData extends ObstacleState {
    restartCooldown: number;
    gameState: GameState;
    player: Player;
    input: InputState;
    groundDetails: GroundDetail[];
    score: number;
    highScore: number;
    distance: number;
    difficultyLevel: number;
    worldSpeed: number;
    clouds: Cloud[];
}

export interface ObstacleSprite {
    image: HTMLImageElement;
    loaded: boolean;
    frameWidth: number | null;
    frameHeight: number | null;
    frameCount: number | null;
    columns: number | null;
}

export interface SpriteAssets {
    catSpriteSheet: HTMLImageElement;
    catSpriteLoaded: boolean;
    obstacles: Record<ObstacleType, ObstacleSprite>;
}
