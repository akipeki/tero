// file: game/render/Theme.ts

import { P } from '../palette';

export type ThemeName = 'dusk' | 'mint' | 'ember';

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

let currentTheme: GameTheme = THEMES.dusk;

export function getTheme(): GameTheme {
  return currentTheme;
}

export function setTheme(name: ThemeName): void {
  currentTheme = THEMES[name];
}

export function getThemeByName(name: ThemeName): GameTheme {
  return THEMES[name];
}

export function getAllThemes(): Record<ThemeName, GameTheme> {
  return THEMES;
}