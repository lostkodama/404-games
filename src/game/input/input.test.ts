import {describe, expect, it} from "vitest";
import {createInput, resetInput, triggerAction} from "./input.ts";
import type {GameAction, InputState} from "../types.ts";

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
