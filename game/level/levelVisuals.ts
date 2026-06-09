// file: game/level/levelVisuals.ts

import type { ThemeName } from '../render/Theme';

export interface LevelVisuals {
  theme: ThemeName;
}

export const level1Visuals: LevelVisuals = { theme: 'ember' };
export const level2Visuals: LevelVisuals = { theme: 'mint' };
export const level3Visuals: LevelVisuals = { theme: 'dusk' };
