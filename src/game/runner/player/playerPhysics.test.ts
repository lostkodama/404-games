import { describe, expect, it } from 'vitest';
import {createPlayer} from "./player.ts";
import {updatePlayer} from "./playerPhysics.ts";
import {GRAVITY, JUMP_VELOCITY, PLAYER_GROUND_Y} from "../constants.ts";
import {PLAYER_STATE} from "../types.ts";

describe('updatePlayer', () => {
    const deltaTime = 0.01;

    it('keeps a grounded player running when jump is not pressed', () => {
        const player = createPlayer();
        const jumped = updatePlayer(
            player,
            { jumpPressed: false, restartPressed: false },
            deltaTime,
        );

        expect(jumped).toBe(false);
        expect(player.y).toBe(PLAYER_GROUND_Y);
        expect(player.velocityY).toBe(0);
        expect(player.isGrounded).toBe(true);
        expect(player.state).toBe(PLAYER_STATE.RUNNING);
    })

    it('jumps from the ground and applies gravity during the same frame', () => {
        const player = createPlayer();

        const jumped = updatePlayer(
            player,
            { jumpPressed: true, restartPressed: false },
            deltaTime,
        );

        const expectedVelocity = JUMP_VELOCITY + GRAVITY * deltaTime;

        expect(jumped).toBe(true);
        expect(player.velocityY).toBeCloseTo(expectedVelocity);
        expect(player.y).toBeCloseTo(
            PLAYER_GROUND_Y + expectedVelocity * deltaTime,
        );
        expect(player.isGrounded).toBe(false);
        expect(player.state).toBe(PLAYER_STATE.JUMPING);
    })

    it('ignores jump input while airborne', () => {
        const player = createPlayer();
        player.y = PLAYER_GROUND_Y - 50;
        player.velocityY = -100;
        player.isGrounded = false;

        const jumped = updatePlayer(
            player,
            { jumpPressed: true, restartPressed: false },
            deltaTime,
        );

        expect(jumped).toBe(false);
        expect(player.velocityY).toBeCloseTo(-84);
        expect(player.y).toBeCloseTo(PLAYER_GROUND_Y - 50.84);
        expect(player.isGrounded).toBe(false);
        expect(player.state).toBe(PLAYER_STATE.JUMPING);
    })

    it('transitions from jumping to falling when gravity reverses velocity', () => {
        const player = createPlayer();
        player.y = PLAYER_GROUND_Y - 50;
        player.velocityY = -8;
        player.isGrounded = false;
        player.state = PLAYER_STATE.JUMPING;

        updatePlayer(
            player,
            { jumpPressed: false, restartPressed: false },
            deltaTime,
        );

        expect(player.velocityY).toBeCloseTo(8);
        expect(player.y).toBeCloseTo(PLAYER_GROUND_Y - 49.92);
        expect(player.isGrounded).toBe(false);
        expect(player.state).toBe(PLAYER_STATE.FALLING);
    })

    it('uses the falling state when airborne velocity is exactly zero', () => {
        const player = createPlayer();
        player.y = PLAYER_GROUND_Y - 50;
        player.velocityY = -GRAVITY * deltaTime;
        player.isGrounded = false;

        updatePlayer(
            player,
            { jumpPressed: false, restartPressed: false },
            deltaTime,
        );

        expect(player.velocityY).toBe(0);
        expect(player.y).toBe(PLAYER_GROUND_Y - 50);
        expect(player.isGrounded).toBe(false);
        expect(player.state).toBe(PLAYER_STATE.FALLING);
    })

    it.each([0.5, 1.16])(
        'lands when starting %s units above the ground',
        (distanceAboveGround) => {
            const player = createPlayer();
            player.y = PLAYER_GROUND_Y - distanceAboveGround;
            player.velocityY = 100;
            player.isGrounded = false;
            player.state = PLAYER_STATE.FALLING;

            const jumped = updatePlayer(
                player,
                { jumpPressed: false, restartPressed: false },
                deltaTime,
            );

            expect(jumped).toBe(false);
            expect(player.y).toBe(PLAYER_GROUND_Y);
            expect(player.velocityY).toBe(0);
            expect(player.isGrounded).toBe(true);
            expect(player.state).toBe(PLAYER_STATE.RUNNING);
        },
    );

    it('does not jump on the landing frame when jump is pressed in the air', () => {
        const player = createPlayer();
        player.y = PLAYER_GROUND_Y - 0.5;
        player.velocityY = 100;
        player.isGrounded = false;

        const jumped = updatePlayer(
            player,
            { jumpPressed: true, restartPressed: false },
            deltaTime,
        );

        expect(jumped).toBe(false);
        expect(player.y).toBe(PLAYER_GROUND_Y);
        expect(player.velocityY).toBe(0);
        expect(player.isGrounded).toBe(true);
        expect(player.state).toBe(PLAYER_STATE.RUNNING);
    })
})