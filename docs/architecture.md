# Architecture

The library exposes framework-independent TypeScript game logic through `create404Game()`.
Web Component and React integrations are separate, thin adapters over that public API.

```text
Web Component ──┐
               ├──→ create404Game() → browser runtime → runner session
React wrapper ─┘                                       ├→ core gameplay
                                                      └→ rendering and loop
```

Neither the base API nor the Web Component depends on React. The React wrapper calls
the factory directly; it does not wrap the Web Component.

## Public package boundaries

| Entry | Responsibility |
| --- | --- |
| `404-games` | `create404Game`, `GameOptions`, and `GameController` |
| `404-games/web-component` | Custom element class and explicit registration helper |
| `404-games/react` | React component, props, and imperative handle types |

The `package.json` exports map defines these supported paths. Internal modules and shared
build chunks are implementation details, not public API. See the [README](../README.md)
for consumer usage.

## Main responsibilities

| Area | Responsibility |
| --- | --- |
| `src/public` | Public types, option validation, defaults, factory, and canvas lifecycle. |
| `src/browser` | Browser runtime composition: canvas context, input bindings, resize/DPR observation, audio, and game-session cleanup. |
| `src/game/runner` | Current runner's state, gameplay rules, session orchestration, and rendering. Browser-facing input and loop helpers also live here, separate from pure gameplay updates. |
| `src/web-component` | Custom Element adapter around the public factory. |
| `src/react` | React adapter around the public factory. |

## Runtime lifecycle

```text
create404Game(options)
  → validate options and resolve defaults
  → create and attach an owned canvas
  → create the browser runtime and start the game automatically
  → return GameController
```

The controller provides `pause()`, `resume()`, `restart()`, and `destroy()`.
Restart resets and resumes the run. Destruction permanently ends the instance: the runtime
disposes browser resources and stops the session, and the public factory removes its canvas.
The host retains ownership of the supplied container. Repeated destruction and calls after
destruction are safe no-ops. Failed initialization rolls back acquired resources.

## Browser and gameplay separation

Keyboard/pointer/touch translation, requestAnimationFrame, document visibility,
ResizeObserver, DPR observation, and concrete audio belong to browser integration.
They are kept outside pure gameplay rules so state updates can remain independent of DOM
availability, browser timing, and framework lifecycles.

Browser input emits callbacks/actions; the game session owns mutable game/input state.
The session coordinates update/render flow and delegates scheduling to its loop controller.
Resize and DPR changes can redraw the current state without advancing simulation. Manual
pause and browser visibility suspension remain separate.

## Adapter ownership

- **Web Component:** explicit registration; DOM connection creates a game, disconnection
  destroys it, and reconnection creates a fresh instance. No Shadow DOM is used.
- **React:** an effect owns creation and cleanup, including destruction on unmount.
  Its ref exposes only pause/resume/restart. It owns a normal div container.

Both adapters map accent configuration to the factory. Changing the accent recreates the
game; defaults and validation stay with `create404Game()`.

## Packaging

The package is ESM-only, with separate main, Web Component, and React entries and TypeScript
declarations. React stays external as an optional peer dependency, required by React
consumers only. Sprites and audio ship as package assets with module-relative URLs; consumers
do not copy them manually. Library and demo builds have separate outputs.

## Multiple games direction

The current implementation lives under `src/game/runner`. This structure allows future
games to live alongside runner while retaining the public package boundary. A public API
for selecting games is intentionally **not decided yet**.

## Design principles

- Keep the public API small and the base framework-independent.
- Make lifecycle/resource ownership explicit.
- Isolate browser behavior from pure gameplay logic.
- Keep internal modules private and adapters thin.
- Let consumers use the package without knowing its internal structure.
