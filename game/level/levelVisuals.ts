// file: game/level/levelVisuals.ts

import type { ThemeName } from '../render/Theme';

export interface LevelVisuals {
  theme: ThemeName;
}

export const level1Visuals: LevelVisuals = {
  theme: 'ember', // dusk | mint | ember
};