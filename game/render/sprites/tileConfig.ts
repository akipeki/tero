// file: game/render/sprites/tileConfig.ts

export interface TileDot {
  x?: number;
  y?: number;
  xFromRight?: number;
  yFromBottom?: number;
}

export const tileConfig = {
  solid: {
    topHeight: 4,
    leftWidth: 3,
    rightShadowWidth: 3,
    bottomShadowHeight: 3,
    dotSize: 3,
    dots: [
      { x: 8, y: 8 },
      { xFromRight: 11, y: 8 },
      { x: 8, yFromBottom: 11 },
      { xFromRight: 11, yFromBottom: 11 },
    ] satisfies TileDot[],
  },

  platform: {
    topHighlightHeight: 3,
    heightRatio: 0.5,
    bottomShadowHeight: 3,
  },

  hazard: {
    baseHeight: 6,
    spikeCount: 3,
    spikeInset: 5,
  },
} as const;