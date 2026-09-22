export const CAT_FRAME_WIDTH = 271.5;

export const CAT_FRAME_HEIGHT = 311;

export const CAT_FRAME_COUNT = 16;

export const CAT_BOTTOM_PADDING = 23;

export const GAME_WIDTH = 600;

export const GAME_HEIGHT = 400;

export const GROUND_Y = 320;

export const RUN_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export const JUMP_FRAME = 12;

export const FALL_FRAME = 13;

export const HIT_FRAME = 14;

export const RUN_ANIMATION_FPS = 11;

export const RUN_FRAME_DURATION = 1 / RUN_ANIMATION_FPS;

export const PLAYER_SCALE = 0.4

export const GRAVITY = 1300;

export const JUMP_VELOCITY = -560;

export const MAX_DELTA_TIME = 0.05;

export const INITIAL_WORLD_SPEED = 220;

export const MAX_WORLD_SPEED = 800;

export const SPEED_INCREASE_PER_LEVEL = 20;

export const OBSTACLE_SPAWN_X =
    GAME_WIDTH + 80;

export const INITIAL_SPAWN_INTERVAL = 2;

export const MIN_SPAWN_INTERVAL = 1.3;

export const SPAWN_INTERVAL_REDUCTION = 0.1;

export const SCORE_SCALE = 0.05

export const PLAYER_GROUND_Y = GROUND_Y - 311 * PLAYER_SCALE + CAT_BOTTOM_PADDING;
