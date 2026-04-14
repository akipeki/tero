// file: game/render/backgrounds/StarField.ts

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

interface Star {
  x: number;
  y: number;
  r: number;
}

function createStars(): Star[] {
  const stars: Star[] = [];

  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.floor(rng() * VIEWPORT_W),
      y: Math.floor(rng() * VIEWPORT_H * 0.55),
      r: rng() > 0.85 ? 2 : 1,
    });
  }

  return stars;
}

const STARS = createStars();

export function drawStarField(ctx: CanvasRenderingContext2D): void {
  const theme = getTheme();

  ctx.fillStyle = theme.sky.stars;

  for (const star of STARS) {
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
}