export type GameAction =
    | 'jump'
    | 'pause'
    | 'restart';

export type PlayerState =
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

export type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;

    passed: boolean;
};

export interface Player extends Rect {
    frame: number;
    velocityY: number;
    isGrounded: boolean;
    animationTime: number;
    animationFrameIndex: number;
    state: PlayerState;
}

export interface InputState {
    jumpPressed: boolean;
    restartPressed: boolean;
}

export interface ObstacleState {
    obstacles: Obstacle[];
    obstacleSpawnTimer: number;
    obstacleSpawnInterval: number;
}

export interface GameData extends ObstacleState {
    gameState: GameState;
    player: Player;
    input: InputState;
    groundMarker: { x: number; width: number };
    score: number;
    distance: number;
    difficultyLevel: number;
    worldSpeed: number;
    collisionDetected: boolean;
}

export interface SpriteAssets {
    catSpriteSheet: HTMLImageElement;
    catSpriteLoaded: boolean;
}
