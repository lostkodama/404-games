import {useRef, useState} from 'react';
import {Error404Game, type Error404GameHandle} from '../react';

export function ReactDemo() {
    const gameRef = useRef<Error404GameHandle>(null);
    const [accentColor, setAccentColor] = useState('#414141');

    return (
        <main>
            <h1>Error 404 Game — React</h1>
            <Error404Game ref={gameRef} accentColor={accentColor} className="react-game" />
            <div className="react-controls" role="group" aria-label="Game controls">
                <button type="button" onClick={() => gameRef.current?.pause()}>Pause</button>
                <button type="button" onClick={() => gameRef.current?.resume()}>Resume</button>
                <button type="button" onClick={() => gameRef.current?.restart()}>Restart</button>
            </div>
            <label>
                Accent color{' '}
                <select value={accentColor} onChange={(event) => setAccentColor(event.target.value)}>
                    <option value="#414141">Charcoal</option>
                    <option value="#00448c">Blue</option>
                    <option value="#8b2f4c">Rose</option>
                </select>
            </label>
            <p>Changing the accent starts a new run.</p>
            <a href="/">Web Component demo</a>
        </main>
    );
}
