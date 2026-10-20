import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm, stat, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';
import {build} from 'vite';
import {JSDOM} from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await realpath(await mkdtemp(path.join(tmpdir(), '404-games-consumers-')));
const artifacts = path.join(temporary, 'artifacts');
const execute = promisify(execFile);

async function npm(args, cwd) {
    const cli = process.env.npm_execpath;
    try {
        return await execute(cli ? process.execPath : 'npm', cli ? [cli, ...args] : args, {
            cwd,
            env: {...process.env, npm_config_cache: path.join(temporary, 'npm-cache'), npm_config_offline: 'true'},
            maxBuffer: 10 * 1024 * 1024,
        });
    } catch (error) {
        throw new Error(`npm ${args[0]} failed:\n${error.stdout}\n${error.stderr}`, {cause: error});
    }
}

async function pack(directory) {
    const {stdout} = await npm(['pack', directory, '--pack-destination', artifacts, '--json', '--ignore-scripts', '--offline'], root);
    const metadata = JSON.parse(stdout)[0];
    return {...metadata, tarball: path.join(artifacts, metadata.filename)};
}

async function consumer(name, tarballs, fixtures) {
    const directory = path.join(temporary, name);
    await mkdir(directory);
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({name, private: true, type: 'module'}));
    for (const fixture of fixtures) {
        await cp(path.join(root, 'scripts/consumers', fixture), path.join(directory, fixture), {recursive: true});
    }
    await npm(['install', ...tarballs, '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false'], directory);
    return directory;
}

function typecheck(directory, files) {
    for (const moduleResolution of [ts.ModuleResolutionKind.NodeNext, ts.ModuleResolutionKind.Bundler]) {
        const program = ts.createProgram(files.map((file) => path.join(directory, file)), {
            noEmit: true, strict: true, skipLibCheck: false, types: [], target: ts.ScriptTarget.ES2023,
            module: moduleResolution === ts.ModuleResolutionKind.NodeNext ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext,
            moduleResolution, jsx: ts.JsxEmit.ReactJSX,
        });
        const diagnostics = ts.getPreEmitDiagnostics(program);
        assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCurrentDirectory: () => directory, getCanonicalFileName: (file) => file, getNewLine: () => '\n',
        }));
    }
}

async function bundle(directory, fixture, media) {
    const result = await build({
        configFile: false, root: directory, publicDir: false, base: '/consumer/app/', logLevel: 'error',
        build: {
            write: false, minify: false, sourcemap: true, assetsInlineLimit: 0,
            rolldownOptions: {input: path.join(directory, fixture, 'index.js'), preserveEntrySignatures: 'strict'},
        },
    });
    const output = [result].flat().flatMap((item) => item.output);
    const assets = output.filter((item) => item.type === 'asset' && /\.(png|wav)$/.test(item.fileName));
    assert.equal(assets.length, 6, `${fixture}: consumer build lost assets`);
    for (const content of media) {
        assert(assets.some((asset) => Buffer.from(asset.source).equals(content)), `${fixture}: missing media bytes`);
    }
    const chunks = output.filter((item) => item.type === 'chunk');
    const code = chunks.map((item) => item.code).join('\n');
    for (const asset of assets) assert(code.includes(`/consumer/app/${asset.fileName}`), `${fixture}: broken nested-site asset URL`);
    if (fixture === 'react') {
        const reactSources = chunks.flatMap((chunk) => chunk.map?.sources ?? []).filter((source) => /node_modules\/react\//.test(source));
        assert(reactSources.length > 0, 'Consumer must supply React to its own bundle');
        assert(!reactSources.some((source) => /404-games\/node_modules\//.test(source)), 'Nested library-owned React copy');
    }
}

function browser() {
    const dom = new JSDOM('<!doctype html><body></body>', {url: 'https://consumer.test/nested/'});
    const {window} = dom;
    const requested = [];
    const audios = [];
    const frames = new Set();
    const observers = new Set();
    const dprListeners = new Set();
    let frameId = 0;
    window.HTMLCanvasElement.prototype.getContext = () => ({});
    window.requestAnimationFrame = () => { frames.add(++frameId); return frameId; };
    window.cancelAnimationFrame = (id) => frames.delete(id);
    window.ResizeObserver = class {
        observe() { observers.add(this); }
        disconnect() { observers.delete(this); }
    };
    window.matchMedia = () => ({
        addEventListener(_name, listener) { dprListeners.add(listener); },
        removeEventListener(_name, listener) { dprListeners.delete(listener); },
    });
    const globals = {
        document: window.document, HTMLElement: window.HTMLElement, customElements: window.customElements,
        Image: class {
            set src(value) { requested.push(value); }
        },
        Audio: class {
            constructor(src) { requested.push(src); audios.push(this); }
            pause() { this.paused = true; }
            removeAttribute(name) { assert.equal(name, 'src'); this.released = true; }
            load() { this.loaded = true; }
            play() { return Promise.resolve(); }
        },
    };
    const previous = Object.fromEntries(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, {value, configurable: true});
    return {
        window, requested,
        assertClean() {
            assert.equal(frames.size, 0);
            assert.equal(observers.size, 0);
            assert.equal(dprListeners.size, 0);
            for (const audio of audios) assert(audio.paused && audio.released && audio.loaded, 'Audio was not released');
            const key = new window.KeyboardEvent('keydown', {code: 'Space', cancelable: true});
            window.dispatchEvent(key);
            assert(!key.defaultPrevented, 'Keyboard listener survived destruction');
        },
        close() {
            dom.window.close();
            for (const [key, descriptor] of Object.entries(previous)) {
                if (descriptor) Object.defineProperty(globalThis, key, descriptor);
                else delete globalThis[key];
            }
        },
    };
}

try {
    await mkdir(artifacts);
    const packed = await pack(root);
    const paths = packed.files.map((file) => file.path);
    assert(paths.every((file) => file === 'package.json'
        || /^(?:README|LICENSE|LICENCE|NOTICE)(?:\.[^/]+)?$/i.test(file)
        || /^dist\/(?:[^/]+\.js(?:\.map)?|types\/.+\.d\.ts(?:\.map)?|assets\/[^/]+\.(?:png|wav))$/.test(file)),
    'Development or unexpected files shipped');
    assert(!paths.some((file) => /(?:\.html$|\.cjs$|\.test\.|react-demo|node_modules|vite\.config)/.test(file)), 'Unwanted package contents');
    for (const file of ['dist/index.js', 'dist/web-component.js', 'dist/react.js',
        'dist/types/public/index.d.ts', 'dist/types/web-component/index.d.ts', 'dist/types/react/index.d.ts']) {
        assert(paths.includes(file), `Missing packed entry: ${file}`);
    }
    assert.equal(paths.filter((file) => /\.(png|wav)$/.test(file)).length, 6);
    console.log('Packed publishable artifact; verified public files and six media assets.');

    const plain = await consumer('plain-consumer', [packed.tarball], ['plain', 'web-component']);
    const installed = path.join(plain, 'node_modules/404-games');
    const requirePlain = createRequire(path.join(plain, 'package.json'));
    assert.throws(() => requirePlain.resolve('react'), {code: 'MODULE_NOT_FOUND'});
    assert.throws(() => requirePlain.resolve('react-dom'), {code: 'MODULE_NOT_FOUND'});
    const installedPackage = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
    assert.equal(installedPackage.type, 'module');
    assert.deepEqual(Object.keys(installedPackage.exports).sort(), ['.', './react', './web-component']);
    const media = [];
    for (const file of packed.files) {
        const location = path.join(installed, file.path);
        assert.equal((await stat(location)).size, file.size, `Packed file not installed intact: ${file.path}`);
        if (/\.(png|wav)$/.test(file.path)) media.push(await readFile(location));
        if (file.path.endsWith('.js')) {
            const code = await readFile(location, 'utf8');
            assert(!code.includes('import.meta.hot'), 'HMR shipped');
            const mapUrl = code.match(/\/\/# sourceMappingURL=([^\s]+)/)?.[1];
            assert(mapUrl, `Missing source map: ${file.path}`);
            const map = JSON.parse(await readFile(path.resolve(path.dirname(location), mapUrl), 'utf8'));
            assert.equal(map.version, 3);
            assert(!map.sources.some((source) => /node_modules\/react(?:-dom)?\//.test(source)), 'Library bundled React');
            assert(!map.sources.some((source) => /src\/(?:main\.ts|react-demo\/)|\.test\./.test(source)), 'Demo/tests bundled into packed JavaScript');
        }
    }
    typecheck(plain, ['plain/types.ts', 'web-component/types.ts']);
    const environment = browser();
    try {
        const main = await import(pathToFileURL(path.join(plain, 'plain/index.js')));
        const container = environment.window.document.createElement('div');
        environment.window.document.body.appendChild(container);
        const game = main.mount(container);
        assert.deepEqual(Object.keys(game).sort(), ['destroy', 'pause', 'restart', 'resume']);
        assert.equal(container.querySelectorAll('canvas').length, 1);
        game.pause(); game.resume(); game.restart(); game.destroy(); game.destroy();
        game.pause(); game.resume(); game.restart();
        assert.equal(container.querySelectorAll('canvas').length, 0);
        environment.assertClean();

        const web = await import(pathToFileURL(path.join(plain, 'web-component/index.js')));
        assert.equal(environment.window.customElements.get('error-404-game'), undefined);
        web.registerError404Game(); web.registerError404Game();
        assert.equal(environment.window.customElements.get('error-404-game'), web.Error404GameElement);
        const element = web.mount();
        assert(element instanceof web.Error404GameElement);
        assert.equal(element.querySelectorAll('canvas').length, 1);
        element.pause(); element.resume(); element.restart(); element.remove();
        assert.equal(element.querySelectorAll('canvas').length, 0);
        environment.window.document.body.appendChild(element);
        assert.equal(element.querySelectorAll('canvas').length, 1);
        element.remove();
        environment.assertClean();

        const requested = new Set(environment.requested);
        assert.equal(requested.size, 6, 'Runtime did not request all packaged media');
        for (const url of requested) {
            const filename = fileURLToPath(url);
            assert(path.relative(path.join(installed, 'dist/assets'), filename).split(path.sep).length === 1, 'Asset escaped installed package');
            const bytes = await readFile(filename);
            assert(media.some((content) => content.equals(bytes)), 'Runtime asset missing from packed artifact');
        }
    } finally {
        environment.close();
    }
    const resolverPath = path.join(plain, 'boundaries.mjs');
    await writeFile(resolverPath, `export const load = (specifier) => import(specifier);`);
    const resolver = await import(pathToFileURL(resolverPath));
    for (const internal of ['core', 'browser', 'game', 'audio', 'renderer', 'game/Game',
        'dist/index.js', 'dist/types/game/types.d.ts', 'src/public/index.ts']) {
        await assert.rejects(resolver.load(`404-games/${internal}`), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
    }
    await bundle(plain, 'plain', media);
    await bundle(plain, 'web-component', media);
    console.log('Plain JS/TS and Web Component consumers passed without React; assets and private boundaries verified.');

    // Pack locked local development dependencies instead of fetching floating registry versions.
    const peers = [];
    for (const dependency of ['react', '@types/react', 'csstype']) {
        peers.push((await pack(path.join(root, 'node_modules', dependency))).tarball);
    }
    const react = await consumer('react-consumer', [packed.tarball, ...peers], ['react']);
    typecheck(react, ['react/types.tsx']);
    const reactConsumer = await import(pathToFileURL(path.join(react, 'react/index.js')));
    const element = reactConsumer.example();
    assert.equal(element.type, reactConsumer.Error404Game);
    assert.equal(element.props.accentColor, '#123456');
    const requireReact = createRequire(path.join(react, 'package.json'));
    const requireWrapper = createRequire(path.join(react, 'node_modules/404-games/dist/react.js'));
    assert.equal(requireWrapper.resolve('react'), requireReact.resolve('react'), 'Wrapper resolves a different React copy');
    assert.throws(() => requireReact.resolve('react-dom'), {code: 'MODULE_NOT_FOUND'});
    assert(!(await readdir(path.join(react, 'node_modules/404-games'))).includes('node_modules'), 'Library installed nested dependencies');
    const libraryReactCode = await readFile(path.join(react, 'node_modules/404-games/dist/react.js'), 'utf8');
    assert(/from ["']react["']/.test(libraryReactCode), 'React is not external in installed library');
    await bundle(react, 'react', media);
    console.log('React JS/TS consumer passed with its own React; all three installed-package builds passed.');
} finally {
    await rm(temporary, {recursive: true, force: true});
}
