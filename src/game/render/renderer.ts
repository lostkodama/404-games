import { CAT_FRAME_HEIGHT, CAT_FRAME_WIDTH, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../constants';
import { getObstacleBounds, getPlayerBounds } from '../collision/collision';
import type { GameData, GameState, Obstacle, Player, SpriteAssets } from '../types';

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
    ctx.save();

    ctx.fillStyle = '#171717';
    ctx.font = '20px monospace';
    ctx.textAlign = 'right';

    ctx.fillText(
        score.toString(),
        GAME_WIDTH - 20,
        30
    );

    ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[], assets: SpriteAssets) {
    ctx.fillStyle = '#555';

    for (const obstacle of obstacles) {
        for (const segment of obstacle.segments) {
            const x = obstacle.x + segment.offsetX;
            const y = obstacle.y + obstacle.height - segment.height;
            const sprite = assets.obstacles[segment.type];
            const { frameWidth, frameHeight, columns } = sprite;

            if (!sprite.loaded || frameWidth === null || frameHeight === null ||
                frameWidth <= 0 || frameHeight <= 0 || columns === null || columns <= 0) {
                ctx.fillRect(x, y, segment.width, segment.height);
                continue;
            }

            // Fit without stretching; keep the sprite centered and grounded within
            // the existing obstacle bounds. Buildings always use frame zero.
            const scale = Math.min(segment.width / frameWidth, segment.height / frameHeight);
            const width = frameWidth * scale;
            const height = frameHeight * scale;
            const frame = obstacle.type === 'car' ? obstacle.animationFrameIndex : 0;
            const sourceX = (frame % columns) * frameWidth;
            const sourceY = Math.floor(frame / columns) * frameHeight;

            ctx.drawImage(
                sprite.image,
                sourceX, sourceY, frameWidth, frameHeight,
                x + (segment.width - width) / 2,
                y + segment.height - height,
                width,
                height
            );
        }
    }
}

function drawGround(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();
}

function drawGroundMarker(ctx: CanvasRenderingContext2D, groundMarker: GameData['groundMarker']) {
    ctx.strokeStyle = '#aaa';

    ctx.beginPath();

    ctx.moveTo(
        groundMarker.x,
        GROUND_Y + 10
    );

    ctx.lineTo(
        groundMarker.x +
        groundMarker.width,
        GROUND_Y + 10
    );

    ctx.stroke();
}

function drawForeground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#d4d4d4';

    ctx.fillRect(
        0,
        GROUND_Y + 20,
        GAME_WIDTH,
        GAME_HEIGHT - GROUND_Y - 20
    );
}

function drawGameOver(ctx: CanvasRenderingContext2D, gameState: GameState) {
    if (gameState !== 'gameOver') {
        return;
    }

    ctx.fillStyle =
        'rgba(255, 255, 255, 0.75)';

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    ctx.fillStyle = '#171717';
    ctx.textAlign = 'center';

    ctx.font =
        'bold 32px sans-serif';

    ctx.fillText(
        'Game Over',
        GAME_WIDTH / 2,
        170
    );

    ctx.font =
        '16px sans-serif';

    ctx.fillText(
        'Press Space or tap to restart',
        GAME_WIDTH / 2,
        210
    );
}

function drawPlayerFrame(ctx: CanvasRenderingContext2D, player: Player, assets: SpriteAssets, frame: number) {
    const sourceX =
        frame * CAT_FRAME_WIDTH;

    const sourceY = 0;

    ctx.drawImage(
        assets.catSpriteSheet,

        sourceX,
        sourceY,
        CAT_FRAME_WIDTH,
        CAT_FRAME_HEIGHT,

        player.x,
        player.y,
        player.width,
        player.height
    );
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, assets: SpriteAssets) {
    // Rectangle
    if (!assets.catSpriteLoaded) {
        ctx.strokeStyle = '#171717';

        ctx.strokeRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        return;
    }

    drawPlayerFrame(ctx, player, assets, player.frame)
}

function drawDebugDifficulty(ctx: CanvasRenderingContext2D, worldSpeed: number, difficultyLevel: number, nextObstacleGap: number) {
    ctx.save();

    ctx.fillStyle = '#171717';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    ctx.fillText(
        `Speed: ${worldSpeed}`,
        20,
        55
    );

    ctx.fillText(
        `Level: ${difficultyLevel}`,
        20,
        72
    );

    ctx.fillText(
        `Gap: ${nextObstacleGap}px`,
        20,
        89
    );

    ctx.restore();
}

function drawDebugBounds(ctx: CanvasRenderingContext2D, player: Player, obstacles: Obstacle[]) {
    const playerBounds =
        getPlayerBounds(player);

    ctx.strokeStyle = 'blue';

    for (const obstacle of obstacles) {
        for (const bounds of getObstacleBounds(obstacle)) {
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    }

    ctx.strokeStyle = 'red';

    ctx.strokeRect(
        playerBounds.x,
        playerBounds.y,
        playerBounds.width,
        playerBounds.height
    );

    ctx.strokeStyle = 'blue';
}

export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameData, assets: SpriteAssets) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(ctx); // background

    drawGround(ctx); // worlds
    drawGroundMarker(ctx, state.groundMarker);

    drawObstacles(ctx, state.obstacles, assets); // game objects
    drawPlayer(ctx, state.player, assets);

    //drawDebugBounds(ctx, state.player, state.obstacles);
    drawDebugDifficulty(ctx, state.worldSpeed, state.difficultyLevel, state.nextObstacleGap);

    drawForeground(ctx); // foreground
    drawScore(ctx, state.score);

    drawGameOver(ctx, state.gameState);
}
