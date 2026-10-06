import {describe, expect, it} from 'vitest';
import {selectObstaclePattern} from './obstacleSelection.ts';

describe('selectObstaclePattern', () => {
    it('uses the weighted candidate order for deterministic rolls', () => {
        expect(selectObstaclePattern(0, undefined, () => 0)).toBe('buildingSmall');
        expect(selectObstaclePattern(0, undefined, () => 0.6)).toBe('buildingLarge');
        expect(selectObstaclePattern(0, undefined, () => 0.999)).toBe('doubleBuildingSmall');
    });

    it('does not repeat a pattern that disallows consecutive spawns when alternatives exist', () => {
        expect(selectObstaclePattern(0, 'doubleBuildingSmall', () => 0)).toBe('buildingSmall');
    });

    it('unlocks patterns only at their configured difficulty levels', () => {
        expect(selectObstaclePattern(2, undefined, () => 0.999)).toBe('doubleBuildingLarge');
        expect(selectObstaclePattern(3, undefined, () => 0.999)).toBe('car');
        expect(selectObstaclePattern(4, undefined, () => 0.85)).toBe('tripleBuildingSmall');
    });

    it('throws when no pattern is unlocked with positive weight', () => {
        expect(() => selectObstaclePattern(-1, undefined, () => 0)).toThrow(
            'At least one unlocked obstacle pattern must have a positive spawn weight',
        );
    });
});
