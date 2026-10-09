import {describe, expect, it, vi} from "vitest";
import {handleKeyDown, handlePointerDown} from "./browserInput.ts";
import {GAME_STATE} from "../types.ts";

// Listener binding requires browser integration coverage.

describe("handleKeyDown", () => {
    it.each(['Space', 'ArrowUp'])("triggers jump when %s is pressed during gameplay", (code) => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            code,
            repeat: false,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(actions, GAME_STATE.RUNNING, event,)

        expect(actions.onJump).toHaveBeenCalledOnce()
        expect(actions.onRestart).not.toHaveBeenCalled()
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("triggers restart instead of jump during game over", () => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            code: 'Space',
            repeat: false,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(actions, GAME_STATE.GAME_OVER, event,)

        expect(actions.onJump).not.toHaveBeenCalled()
        expect(actions.onRestart).toHaveBeenCalledOnce()
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("ignores repeated keydown events", () => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            code: 'Space',
            repeat: true,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(actions, GAME_STATE.GAME_OVER, event,)

        expect(actions.onJump).not.toHaveBeenCalled()
        expect(actions.onRestart).not.toHaveBeenCalled()
        expect(event.preventDefault).not.toHaveBeenCalledOnce()
    })

    it("ignores unsupported keys", () => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            code: 'Esc',
            repeat: false,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(actions, GAME_STATE.GAME_OVER, event,)
        expect(actions.onJump).not.toHaveBeenCalled()
        expect(actions.onRestart).not.toHaveBeenCalled()
        expect(event.preventDefault).not.toHaveBeenCalledOnce()
    })
})

describe("handlePointerDown", () => {
    it("triggers jump during gameplay", () => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            preventDefault: vi.fn(),
        } as unknown as PointerEvent;

        handlePointerDown(actions, GAME_STATE.RUNNING, event,)

        expect(actions.onJump).toHaveBeenCalledOnce()
        expect(actions.onRestart).not.toHaveBeenCalled()
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("triggers restart instead of jump during game over", () => {
        const actions = {onJump: vi.fn(), onRestart: vi.fn()}

        const event = {
            preventDefault: vi.fn(),
        } as unknown as PointerEvent;

        handlePointerDown(actions, GAME_STATE.GAME_OVER, event,)

        expect(actions.onJump).not.toHaveBeenCalled()
        expect(actions.onRestart).toHaveBeenCalledOnce()
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })
})
