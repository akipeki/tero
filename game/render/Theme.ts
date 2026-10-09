// file: game/render/Theme.ts

import { P } from '../palette';

export type ThemeName = 'dusk' | 'mint' | 'ember' | 'office';

export interface GameTheme {
  name: ThemeName;

  sky: {
    top: string;
    mid: string;
    bottom: string;
    stars: string;
  };

  hills: {
    back: string;
    front: string;
  };

  buildings: {
    body: string;
    window: string;
  };

  ground: {
    base: string;
    top: string;
    shadow: string;
    pattern: string;
  };

  platform: {
    base: string;
    highlight: string;
    shadow: string;
  };

  block: {
    base: string;
    border: string;
    symbol: string;
    symbolBlink: string;
    usedBase: string;
    usedTop: string;
  };

  player: {
    body: string;
    shade: string;
    eye: string;
    arm: string;
  };

  enemy: {
    body: string;
    shade: string;
    eye: string;
  };

  mushroom: {
    cap: string;
    stem: string;
    spot: string;
  };

  castle: {
    body: string;
    shade: string;
    window: string;
    gate: string;
    pole: string;
    flag: string;
  };

  hazard: {
    spike: string;
    base: string;
  };

  hud: {
    text: string;
  };
}

const THEMES: Record<ThemeName, GameTheme> = {
  // 1990s office. Most office visuals live in render/office/; these values
  // cover the shared bits (particles, HUD, editor previews).
  office: {
    name: 'office',
    sky:       { top: '#d8ccb0', mid: '#cdbf9f', bottom: '#5f8a86', stars: '#fff8dc' },
    hills:     { back: '#8592a6', front: '#6fbf73' },
    buildings: { body: '#1d2440', window: '#ffd27a' },
    ground:    { base: '#8d8a80', top: '#5b6f8f', shadow: '#6a675e', pattern: '#7a776d' },
    platform:  { base: '#a8743f', highlight: '#c99560', shadow: '#6e4a26' },
    block: {
      base: '#d8cfb8', border: '#8f8670', symbol: '#46e07a', symbolBlink: '#1f6b3a',
      usedBase: '#1d3fa8', usedTop: '#8f8670',
    },
    player:    { body: '#6cc24a', shade: '#3e8a3c', eye: '#ffffff', arm: '#6cc24a' },
    enemy:     { body: '#3c4558', shade: '#272d3b', eye: '#ff4848' },
    mushroom:  { cap: '#f4f1e6', stem: '#6b3f22', spot: '#d83b3b' },
    castle: {
      body: '#a9b3bd', shade: '#6b7480', window: '#ffb347', gate: '#2b3038',
      pole: '#c9c2a8', flag: '#ffb347',
    },
    hazard:    { spike: '#d83b3b', base: '#5b6f8f' },
    hud:       { text: '#fff1e8' },
  },


  dusk: {
    name: 'dusk',

    sky: {
      top: P.SKY_DARK,
      mid: P.SKY_MID,
      bottom: '#7a3060',
      stars: P.STAR_WHITE,
    },

    hills: {
      back: P.HILL_DARK,
      front: P.HILL_MID,
    },

    buildings: {
      body: P.CASTLE_GREY,
      window: P.SUN_GOLD,
    },

    ground: {
      base: P.GROUND_MID,
      top: P.GROUND_TOP,
      shadow: '#3a3328',
      pattern: '#3a3328',
    },

    platform: {
      base: P.PLATFORM,
      highlight: '#d4723e',
      shadow: '#6b3420',
    },

    block: {
      base: P.BLOCK_TAN,
      border: P.BLOCK_BROWN,
      symbol: P.BLOCK_BROWN,
      symbolBlink: P.BLOCK_TAN,
      usedBase: P.BLOCK_BROWN,
      usedTop: '#6b3420',
    },

    player: {
      body: P.PLAYER_BLUE,
      shade: P.PLAYER_DARK,
      eye: P.STAR_WHITE,
      arm: P.STAR_WHITE,
    },

    enemy: {
      body: P.ENEMY_RED,
      shade: P.ENEMY_DARK,
      eye: P.STAR_WHITE,
    },

    mushroom: {
      cap: P.MUSHROOM,
      stem: P.STAR_WHITE,
      spot: P.STAR_WHITE,
    },

    castle: {
      body: P.CASTLE_GREY,
      shade: P.GROUND_MID,
      window: P.SUN_GOLD,
      gate: P.SKY_DARK,
      pole: P.GROUND_TOP,
      flag: P.ENEMY_RED,
    },

    hazard: {
      spike: P.HAZARD,
      base: P.GROUND_MID,
    },

    hud: {
      text: P.HUD_WHITE,
    },
  },

  mint: {
    name: 'mint',

    sky: {
      top: P.SKY_MID,
      mid: P.PLAYER_BLUE,
      bottom: P.HILL_MID,
      stars: P.STAR_WHITE,
    },

    hills: {
      back: P.HILL_DARK,
      front: P.HILL_MID,
    },

    buildings: {
      body: P.GROUND_TOP,
      window: P.SUN_GOLD,
    },

    ground: {
      base: P.HILL_DARK,
      top: P.HILL_MID,
      shadow: P.GROUND_MID,
      pattern: P.GROUND_MID,
    },

    platform: {
      base: P.BLOCK_BROWN,
      highlight: P.BLOCK_TAN,
      shadow: P.GROUND_MID,
    },

    block: {
      base: P.BLOCK_TAN,
      border: P.BLOCK_BROWN,
      symbol: P.ENEMY_RED,
      symbolBlink: P.BLOCK_TAN,
      usedBase: P.GROUND_MID,
      usedTop: P.GROUND_TOP,
    },

    player: {
      body: P.PLAYER_BLUE,
      shade: P.SKY_DARK,
      eye: P.STAR_WHITE,
      arm: P.STAR_WHITE,
    },

    enemy: {
      body: P.ENEMY_RED,
      shade: P.ENEMY_DARK,
      eye: P.STAR_WHITE,
    },

    mushroom: {
      cap: P.ENEMY_RED,
      stem: P.STAR_WHITE,
      spot: P.BLOCK_TAN,
    },

    castle: {
      body: P.GROUND_TOP,
      shade: P.GROUND_MID,
      window: P.SUN_GOLD,
      gate: P.SKY_DARK,
      pole: P.GROUND_MID,
      flag: P.ENEMY_RED,
    },

    hazard: {
      spike: P.ENEMY_RED,
      base: P.HILL_DARK,
    },

    hud: {
      text: P.HUD_WHITE,
    },
  },

  ember: {
    name: 'ember',

    sky: {
      top: P.SKY_DARK,
      mid: P.ENEMY_DARK,
      bottom: P.BLOCK_BROWN,
      stars: P.SUN_GOLD,
    },

    hills: {
      back: P.GROUND_MID,
      front: P.BLOCK_BROWN,
    },

    buildings: {
      body: P.GROUND_MID,
      window: P.SUN_GOLD,
    },

    ground: {
      base: P.BLOCK_BROWN,
      top: P.SUN_GOLD,
      shadow: P.ENEMY_DARK,
      pattern: P.ENEMY_DARK,
    },

    platform: {
      base: P.BLOCK_BROWN,
      highlight: P.SUN_GOLD,
      shadow: P.ENEMY_DARK,
    },

    block: {
      base: P.SUN_GOLD,
      border: P.BLOCK_BROWN,
      symbol: P.ENEMY_DARK,
      symbolBlink: P.SUN_GOLD,
      usedBase: P.GROUND_MID,
      usedTop: P.ENEMY_DARK,
    },

    player: {
      body: P.PLAYER_BLUE,
      shade: P.SKY_DARK,
      eye: P.STAR_WHITE,
      arm: P.STAR_WHITE,
    },

    enemy: {
      body: P.ENEMY_RED,
      shade: P.ENEMY_DARK,
      eye: P.STAR_WHITE,
    },

    mushroom: {
      cap: P.MUSHROOM,
      stem: P.BLOCK_TAN,
      spot: P.STAR_WHITE,
    },

    castle: {
      body: P.GROUND_MID,
      shade: P.ENEMY_DARK,
      window: P.SUN_GOLD,
      gate: P.SKY_DARK,
      pole: P.GROUND_TOP,
      flag: P.ENEMY_RED,
    },

    hazard: {
      spike: P.ENEMY_RED,
      base: P.BLOCK_BROWN,
    },

    hud: {
      text: P.HUD_WHITE,
    },
  },
};

let currentTheme: GameTheme = THEMES.office;

export function getTheme(): GameTheme {
  return currentTheme;
}

export function setTheme(name: ThemeName): void {
  currentTheme = THEMES[name];
}

/** True while the 1990s office art set is active. */
export function isOffice(): boolean {
  return currentTheme.name === 'office';
}

export function getThemeByName(name: ThemeName): GameTheme {
  return THEMES[name];
}

export function getAllThemes(): Record<ThemeName, GameTheme> {
  return THEMES;
}