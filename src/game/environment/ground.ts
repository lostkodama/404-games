import { GAME_WIDTH } from '../constants';

export type GroundDetail = {
    x: number;
}

const GROUND_DETAIL_SPACING = 80;

export function createGroundDetails(): GroundDetail[] {
    const details: GroundDetail[] = []

    for(let x = 40; x <= GAME_WIDTH; x+= GROUND_DETAIL_SPACING) {
        details.push({ x });
    }

    return details
}

export function updateGroundDetails(
    details: GroundDetail[],
    worldSpeed: number,
    deltaTime: number
) {
    for (const detail of details) {
        detail.x -= worldSpeed * deltaTime;

        if (detail.x < 0) { // Repeat pattern
            detail.x += GROUND_DETAIL_SPACING * details.length;
        }
    }
}