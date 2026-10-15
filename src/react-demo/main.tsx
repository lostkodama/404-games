import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactDemo} from './ReactDemo';
import './style.css';

void document.fonts.load('700 32px "Space Grotesk"').catch(() => {});

const container = document.getElementById('react-demo');
if (!container) throw new Error('React demo container not found');

const root = createRoot(container);
root.render(<StrictMode><ReactDemo /></StrictMode>);

if (import.meta.hot) {
    import.meta.hot.dispose(() => root.unmount());
}
