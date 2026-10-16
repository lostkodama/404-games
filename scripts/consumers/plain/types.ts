import {create404Game, type GameOptions, type GameController} from '404-games';

const options: GameOptions = {container: document.createElement('div')};
const game: GameController = create404Game(options);
game.pause();
game.resume();
game.restart();
game.destroy();
