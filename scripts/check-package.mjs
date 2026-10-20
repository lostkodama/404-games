import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
import {build} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.type, 'module');
assert.deepEqual(Object.keys(pkg.exports).sort(), ['.', './react', './web-component']);
assert(pkg.peerDependencies.react);
assert(!pkg.peerDependencies['react-dom']);

const files = await readdir(dist, {recursive: true});
assert(!files.some((file) => /(?:\.html$|\.cjs$|\.test\.|react-demo|^main\.)/.test(file)), 'Demo/test/CommonJS artifacts found');
const imports = new Map();
const assetReferences = [];
for (const file of files.filter((file) => file.endsWith('.js'))) {
    const filename = path.join(dist, file);
    const code = await readFile(filename, 'utf8');
    const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const dependencies = [];
    function visit(node) {
        if (ts.isStringLiteral(node)) {
            assert(!/^\/(?:sprites|audio)(?:\/|$)/.test(node.text), `Root-relative asset URL in ${file}`);
            assert(!/^data:(?:image|audio)\//.test(node.text), `Inlined media in ${file}`);
        }
        if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL'
            && node.arguments?.length === 2 && ts.isStringLiteral(node.arguments[0])
            && node.arguments[1].getText(source) === 'import.meta.url') {
            assetReferences.push({file, url: node.arguments[0].text});
        }
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
            dependencies.push(node.moduleSpecifier.text);
        }
        if (ts.isCallExpression(node)) {
            assert(!(ts.isIdentifier(node.expression) && node.expression.text === 'require'), `CommonJS in ${file}`);
            if (node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
                dependencies.push(node.arguments[0].text);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    imports.set(filename, dependencies);
    assert(!code.includes('import.meta.hot'), `HMR code in ${file}`);
    const mapUrl = code.match(/\/\/# sourceMappingURL=([^\s]+)/)?.[1];
    assert(mapUrl, `Missing source map reference for ${file}`);
    const map = JSON.parse(await readFile(path.resolve(path.dirname(filename), mapUrl), 'utf8'));
    assert.equal(map.version, 3);
    assert(!map.sources.some((source) => /node_modules\/(?:react|react-dom)(?:\/|$)/.test(source)), 'React bundled into output');
    assert(!map.sources.some((source) => /src\/(?:main\.ts|react-demo\/)|\.test\./.test(source)), 'Demo/tests bundled into output');
}

const requiredAssets = [
    'src/game/runner/render/assets/car.png',
    'src/game/runner/render/assets/cat-run-jump.png',
    'src/audio/assets/start.wav',
    'src/audio/assets/jump.wav',
    'src/audio/assets/game-over.wav',
    'src/audio/assets/level-up.wav',
];
assert(pkg.files.includes('dist'), 'Package must include emitted assets');
const referencedAssets = new Set();
for (const {file, url} of assetReferences) {
    assert(!/^(?:\/|[a-z]+:)/i.test(url), `Asset is not module-relative: ${url}`);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), url));
    assert(resolved.startsWith('assets/'), `Asset escapes package assets: ${url}`);
    await access(path.join(dist, resolved));
    referencedAssets.add(resolved);
    const deployed = new URL(url, `https://example.test/nested/package/${file}`);
    assert(deployed.pathname.startsWith('/nested/package/assets/'), 'Asset depends on site root');
}
assert.equal(referencedAssets.size, requiredAssets.length, 'Missing or unreferenced media assets');
const emittedContents = await Promise.all([...referencedAssets].map((asset) => readFile(path.join(dist, asset))));
for (const asset of requiredAssets) {
    const source = await readFile(path.join(root, asset));
    assert(emittedContents.some((content) => content.equals(source)), `Asset missing or altered: ${asset}`);
}

// Rebundle the actual distributed entries as a nested-site consumer, without copying assets.
const consumerId = '\0asset-consumer';
const consumerBuild = await build({
    configFile: false,
    root,
    base: '/nested/app/',
    publicDir: false,
    logLevel: 'error',
    plugins: [{
        name: 'asset-consumer',
        resolveId(id) { if (id === 'virtual:asset-consumer') return consumerId; },
        load(id) {
            if (id === consumerId) return `
                export {create404Game} from '404-games';
                export {Error404GameElement, registerError404Game} from '404-games/web-component';
                export {Error404Game} from '404-games/react';
            `;
        },
    }],
    build: {
        write: false,
        minify: false,
        assetsInlineLimit: 0,
        rolldownOptions: {
            input: 'virtual:asset-consumer',
            preserveEntrySignatures: 'strict',
            external: (id) => id === 'react' || id.startsWith('react/'),
        },
    },
});
const consumerOutput = [consumerBuild].flat().flatMap((bundle) => bundle.output);
const consumerAssets = consumerOutput.filter((item) => item.type === 'asset' && /\.(png|wav)$/.test(item.fileName));
assert.equal(consumerAssets.length, requiredAssets.length, 'Consumer build lost package assets');
const consumerCode = consumerOutput.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n');
for (const asset of consumerAssets) {
    assert(consumerCode.includes(`/nested/app/${asset.fileName}`), `Consumer asset URL not rebased: ${asset.fileName}`);
}

function externalDependencies(filename, visited = new Set()) {
    if (visited.has(filename)) return [];
    visited.add(filename);
    assert(imports.has(filename), `Missing bundled module: ${filename}`);
    return imports.get(filename).flatMap((dependency) => dependency.startsWith('.')
        ? externalDependencies(path.resolve(path.dirname(filename), dependency), visited)
        : [dependency]);
}
for (const [entry, target] of Object.entries(pkg.exports)) {
    assert.deepEqual(Object.keys(target).sort(), ['import', 'types']);
    await access(path.join(root, target.types));
    const dependencies = externalDependencies(path.join(root, target.import));
    if (entry === './react') {
        assert(dependencies.includes('react'), 'React must remain an external import');
    } else {
        assert(!dependencies.some((id) => /^react(?:\/|-dom(?:\/|$)|$)/.test(id)), `${entry} depends on React`);
    }
}

// Resolve the actual package exports, rather than importing implementation files directly.
assert.deepEqual(Object.keys(await import('404-games')), ['create404Game']);
assert.deepEqual(Object.keys(await import('404-games/react')), ['Error404Game']);
for (const internal of ['core', 'browser', 'game', 'audio', 'renderer', 'dist/index.js', 'src/public/index.ts']) {
    await assert.rejects(import(`404-games/${internal}`), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
}
const dom = new JSDOM();
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;
try {
    const web = await import('404-games/web-component');
    assert.deepEqual(Object.keys(web).sort(), ['Error404GameElement', 'registerError404Game']);
    assert.equal(customElements.get('error-404-game'), undefined, 'Import auto-registers the element');
    web.registerError404Game();
    web.registerError404Game();
    assert.equal(customElements.get('error-404-game'), web.Error404GameElement);
} finally {
    dom.window.close();
    delete globalThis.HTMLElement;
    delete globalThis.customElements;
}

// Typecheck a virtual consumer against package exports, including Node-style ESM resolution.
const consumerPath = path.join(root, '__package_consumer__.tsx');
const consumer = `
import {create404Game, type GameOptions, type GameController} from '404-games';
import {Error404GameElement, registerError404Game} from '404-games/web-component';
import {Error404Game, type Error404GameProps, type Error404GameHandle} from '404-games/react';
import {createRef} from 'react';
const options: GameOptions = {container: document.createElement('div')};
const game: GameController = create404Game(options);
game.pause(); game.resume(); game.restart(); game.destroy();
registerError404Game();
const element: Error404GameElement = document.createElement('error-404-game') as Error404GameElement;
element.pause(); element.resume(); element.restart();
const props: Error404GameProps = {accentColor: '#123456', className: 'game', style: {width: '100%'}};
const ref = createRef<Error404GameHandle>();
const component = <Error404Game {...props} ref={ref} />;
ref.current?.pause(); ref.current?.resume(); ref.current?.restart();
`;
for (const moduleResolution of [ts.ModuleResolutionKind.NodeNext, ts.ModuleResolutionKind.Bundler]) {
    const options = {
        noEmit: true, strict: true, skipLibCheck: false, types: [], target: ts.ScriptTarget.ES2023,
        module: moduleResolution === ts.ModuleResolutionKind.NodeNext ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext,
        moduleResolution, jsx: ts.JsxEmit.ReactJSX,
    };
    const host = ts.createCompilerHost(options);
    const originalGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (filename, ...args) => filename === consumerPath
        ? ts.createSourceFile(filename, consumer, options.target, true, ts.ScriptKind.TSX)
        : originalGetSourceFile(filename, ...args);
    const program = ts.createProgram([consumerPath], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: (file) => file,
        getNewLine: () => '\n',
    }));
}

console.log('Package checks passed: ESM exports, declarations, source maps, React isolation, explicit registration, consumer types, and emitted assets through a nested consumer build.');
