import type { GameData } from '../types';

export function debugGameState(label: string, state: GameData) {
    if (!import.meta.env.DEV) return;

    // Copy primitives only, so expanding an old console entry never shows later state.
    console.debug(`[Game] ${label}`, {
        gameState: state.gameState,
        score: state.score,
        highScore: state.highScore,
        distance: state.distance,
        difficultyLevel: state.difficultyLevel,
        worldSpeed: state.worldSpeed,
        restartCooldown: state.restartCooldown,
        obstacleCount: state.obstacles.length,
        nextObstacleGap: state.nextObstacleGap,
        lastObstaclePattern: state.lastSpawnedObstacle?.pattern ?? null,
        lastObstacleX: state.lastSpawnedObstacle?.x ?? null,
        playerState: state.player.state,
        playerY: state.player.y,
        playerVelocityY: state.player.velocityY,
        playerGrounded: state.player.isGrounded,
        playerFrame: state.player.frame,
        playerAnimationTime: state.player.animationTime,
        jumpPressed: state.input.jumpPressed,
        restartPressed: state.input.restartPressed,
    });
}
