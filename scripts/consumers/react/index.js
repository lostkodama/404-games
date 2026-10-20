import {createElement, createRef} from 'react';
import {Error404Game} from '404-games/react';

export {Error404Game};

export function example() {
    return createElement(Error404Game, {ref: createRef(), accentColor: '#123456'});
}
