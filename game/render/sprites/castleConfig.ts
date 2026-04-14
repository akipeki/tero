// file: game/render/sprites/castleConfig.ts

export const castleConfig = {
  size: {
    widthTiles: 3,
    heightTiles: 6,
  },

  battlements: {
    merlonWidth: 10,
    merlonHeight: 10,
    gapWidth: 10,
  },

  gate: {
    width: 24,
    height: 28,
    archRadius: 12,
    insetBottom: 0,
  },

  windows: [
    { x: 6, y: 12, w: 10, h: 12 },
    { x: 80, y: 12, w: 10, h: 12 },
  ],

  shade: {
    leftWidth: 4,
  },

  flag: {
    poleHeight: 40,
    width: 18,
    height: 12,
    waveAmount: 3,
  },
} as const;