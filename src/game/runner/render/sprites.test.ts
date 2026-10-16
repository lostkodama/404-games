// @vitest-environment jsdom
import {expect, it} from 'vitest';
import {loadSprites} from './sprites';

it('keeps fallback flags until the corresponding packaged image has loaded', () => {
    const assets = loadSprites();
    const car = assets.obstacles.car!;
    expect(assets.catSpriteLoaded).toBe(false);
    expect(car.loaded).toBe(false);
    expect(assets.catSpriteSheet.getAttribute('src')).toBeTruthy();
    expect(car.image.getAttribute('src')).toBeTruthy();

    assets.catSpriteSheet.dispatchEvent(new Event('load'));
    expect(assets.catSpriteLoaded).toBe(true);
    expect(car.loaded).toBe(false);

    car.image.dispatchEvent(new Event('load'));
    expect(car.loaded).toBe(true);
});

it('retains fallback rendering flags when images fail to load', () => {
    const assets = loadSprites();
    assets.catSpriteSheet.dispatchEvent(new Event('error'));
    assets.obstacles.car!.image.dispatchEvent(new Event('error'));
    expect(assets.catSpriteLoaded).toBe(false);
    expect(assets.obstacles.car!.loaded).toBe(false);
});
