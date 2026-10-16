# Library build — Phase 7, Group 1

## Commands

- `npm run build`: Core/application typechecks, library JavaScript/declarations, and package checks.
- `npm run build:lib`: emit the ESM library and declarations to `dist`.
- `npm run check:package`: validate existing library output and public consumer types.
- `npm run build:demo`: build both demo pages to `dist-demo`.
- `npm run dev` / `npm run preview`: run/preview the demos; the React demo is `/react.html`.

## Public entries

| Import | JavaScript | Declarations |
| --- | --- | --- |
| `404-games` | `dist/index.js` | `dist/types/public/index.d.ts` |
| `404-games/web-component` | `dist/web-component.js` | `dist/types/web-component/index.d.ts` |
| `404-games/react` | `dist/react.js` | `dist/types/react/index.d.ts` |

Output is unminified ESM with JavaScript source maps. Vite may generate shared implementation
chunks. TypeScript also emits private declarations for imported implementation modules;
neither those modules nor the shared chunks are supported package entry points. The exports
map permits only the three paths above. No CommonJS output is generated.

The Web Component entry requires a browser environment but does not register on import.
Consumers explicitly call `registerError404Game()`.

React and its subpaths, including `react/jsx-runtime`, remain external. React 19 is an optional
peer dependency and a development dependency: consumers of the React entry must provide it,
while non-React consumers need not install it. ReactDOM remains development/demo-only.

Package checks import the built entries, verify registration behavior and private-path rejection,
inspect JavaScript import graphs/source maps, and compile a typed consumer against package exports
using both NodeNext and bundler module resolution.

## Deferred to Group 2

Asset behavior has not been changed. Vite's library build currently inlines the imported audio
URLs, which makes the shared implementation chunk large. Sprites still use root-relative
`/sprites/...` URLs and are not copied into the library output. Consumer asset delivery and URL
resolution must be completed in Group 2 before the package is ready for external use.

Only `dist` is allowlisted for packaging. Demos/HMR bootstrap code are excluded. The package
remains private; this work does not publish it or finalize release metadata.
