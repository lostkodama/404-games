# Error 404 Game Library

A small runner game for 404 pages, available as a framework-independent JavaScript API,
a Web Component, or a thin React component.

## Installation

```sh
npm install 404-games
```

`404-games` is the intended package name. npm publication is pending, and the name may
change before release.

The package is ESM-only and includes TypeScript declarations. The examples below assume
an ESM-aware app/bundler, such as Vite. React 19 is required only for `404-games/react`;
the base API and Web Component do not require React.

## Quick Start

### Vanilla JavaScript / TypeScript

Add a container to your page:

```html
<div id="game" style="max-width: 900px"></div>
```

Run this after the container exists:

```ts
import {create404Game} from '404-games';

const container = document.getElementById('game');
if (!container) throw new Error('Game container not found');

const game = create404Game({
  container,
  accentColor: '#ff0000',
});
```

The game starts automatically. Keep the returned controller to manage its lifecycle:

```ts
game.pause();
game.resume();
game.restart();

// When the game is no longer needed:
game.destroy();
```

### Web Component

```html
<error-404-game accent-color="#414141"></error-404-game>
```

Register explicitly in your app's browser entry:

```ts
import {
  registerError404Game,
  type Error404GameElement,
} from '404-games/web-component';

registerError404Game();

const game = document.querySelector<Error404GameElement>('error-404-game');
game?.pause();
game?.resume();
game?.restart();
```

Importing the entry does not register the element. Registration is safe to repeat.
Connection automatically creates a game; removal destroys it; reconnection creates a
fresh game. There is no Shadow DOM.

Changing `accent-color` while connected recreates the game and starts a fresh run.
Removing the attribute restores the library default. Changes while disconnected take
effect on the next connection. Empty or blank values are rejected.

The element has no `destroy()` method: remove it from the DOM to clean up.

### React

```tsx
import {useRef} from 'react';
import {Error404Game, type Error404GameHandle} from '404-games/react';

export function Game() {
  const gameRef = useRef<Error404GameHandle>(null);

  return (
    <section>
      <Error404Game
        ref={gameRef}
        accentColor="#414141"
        className="game"
        style={{maxWidth: 900}}
      />
      <button onClick={() => gameRef.current?.pause()}>Pause</button>
      <button onClick={() => gameRef.current?.resume()}>Resume</button>
      <button onClick={() => gameRef.current?.restart()}>Restart</button>
    </section>
  );
}
```

The component owns its container and cleans up on unmount. Changing `accentColor`
destroys the previous game and creates a fresh one; omitting it uses the library default.
React Strict Mode is supported. The ref exposes controls only, with no `destroy()` method.

## API Reference

### `create404Game(options): GameController`

Exported from `404-games`, along with the `GameOptions` and `GameController` types.
Creates and attaches a canvas to the supplied container, starts the game, and returns
its controller. The caller owns the container; the library owns and removes its canvas.

```ts
type GameOptions = {
  container: HTMLElement;
  accentColor?: string;
};

type GameController = {
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
};
```

`container` must be a real HTMLElement. `accentColor` is optional; an empty or blank
value throws. Omit it to use the library default.

| Method | Behavior |
| --- | --- |
| `pause()` | Manually pauses the game. Switching tabs does not clear a manual pause. |
| `resume()` | Resumes a manually paused game. |
| `restart()` | Resets the run and resumes it. |
| `destroy()` | Permanently ends the instance, cleans up owned resources, and removes its canvas. |

Repeated destruction and lifecycle calls after destruction are safe no-ops.

### Web Component API

`404-games/web-component` exports `Error404GameElement` and `registerError404Game()`.

| Attribute / method | Behavior |
| --- | --- |
| `accent-color` | Optional; maps directly to `accentColor`. A changed value recreates the connected game. |
| `pause()` | Pauses the active game. |
| `resume()` | Resumes the active game. |
| `restart()` | Resets and resumes the active game. |

Control calls safely do nothing when no game exists. DOM removal owns destruction.

### React API

`404-games/react` exports `Error404Game`, `Error404GameProps`, and `Error404GameHandle`.

```ts
import type {CSSProperties} from 'react';

type Error404GameProps = {
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
};

type Error404GameHandle = {
  pause(): void;
  resume(): void;
  restart(): void;
};
```

`className` and `style` apply to the wrapper div. Styling changes do not recreate the
game. Arbitrary DOM props are not forwarded. Handle methods target the current game
and safely do nothing when no active game exists.

## Assets

Sprites and audio ship with the package. Your app's bundler resolves and emits them
automatically, including when the app is served below the site root. Do not copy assets
into a public folder or supply manual asset paths. No asset-path configuration is needed.

## Browser Support

Designed for modern browsers with Canvas 2D, Pointer Events, ResizeObserver, and Web
Components when using the custom element. Gameplay runs in the browser; import and
register the Web Component in a browser environment.
