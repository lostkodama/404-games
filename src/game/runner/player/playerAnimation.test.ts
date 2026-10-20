import {describe, expect, it} from 'vitest';
import {type Player, PLAYER_STATE} from "../types.ts";
import {createPlayer} from "./player.ts";
import {
    FALL_FRAME,
    HIT_AIRBORNE_FRAME,
    HIT_GROUND_FRAME,
    IDLE_FRAME,
    JUMP_FRAME,
    RUN_FRAME_DURATION,
    RUN_FRAMES
} from "../constants.ts";
import {updatePlayerAnimation} from "./playerAnimation.ts";

function createRunningPlayer(): Player {
    const player = createPlayer();
    player.state = PLAYER_STATE.RUNNING;
    player.previousState = PLAYER_STATE.RUNNING;
    return player;
}

describe('updatePlayerAnimation', () => {

    it.each([
        [PLAYER_STATE.IDLE, IDLE_FRAME],
        [PLAYER_STATE.JUMPING, JUMP_FRAME],
        [PLAYER_STATE.FALLING, FALL_FRAME],
    ] as const)(
        'selects the correct frame for %s without advancing animation',
        (state, expectedFrame) => {
            const player = createPlayer();
            player.state = state;
            player.previousState = state;
            player.frame = -1;
            player.animationTime = 0.02;
            player.animationFrameIndex = 3;

            updatePlayerAnimation(player, RUN_FRAME_DURATION);

            expect(player.frame).toBe(expectedFrame);
            expect(player.animationTime).toBe(0.02);
            expect(player.animationFrameIndex).toBe(3);
        })

    it.each([
        ['airborne', HIT_AIRBORNE_FRAME],
        ['ground', HIT_GROUND_FRAME],
        [null, HIT_GROUND_FRAME]] as const)(
        'selects the hit frame for pose %s',
        (hitPose, expectedFrame) => {

            const player = createPlayer();
            player.state = PLAYER_STATE.HIT
            player.previousState = PLAYER_STATE.HIT
            player.hitPose = hitPose;
            player.animationTime = 0.02;
            player.animationFrameIndex = 3;

            updatePlayerAnimation(player, RUN_FRAME_DURATION);

            expect(player.frame).toBe(expectedFrame);
            expect(player.animationTime).toBe(0.02);
            expect(player.animationFrameIndex).toBe(3);
        })

    it('resets animation time and records a change to jumping', () => {
        const player = createPlayer();
        player.state = PLAYER_STATE.JUMPING
        player.previousState = PLAYER_STATE.RUNNING
        player.animationFrameIndex = 3;


        updatePlayerAnimation(player, RUN_FRAME_DURATION);
        expect(player.animationTime).toBe(0);
        expect(player.previousState).toBe(PLAYER_STATE.JUMPING);
        expect(player.frame).toBe(JUMP_FRAME);
        expect(player.animationFrameIndex).toBe(3);
    })

    it('resets elapsed time when entering running and retains the frame index', () => {
        const player = createPlayer();
        player.state = PLAYER_STATE.RUNNING;
        player.previousState = PLAYER_STATE.FALLING;
        player.animationTime = RUN_FRAME_DURATION * 0.9;
        player.animationFrameIndex = 3;

        const deltaTime = RUN_FRAME_DURATION / 4;

        updatePlayerAnimation(player, deltaTime);

        expect(player.previousState).toBe(PLAYER_STATE.RUNNING);
        expect(player.animationTime).toBeCloseTo(deltaTime, 10);
        expect(player.animationFrameIndex).toBe(3);
        expect(player.frame).toBe(RUN_FRAMES[3]);
    });

    it('accumulates time without advancing before a full frame duration', () => {
        const player = createRunningPlayer();
        player.animationTime = RUN_FRAME_DURATION / 4;
        player.animationFrameIndex = 2;

        updatePlayerAnimation(player, RUN_FRAME_DURATION / 4);

        expect(player.animationTime).toBeCloseTo(
            RUN_FRAME_DURATION / 2,
            10,
        );
        expect(player.animationFrameIndex).toBe(2);
        expect(player.frame).toBe(RUN_FRAMES[2]);
    });

    it('advances at exactly one frame duration', () => {
        const player = createRunningPlayer();

        updatePlayerAnimation(player, RUN_FRAME_DURATION);

        expect(player.animationFrameIndex).toBe(1);
        expect(player.frame).toBe(RUN_FRAMES[1]);
        expect(player.animationTime).toBeCloseTo(0, 10);
    });

    it('advances multiple frames and preserves leftover time', () => {
        const player = createRunningPlayer();

        updatePlayerAnimation(player, RUN_FRAME_DURATION * 3.5);

        expect(player.animationFrameIndex).toBe(3);
        expect(player.frame).toBe(RUN_FRAMES[3]);
        expect(player.animationTime).toBeCloseTo(
            RUN_FRAME_DURATION / 2,
            10,
        );
    });

    it('wraps from the last running frame to the first', () => {
        const player = createRunningPlayer();
        player.animationFrameIndex = RUN_FRAMES.length - 1;

        updatePlayerAnimation(player, RUN_FRAME_DURATION);

        expect(player.animationFrameIndex).toBe(0);
        expect(player.frame).toBe(RUN_FRAMES[0]);
        expect(player.animationTime).toBeCloseTo(0, 10);
    });

    it('accumulates elapsed time across successive updates', () => {
        const player = createRunningPlayer();

        updatePlayerAnimation(player, RUN_FRAME_DURATION * 0.75);

        expect(player.animationFrameIndex).toBe(0);

        updatePlayerAnimation(player, RUN_FRAME_DURATION * 0.75);

        expect(player.animationFrameIndex).toBe(1);
        expect(player.frame).toBe(RUN_FRAMES[1]);
        expect(player.animationTime).toBeCloseTo(
            RUN_FRAME_DURATION / 2,
            10,
        );
    });
})