import type {GroundDetail} from "./environment/ground.ts";

// Requested Action from user based on Inputs
export type GameAction =
    | 'jump'
    | 'restart';

export const PLAYER_STATE = {
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    FALLING: 'falling',
    HIT: 'hit',
} as const

export type PlayerState = typeof PLAYER_STATE[keyof typeof PLAYER_STATE]

export const GAME_STATE = {
    READY: 'ready',
    RUNNING: 'running',
    GAME_OVER: 'gameOver',
} as const

export type GameState = typeof GAME_STATE[keyof typeof GAME_STATE]

export const SOUND_EVENT = {
    START: 'start',
    JUMP: 'jump',
    GAME_OVER: 'gameOver',
    LEVEL_UP: 'levelUp'
} as const

export type SoundEvent = typeof SOUND_EVENT[keyof typeof SOUND_EVENT]

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

export const OBSTACLE_TYPE = {
    BUILDING_SMALL: 'buildingSmall',
    BUILDING_LARGE: 'buildingLarge',
    CAR: 'car',
} as const;

export type ObstacleType = typeof OBSTACLE_TYPE[keyof typeof OBSTACLE_TYPE]

export type ObstaclePattern = ObstacleType | 'doubleBuildingSmall' | 'doubleBuildingLarge' | 'tripleBuildingSmall';

// For group obstacles
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

export type HitPose = 'ground' | 'airborne' | null;

export interface Player extends Rect {
    hitPose: HitPose;
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
