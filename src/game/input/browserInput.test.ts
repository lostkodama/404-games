import {describe, expect, it, vi} from "vitest";
import {createInput} from "./input.ts";
import {handleKeyDown, handlePointerDown} from "./browserInput.ts";
import {GAME_STATE} from "../types.ts";

// Listener binding requires browser integration coverage.

describe("handleKeyDown", () => {
    it.each(['Space', 'ArrowUp'])("triggers jump when %s is pressed during gameplay", (code) => {
        const input = createInput()

        const event = {
            code,
            repeat: false,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(input, GAME_STATE.RUNNING, event,)

        expect(input.jumpPressed).toEqual(true)
        expect(input.restartPressed).toEqual(false)
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("triggers restart instead of jump during game over", () => {
        const input = createInput()

        const event = {
            code: 'Space',
            repeat: false,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(input, GAME_STATE.GAME_OVER, event,)

        expect(input.jumpPressed).toEqual(false)
        expect(input.restartPressed).toEqual(true)
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("ignores repeated keydown events", () => {
        const input = createInput()

        const event = {
            code: 'Space',
            repeat: true,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(input, GAME_STATE.GAME_OVER, event,)

        expect(input.jumpPressed).toEqual(false)
        expect(input.restartPressed).toEqual(false)
        expect(event.preventDefault).not.toHaveBeenCalledOnce()
    })

    it("ignores unsupported keys", () => {
        const input = createInput()

        const event = {
            code: 'Esc',
            repeat: true,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        handleKeyDown(input, GAME_STATE.GAME_OVER, event,)
        expect(input.jumpPressed).toEqual(false)
        expect(input.restartPressed).toEqual(false)
        expect(event.preventDefault).not.toHaveBeenCalledOnce()
    })
})

describe("handlePointerDown", () => {
    it("triggers jump during gameplay", () => {
        const input = createInput()

        const event = {
            preventDefault: vi.fn(),
        } as unknown as PointerEvent;

        handlePointerDown(input, GAME_STATE.RUNNING, event,)

        expect(input.jumpPressed).toEqual(true)
        expect(input.restartPressed).toEqual(false)
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it("triggers restart instead of jump during game over", () => {
        const input = createInput()

        const event = {
            preventDefault: vi.fn(),
        } as unknown as PointerEvent;

        handlePointerDown(input, GAME_STATE.GAME_OVER, event,)

        expect(input.jumpPressed).toEqual(false)
        expect(input.restartPressed).toEqual(true)
        expect(event.preventDefault).toHaveBeenCalledOnce()
    })
})
