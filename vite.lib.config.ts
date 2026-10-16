import {defineConfig} from 'vite';

export default defineConfig({
    plugins: [{
        name: 'facade-source-maps',
        generateBundle(_options, bundle) {
            // Generated re-export facades have no original code to map, so Vite omits their maps.
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk' || chunk.map) continue;
                const mapFile = `${chunk.fileName}.map`;
                this.emitFile({
                    type: 'asset',
                    fileName: mapFile,
                    source: JSON.stringify({version: 3, file: chunk.fileName, sources: [], names: [], mappings: ''}),
                });
                chunk.code += `\n//# sourceMappingURL=${mapFile.split('/').at(-1)}\n`;
            }
        },
    }],
    build: {
        outDir: 'dist',
        copyPublicDir: false,
        minify: false,
        sourcemap: true,
        lib: {
            entry: {
                index: 'src/public/index.ts',
                'web-component': 'src/web-component/index.ts',
                react: 'src/react/index.ts',
            },
            formats: ['es'],
            fileName: (_format, entryName) => `${entryName}.js`,
        },
        rolldownOptions: {
            external: (id) => id === 'react' || id.startsWith('react/'),
        },
    },
});
