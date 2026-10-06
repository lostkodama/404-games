import {describe, expect, it} from "vitest";
import type {Obstacle, Player, Rect} from "../types.ts";
import {getObstacleBounds, getPlayerBounds, isPlayerCollidingWithObstacle, rectanglesOverlap} from "./collision.ts";
import {CAT_BOTTOM_PADDING, CAT_FRAME_HEIGHT, PLAYER_SCALE} from "../constants.ts";
import {OBSTACLE_CONFIG} from "../obstacles/obstacleConfig.ts";

function createTestPlayer(overrides: Partial<Player> = {}): Player {
    return {
        isGrounded: true,
        x: 100,
        y: 100,
        ...overrides
    } as Player
}

function createBuildingObstacle(
    overrides: Partial<Obstacle> = {},
): Obstacle {
    return {
        type: "buildingSmall",
        pattern: "buildingSmall",
        x: 100,
        y: 200,
        width: 32,
        height: 35,
        passed: false,
        segments: [
            {
                type: "buildingSmall",
                offsetX: 10,
                width: 32,
                height: 30,
            },
        ],
        ...overrides,
    } as Obstacle;
}

describe("getPlayerBounds", () => {
    it("returns the grounded player hitbox", () => {

        const player = createTestPlayer({isGrounded: true})
        const playerBounds = getPlayerBounds(player)

        // intentionally copied the values of PLAYER_HITBOX so test fails when value is accidentally changed
        expect(playerBounds).toEqual({
            x: player.x + 10,
            y: player.y + (CAT_FRAME_HEIGHT * PLAYER_SCALE - 50 - CAT_BOTTOM_PADDING),
            width: 60,
            height: 50,
        })
    })

    it("returns the airborne player hitbox", () => {
        const player = createTestPlayer({isGrounded: false})
        const playerBounds = getPlayerBounds(player)

        expect(playerBounds).toEqual({
            x: player.x + 20,
            y: player.y + (CAT_FRAME_HEIGHT * PLAYER_SCALE - 55 - CAT_BOTTOM_PADDING),
            width: 50,
            height: 27,
        })
    })
})

describe("getObstacleBounds", () => {
    it("returns collision bounds for a non-sprite obstacle", () => {
        expect(getObstacleBounds(createBuildingObstacle({
            x: 100,
            y: 200,
        }))).toEqual([
            {
                x: 110 + 0,
                y: 205 + 0,
                width: 32,
                height: 35
            }
        ])
    })
    it("returns collision bounds for every segment in a grouped obstacle", () => {
        const obstacle = createBuildingObstacle({
            x: 300,
            y: 200,
            width: 84,
            segments: [
                {
                    type: "buildingSmall",
                    offsetX: 0,
                    width: 32,
                    height: 35,
                },
                {
                    type: "buildingSmall",
                    offsetX: 52,
                    width: 32,
                    height: 35,
                },
            ],
        });

        expect(getObstacleBounds(obstacle)).toEqual([
            {
                x: 300,
                y: 200,
                width: 32,
                height: 35,
            },
            {
                x: 352,
                y: 200,
                width: 32,
                height: 35,
            },
        ]);

    })
    it("returns scaled collision bounds for a sprite obstacle", () => {
        const obstacle = {
            type: "car",
            pattern: "car",
            x: 300,
            y: 200,
            width: 40,
            height: 55,
            passed: false,

            animationTime: 0,
            animationFrameIndex: 0,

            segments: [
                {
                    type: "car",
                    offsetX: 0,
                    width: 40,
                    height: 55,
                },
            ],
        } as Obstacle;

        const [bounds] = getObstacleBounds(obstacle);

        const {sprite, collision} = OBSTACLE_CONFIG.car;

        const scale = Math.min(
            40 / sprite.frameWidth,
            55 / sprite.frameHeight,
        );

        const fittedWidth = sprite.frameWidth * scale;
        const fittedHeight = sprite.frameHeight * scale;

        const fittedX = 300 + (40 - fittedWidth) / 2;
        const fittedY = 200 + 55 - fittedHeight;

        expect(bounds).toEqual({
            x: fittedX + collision.offsetX * scale,
            y: fittedY + collision.offsetY * scale,
            width: collision.width * scale,
            height: collision.height * scale,
        });
    })

    describe("rectanglesOverlap", () => {
        it("returns true when rectangles overlap", () => {
            const a: Rect = {
                x: 10,
                y: 5,
                width: 6,
                height: 20
            }

            const b: Rect = {
                x: 10,
                y: 14,
                width: 6,
                height: 6
            }

            expect(rectanglesOverlap(a, b)).toBe(true)
        })

        it("returns false when rectangles separated", () => {
            const a: Rect = {
                x: 30,
                y: 5,
                width: 6,
                height: 20
            }

            const b: Rect = {
                x: 10,
                y: 14,
                width: 6,
                height: 6
            }

            expect(rectanglesOverlap(a, b)).toBe(false)
        })

        it("returns false when rectangles only touch at an edge", () => {
            const a: Rect = {
                x: 10,
                y: 5,
                width: 5,
                height: 20
            }

            const b: Rect = {
                x: 15,
                y: 14,
                width: 6,
                height: 6
            }

            expect(rectanglesOverlap(a, b)).toBe(false)
        })
    })

    describe("isPlayerCollidingWithObstacle", () => {
        it("returns false when there are no obstacles", () => {
            const player = createTestPlayer();

            expect(
                isPlayerCollidingWithObstacle(player, []),
            ).toBe(false);
        });

        it("returns true when the player overlaps an obstacle", () => {
            const player = createTestPlayer();
            const playerBounds = getPlayerBounds(player);

            const obstacle = createBuildingObstacle({
                x: playerBounds.x + 10,
                y: playerBounds.y + 10,
            });

            expect(
                isPlayerCollidingWithObstacle(player, [obstacle]),
            ).toBe(true);
        });

        it("returns false when the player does not overlap an obstacle", () => {
            const player = createTestPlayer();

            const obstacle = createBuildingObstacle({
                x: 1000,
                y: 200,
            });

            expect(
                isPlayerCollidingWithObstacle(player, [obstacle]),
            ).toBe(false);
        });

        it("detects collision with any segment in a grouped obstacle", () => {
            const player = createTestPlayer();
            const playerBounds = getPlayerBounds(player);

            const obstacle = createBuildingObstacle({
                x: playerBounds.x - 100,
                y: playerBounds.y,
                width: 132,
                segments: [
                    {
                        type: "buildingSmall",
                        offsetX: 0,
                        width: 32,
                        height: 35,
                    },
                    {
                        type: "buildingSmall",
                        offsetX: 100,
                        width: 32,
                        height: 35,
                    },
                ],
            });

            expect(
                isPlayerCollidingWithObstacle(player, [obstacle]),
            ).toBe(true);
        });
    })
})