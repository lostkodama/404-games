import {describe, expect, it, vi} from "vitest";
import {createInput, handleKeyDown, handlePointerDown, resetInput, triggerAction} from "./input.ts";
import {GAME_STATE, type GameAction, type InputState} from "../types.ts";

// intentionally skipped bindInput test (browser dependent code)

describe("createInput", () => {
    it("creates a new input with no action pressed", () => {
        expect(createInput()).toEqual({
            jumpPressed: false, restartPressed: false
        } as InputState)
    })
})

describe("triggerAction", () => {
    it("sets jump input when jump is triggered", () => {
        const input = createInput()
        const action: GameAction = 'jump'

        triggerAction(input, action)
        expect(input.jumpPressed).toBe(true)
        expect(input.restartPressed).toBe(false)
    })

    it("sets restart input when restart is triggered", () => {
        const input = createInput()
        const action: GameAction = 'restart'

        triggerAction(input, action)
        expect(input.jumpPressed).toBe(false)
        expect(input.restartPressed).toBe(true)
    })
})

describe("resetInput", () => {
    it("clears pending input actions", () => {
        const input = {
            jumpPressed: true,
            restartPressed: true,
        };

        resetInput(input);

        expect(input).toEqual({
            jumpPressed: false,
            restartPressed: false,
        });
    });
});

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
