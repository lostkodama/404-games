import type {GameData} from "./types.ts";
import {createPlayer} from "./player/player.ts";
import {createInput} from "./input/input.ts";
import {createGroundDetails} from "./environment/ground.ts";
import {INITIAL_WORLD_SPEED} from "./constants.ts";
import {createClouds} from "./environment/cloud.ts";

export function createGameState(): GameData {
    return {
        gameState: 'ready',
        restartCooldown: 0,
        player: createPlayer(),
        input: createInput(),
        obstacles: [],
        nextObstacleGap: 0, // No previous obstacle; the first spawn chooses its gap.
        lastSpawnedObstacle: null,
        groundDetails: createGroundDetails(),
        score: 0,
        highScore: 0,
        distance: 0,
        difficultyLevel: 0,
        worldSpeed: INITIAL_WORLD_SPEED,
        clouds: createClouds(),
    };
}
