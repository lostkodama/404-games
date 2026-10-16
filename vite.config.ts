import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist-demo',
        rolldownOptions: {
            input: ['index.html', 'react.html'],
        },
    },
});
