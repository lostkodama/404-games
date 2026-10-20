import {defineConfig} from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist-demo',
        rolldownOptions: {
            input: ['index.html', 'react.html'],
        },
    },
});
