import {Error404GameElement, registerError404Game} from '404-games/web-component';

registerError404Game();
const element = document.createElement('error-404-game') as Error404GameElement;
element.pause();
element.resume();
element.restart();
