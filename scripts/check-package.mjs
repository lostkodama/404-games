import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {JSDOM} from 'jsdom';

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
for (const file of files.filter((file) => file.endsWith('.js'))) {
    const filename = path.join(dist, file);
    const code = await readFile(filename, 'utf8');
    const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const dependencies = [];
    function visit(node) {
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

console.log('Package checks passed: ESM exports, declarations, source maps, React isolation, explicit registration, and consumer types.');
