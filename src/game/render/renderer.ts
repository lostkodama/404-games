import { CAT_FRAME_HEIGHT, CAT_FRAME_WIDTH, GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../constants';
import { getObstacleBounds, getPlayerBounds } from '../collision/collision';
import type {Cloud, GameData, GameState, Obstacle, Player, SpriteAssets} from '../types';
import type {GroundDetail} from "../environment/ground.ts";

const SHOW_COLLISION_BOUNDS = false
const SHOW_DIFFICULTY_STATS = false

function prepareCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

    // Resize only when the display size/density changes; resizing clears context state.
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    // Keep all gameplay and drawing coordinates in the original 600 × 400 world.
    ctx.setTransform(width / GAME_WIDTH, 0, 0, height / GAME_HEIGHT, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}

function drawScore(ctx: CanvasRenderingContext2D, highScore: number, score: number) {
    ctx.save();

    ctx.fillStyle = '#171717';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';

    ctx.fillText(
        `HI ${formatScore(highScore)} ${formatScore(score)}`,
        GAME_WIDTH - 20,
        30
    );

    ctx.restore();
}

function formatScore(score: number, digits = 4): string {
    return String(score).padStart(digits, '0');
}


function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[], assets: SpriteAssets) {
    ctx.fillStyle = '#555';
    const { a: scaleX, d: scaleY } = ctx.getTransform();

    for (const obstacle of obstacles) {
        for (const segment of obstacle.segments) {
            const x = obstacle.x + segment.offsetX;
            const y = obstacle.y + obstacle.height - segment.height;

            const sprite = assets.obstacles[segment.type];

            if (sprite == null) {
                if(segment.type == 'buildingSmall' || segment.type == 'buildingLarge') {
                    drawBuilding(ctx, x, y, segment.width, segment.height)
                }
                continue;
            }

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
                // Snap only the rendered position, preserving fractional physics/collision.
                Math.round((x + (segment.width - width) / 2) * scaleX) / scaleX,
                Math.round((y + segment.height - height) * scaleY) / scaleY,
                width,
                height
            );
        }
    }
}

function drawBuilding(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
) {
    ctx.save()

    ctx.fillStyle = '#414141';
    ctx.fillRect(x, y, width, height);

    const roofWidth = width * 0.4;
    const roofHeight = 6;

    ctx.fillRect(
        x + (width - roofWidth) / 2,
        y - roofHeight,
        roofWidth,
        roofHeight
    );

    ctx.restore();
}

function drawGameOver(ctx: CanvasRenderingContext2D, gameState: GameState, restartCooldown: number) {
    if (gameState !== 'gameOver') {
        return;
    }

    ctx.fillStyle = 'transparent'

    ctx.fillRect(
        0,
        0,
        GAME_WIDTH,
        GAME_HEIGHT
    );

    ctx.fillStyle = '#171717';
    ctx.textAlign = 'center';

    ctx.font =
        '700 24px "Space Grotesk", sans-serif';

    ctx.fillText(
        'GAME OVER',
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2
    );

    ctx.font =
        '14px Space Grotesk, sans-serif';

    ctx.fillText(
        restartCooldown > 0 ? Math.ceil(restartCooldown).toString() : 'Restart',
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 20
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
    prepareCanvas(ctx, canvas);
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawBackground(ctx); // background

    drawClouds(ctx, state.clouds) // worlds
    drawGround(ctx);
    drawGroundDetails(ctx, state.groundDetails)

    drawObstacles(ctx, state.obstacles, assets); // game objects
    drawPlayer(ctx, state.player, assets);

    if (SHOW_COLLISION_BOUNDS) drawDebugBounds(ctx, state.player, state.obstacles);
    if(SHOW_DIFFICULTY_STATS) drawDebugDifficulty(ctx, state.worldSpeed, state.difficultyLevel, state.nextObstacleGap);

    drawScore(ctx, state.highScore, state.score);

    drawGameOver(ctx, state.gameState, state.restartCooldown);
}

function drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number
) {
    ctx.save();

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();

    ctx.moveTo(0, 16);

    ctx.arc(
        12,
        16,
        12,
        Math.PI,
        0
    );

    ctx.arc(
        28,
        8,
        16,
        Math.PI,
        0
    );

    ctx.arc(
        46,
        16,
        12,
        Math.PI,
        0
    );

    ctx.lineTo(46, 22);
    ctx.lineTo(0, 22);
    ctx.closePath();

    ctx.globalAlpha = 0.75 ;
    ctx.fillStyle = '#171717';
    ctx.globalAlpha = 0.35;
    ctx.fill();

    ctx.restore();
}

function drawClouds(
    ctx: CanvasRenderingContext2D,
    clouds: Cloud[]
) {
    for (const cloud of clouds) {
        drawCloud(
            ctx,
            cloud.x,
            cloud.y,
            cloud.scale
        );
    }
}

function drawGround(
    ctx: CanvasRenderingContext2D
) {
    const groundY = GROUND_Y;

    ctx.save();

    ctx.strokeStyle = '#343333';

    // Strong gameplay baseline
    ctx.lineWidth = 1 ;

    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(GAME_WIDTH, groundY);
    ctx.stroke();


    ctx.restore();
}

function drawGroundDetails(
    ctx: CanvasRenderingContext2D,
    details: GroundDetail[]
) {
    ctx.save();

    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;

    for (const detail of details) {
        ctx.beginPath();

        ctx.moveTo(
            detail.x,
            GROUND_Y + 2
        );

        ctx.lineTo(
            detail.x,
            GROUND_Y + 8
        );

        ctx.stroke();
    }

    ctx.restore();
}
