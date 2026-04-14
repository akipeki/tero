// Pico-8 inspired 16-color palette — all visuals use only these colors.
export const P = {
  SKY_DARK:    '#1a1c2c',
  SKY_MID:     '#5d275d',
  SUN_GOLD:    '#ef7d57',
  HILL_DARK:   '#38573f',
  HILL_MID:    '#a7f070',
  GROUND_TOP:  '#c2c3c7',
  GROUND_MID:  '#5f574f',
  BLOCK_TAN:   '#ffcd75',
  BLOCK_BROWN: '#ab5236',
  PLAYER_BLUE: '#29adff',
  PLAYER_DARK: '#1d7bb0',
  ENEMY_RED:   '#ff004d',
  ENEMY_DARK:  '#7f0026',
  MUSHROOM:    '#ff77a8',
  STAR_WHITE:  '#fff1e8',
  CASTLE_GREY: '#83769c',
  HUD_WHITE:   '#fff1e8',
  HAZARD:      '#ff004d',
  PLATFORM:    '#ab5236',
} as const;

export type PaletteKey = keyof typeof P;
