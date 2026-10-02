// file: game/render/characters/creatures.ts
//
// The company's other employees. Everyone walks on two legs and wears a
// suit — except the plant, which wears a tie. 32×32 frames, facing right,
// feet on the bottom row (same contract as humans.ts).
//
//   guard    Security. Peaked cap, shades, baton.           (walker)
//   rat      Corporate rat. Tiny suit, huge ears, fast.     (walker)
//   pig      Corporate pig. Bursting suit, cigar, gold.     (walker)
//   robot    Evil walking robot. One red eye, painted tie.  (walker)
//   plant    Flesh-eating office plant. Chomps. Unstompable.(stationary)
//   gorilla  Corporate monkey. Enormous, angry, hops.       (hopper)
//   vampire  Corporate vampire. Cape over the suit, hops.   (hopper)

import { Raster } from '../pixel/Raster';

const F = 32;
const FLOOR = 31;
const INK = '#1b1620';

const C = {
  shirt:     '#e9e6dc',
  red:       '#c8323a',
  gold:      '#e8b72f',
  shoe:      '#16141a',
  white:     '#ffffff',
  glow:      '#ff3b3b',
} as const;

interface Suit { base: string; light: string; dark: string }

interface BipedSpec {
  /** Walk frame 0..3 (shuffle), or -1 for a planted stance. */
  f: number;
  suit: Suit;
  tie: string;
  hand: string;
  /** Torso half-width / half-height in px. */
  rx: number;
  ry: number;
  legH: number;
  legW?: number;
  /** Arm pose. */
  arms: 'reach' | 'swing' | 'up' | 'down';
  armLen?: number;
  /** Extra body offset (lurch). */
  bob?: number;
}

/** Shared skeleton: legs, suit torso, shirt V + tie, two arms.
 *  Returns the neck position so the species can draw its head on top. */
function biped(r: Raster, s: BipedSpec, frontArmExtra?: (hx: number, hy: number) => void): { nx: number; ny: number } {
  const step = s.f < 0 ? 0 : [0, 1, 0, -1][s.f % 4];
  const bob = (s.bob ?? 0) + (s.f < 0 ? 0 : s.f % 2);
  const legW = s.legW ?? 4;
  const cx = 16;
  const cy = FLOOR - s.legH - s.ry + bob;
  const armLen = s.armLen ?? 8;
  const armY = cy - s.ry + 3;
  const armEnd = (back: boolean): [number, number] => {
    const k = back ? -1 : 1;
    switch (s.arms) {
      case 'reach': return [cx + s.rx + armLen - 1, armY + (back ? -1 : 1) * (s.f % 2)];
      case 'swing': return [cx + s.rx - 2 + k * step * 2 + 2, armY + armLen - 2];
      case 'up':    return [cx + s.rx + 2, armY - armLen + 1];
      case 'down':  return [cx + s.rx - 1, armY + armLen];
    }
  };

  // back arm
  r.part(INK, (t) => {
    const [ex, ey] = armEnd(true);
    t.capsule(cx + 1, armY, ex - 2, ey, 1.6, s.suit.dark);
    t.ellipse(ex - 1, ey, 1.7, 1.7, s.hand);
  });
  // legs + shoes
  r.part(INK, (t) => {
    t.rect(cx - legW - 1 + step, FLOOR - s.legH, legW, s.legH, s.suit.dark);
    t.rect(cx + 1 - step, FLOOR - s.legH, legW, s.legH, s.suit.base);
    t.rect(cx - legW - 2 + step, FLOOR - 2, legW + 2, 3, C.shoe);
    t.rect(cx + 1 - step, FLOOR - 2, legW + 3, 3, C.shoe);
  });
  // torso
  r.part(INK, (t) => t.shadedEllipse(cx, cy, s.rx, s.ry, s.suit.base, s.suit.light, s.suit.dark));
  // shirt V + tie
  const vTop = cy - s.ry + 1;
  r.tri(cx + 1, vTop, cx + 5, vTop, cx + 3, vTop + Math.min(6, s.ry), C.shirt);
  r.rect(cx + 2, vTop + 1, 2, 2, s.tie);
  r.line(cx + 3, vTop + 3, cx + 3, vTop + Math.min(8, s.ry + 2), s.tie);
  // front arm
  r.part(INK, (t) => {
    const [ex, ey] = armEnd(false);
    t.capsule(cx - 1, armY + 1, ex, ey, 1.8, s.suit.base);
    t.ellipse(ex + 1, ey, 1.9, 1.9, s.hand);
  });
  const [fx, fy] = armEnd(false);
  frontArmExtra?.(fx + 1, fy);
  return { nx: cx + 1, ny: vTop };
}

// ─── Security guard ──────────────────────────────────────────────────────────

export function drawGuard(f: number): Raster {
  const r = new Raster(F, F);
  const skin = '#a8b394', skinDark = '#76826a';
  const { nx, ny } = biped(r, {
    f, suit: { base: '#2c3a66', light: '#3f5090', dark: '#1d2647' }, tie: '#111111', hand: skin,
    rx: 7.5, ry: 6, legH: 6, arms: 'swing', armLen: 7,
  }, (hx, hy) => r.part(INK, (t) => t.capsule(hx, hy, hx + 4, hy - 5, 1, '#222222')));   // baton
  // badge on chest
  r.rect(nx - 5, ny + 3, 2, 2, C.gold);
  const hx = nx, hy = ny - 6;
  r.part(INK, (t) => t.shadedEllipse(hx, hy, 6, 5.5, skin, '#c9d1b4', skinDark));
  // peaked cap
  r.part(INK, (t) => { t.rect(hx - 6, hy - 7, 12, 4, '#1d2647'); t.rect(hx - 2, hy - 4, 10, 2, '#111111'); });
  r.px(hx, hy - 6, C.gold);
  // sunglasses + grim mouth
  r.rect(hx + 1, hy - 1, 6, 2, '#111111');
  r.px(hx + 6, hy - 1, '#5a6a8a');
  r.rect(hx + 2, hy + 3, 4, 1, INK);
  // earpiece wire
  r.line(hx - 5, hy + 1, hx - 4, hy + 6, '#dddddd');
  return r;
}

// ─── Corporate rat ───────────────────────────────────────────────────────────

export function drawRat(f: number): Raster {
  const r = new Raster(F, F);
  const fur = '#8e8a94', furDark = '#66626c', pink = '#f2a0b0';
  // tail behind, curling up
  r.part(INK, (t) => {
    t.capsule(10, 26, 4, 24 + (f % 2), 1, pink);
    t.capsule(4, 24 + (f % 2), 3, 18, 0.8, pink);
  });
  const { nx, ny } = biped(r, {
    f, suit: { base: '#5c4a3a', light: '#7a6450', dark: '#3e3126' }, tie: C.red, hand: pink,
    rx: 5.5, ry: 4.5, legH: 3, legW: 3, arms: 'swing', armLen: 5,
  });
  const hx = nx + 1, hy = ny - 4;
  // ears, head, snout
  r.part(INK, (t) => {
    t.ellipse(hx - 4, hy - 5, 3, 3, fur);
    t.ellipse(hx + 1, hy - 6, 3, 3, fur);
  });
  r.ellipse(hx - 4, hy - 5, 1.5, 1.5, pink);
  r.ellipse(hx + 1, hy - 6, 1.5, 1.5, pink);
  r.part(INK, (t) => {
    t.shadedEllipse(hx, hy, 5, 4, fur, '#b0acb6', furDark);
    t.tri(hx + 3, hy - 2, hx + 3, hy + 3, hx + 10, hy + 1, fur);
  });
  r.px(hx + 10, hy + 1, pink);
  r.px(hx + 2, hy - 1, C.glow);                                         // beady red eye
  for (const dy of [0, 2]) r.line(hx + 6, hy + dy, hx + 11, hy - 1 + dy * 1.5, '#d8d4dc'); // whiskers
  r.px(hx + 7, hy + 3, C.white);                                        // tooth
  return r;
}

// ─── Corporate pig ───────────────────────────────────────────────────────────

export function drawPig(f: number): Raster {
  const r = new Raster(F, F);
  const pink = '#f0a0a8', pinkDark = '#c97880', pinkLight = '#ffc6cc';
  const { nx, ny } = biped(r, {
    f, suit: { base: '#2b2f3e', light: '#454b60', dark: '#1a1d28' }, tie: C.gold, hand: pink,
    rx: 10, ry: 7.5, legH: 4, legW: 4, arms: 'swing', armLen: 6, bob: 0,
  });
  // pinstripes + straining buttons + gold watch chain
  for (const x of [9, 13, 21]) r.line(x, ny + 3, x, ny + 11, '#3a3f52');
  r.px(17, ny + 7, C.gold); r.px(17, ny + 10, C.gold);
  r.line(10, ny + 9, 15, ny + 10, C.gold);
  const hx = nx, hy = ny - 6;
  r.part(INK, (t) => {
    t.tri(hx - 6, hy - 4, hx - 3, hy - 9, hx - 1, hy - 5, pink);   // ears
    t.tri(hx + 1, hy - 5, hx + 3, hy - 10, hx + 5, hy - 4, pink);
    t.shadedEllipse(hx, hy, 7, 6, pink, pinkLight, pinkDark);
  });
  // snout
  r.part(INK, (t) => t.ellipse(hx + 7, hy + 1, 2.5, 3, pinkLight));
  r.px(hx + 7, hy, INK); r.px(hx + 7, hy + 2, INK);
  // smug eye + cigar
  r.rect(hx + 2, hy - 2, 2, 1, INK);
  r.part(INK, (t) => t.rect(hx + 6, hy + 4, 7, 2, '#6b3f22'));
  r.px(hx + 13, hy + 4, '#ff8a3d');
  r.px(hx + 14, hy + 2, '#c9ccd1'); r.px(hx + 15, hy, '#c9ccd1');
  return r;
}

// ─── Evil walking robot ──────────────────────────────────────────────────────

export function drawRobot(f: number): Raster {
  const r = new Raster(F, F);
  const steel = '#a9b3bd', steelLight = '#c9d1d9', steelDark = '#6b7480';
  const step = [0, 2, 0, -2][f % 4];
  // piston legs
  r.part(INK, (t) => {
    t.rect(11 + step, 22, 4, 7, steelDark);
    t.rect(17 - step, 22, 4, 7, steel);
    t.rect(10 + step, 28, 6, 3, '#3a3f48');
    t.rect(16 - step, 28, 7, 3, '#3a3f48');
  });
  // boxy torso with a painted-on tie
  r.part(INK, (t) => {
    t.rect(9, 12, 14, 11, steel);
    t.rect(9, 12, 14, 2, steelLight);
    t.rect(21, 13, 2, 10, steelDark);
  });
  r.rect(15, 14, 2, 2, C.red);
  r.tri(14, 16, 18, 16, 16, 21, C.red);
  for (const y of [15, 18]) r.rect(11, y, 2, 1, '#46e07a');               // status LEDs
  // arms, stiff and reaching
  r.part(INK, (t) => {
    t.rect(22, 14 + (f % 2), 7, 3, steelDark);
    t.rect(28, 13 + (f % 2), 2, 5, '#3a3f48');
  });
  // head: one red visor eye, antenna with blinking light
  r.part(INK, (t) => {
    t.rect(10, 3, 13, 9, steel);
    t.rect(10, 3, 13, 2, steelLight);
    t.rect(16, 0, 1, 3, steelDark);
  });
  r.rect(13, 6, 9, 3, '#2a0a0a');
  r.rect(17 + (f % 2), 7, 3, 1, C.glow);
  r.px(16, 0, f % 2 ? C.glow : '#7a1a1a');
  r.rect(12, 10, 8, 1, steelDark);                                        // grille
  return r;
}

// ─── Flesh-eating office plant ───────────────────────────────────────────────

/** `open` = jaws open (chomp frame). */
export function drawPlant(open: boolean): Raster {
  const r = new Raster(F, F);
  const green = '#3f9a48', greenDark = '#2f6e33', head = '#c8323a', headDark = '#8e1f26';
  // pot
  r.part(INK, (t) => { t.rect(9, 23, 14, 8, '#8a4b2a'); t.rect(8, 22, 16, 3, '#a65f37'); });
  r.rect(12, 26, 8, 3, '#e9e6dc');
  r.rect(13, 27, 6, 1, '#8a4b2a');                                         // tiny "ROI" label lines
  // stem + leaves
  r.part(INK, (t) => {
    t.capsule(16, 22, 15, 13, 1.5, green);
    t.tri(15, 19, 7, 15, 12, 21, green);
    t.tri(16, 18, 24, 14, 20, 21, green);
  });
  r.line(9, 16, 13, 20, greenDark); r.line(23, 15, 19, 20, greenDark);
  // tiny tie on the stem
  r.rect(15, 15, 2, 1, '#2c4a8a'); r.rect(15, 16, 2, 3, '#2c4a8a');
  // the head: two jaws
  const gap = open ? 4 : 1;
  r.part(INK, (t) => {
    t.shadedEllipse(19, 8 - gap / 2, 8, 4.5, head, '#e2565c', headDark);   // upper jaw
    t.shadedEllipse(19, 11 + gap / 2, 7, 3, head, undefined, headDark);    // lower jaw
  });
  // spots + teeth
  for (const [x, y] of [[15, 5], [21, 4], [24, 7]]) r.px(x, y - gap / 2, '#ffd0d0');
  for (let x = 13; x <= 25; x += 3) {
    r.px(x, 10 - gap / 2, C.white);
    r.px(x + 1, 10 + gap / 2, C.white);
  }
  if (open) r.rect(13, 10 - gap / 2 + 1, 12, gap - 1, '#3a0a10');
  return r;
}

// ─── Corporate gorilla (hopper) ──────────────────────────────────────────────

export function drawGorilla(airborne: boolean): Raster {
  const r = new Raster(F, F);
  const fur = '#3b3a40', face = '#7a6f6a';
  const { nx, ny } = biped(r, {
    f: -1, suit: { base: '#20222a', light: '#363a46', dark: '#121318' }, tie: C.red, hand: fur,
    rx: 10, ry: 7, legH: airborne ? 4 : 5, legW: 4, arms: airborne ? 'up' : 'down', armLen: 10,
    bob: airborne ? -2 : 0,
  });
  const hx = nx, hy = ny - 5;
  r.part(INK, (t) => t.shadedEllipse(hx, hy, 7, 6, fur, '#55545c', '#24232a'));
  r.part(INK, (t) => t.ellipse(hx + 3, hy + 2, 4.5, 3.5, face));
  r.rect(hx - 1, hy - 3, 9, 2, '#24232a');                               // brow ridge
  r.px(hx + 2, hy - 1, C.glow); r.px(hx + 6, hy - 1, C.glow);            // angry eyes
  r.rect(hx + 3, hy + 3, 4, 1, INK);
  if (airborne) { r.rect(hx + 3, hy + 3, 4, 2, '#3a0a10'); r.px(hx + 4, hy + 3, C.white); }
  return r;
}

// ─── Corporate vampire (hopper) ──────────────────────────────────────────────

export function drawVampire(airborne: boolean): Raster {
  const r = new Raster(F, F);
  const skin = '#e6e2ea', skinDark = '#b8b0c4';
  // cape behind: folded on the ground, spread like wings in the air
  r.part(INK, (t) => {
    if (airborne) {
      t.tri(15, 12, 0, 6, 4, 24, '#1a1a1e');
      t.tri(15, 12, 30, 5, 27, 22, '#1a1a1e');
    } else {
      t.tri(13, 11, 6, 30, 16, 30, '#1a1a1e');
    }
  });
  if (airborne) { r.tri(15, 13, 3, 8, 6, 22, '#9c1f2b'); r.tri(16, 13, 28, 7, 25, 20, '#9c1f2b'); }
  else r.tri(13, 13, 8, 29, 13, 29, '#9c1f2b');
  const { nx, ny } = biped(r, {
    f: airborne ? -1 : 0, suit: { base: '#1d1d24', light: '#33333f', dark: '#101014' }, tie: '#9c1f2b', hand: skin,
    rx: 6.5, ry: 6, legH: 6, arms: airborne ? 'up' : 'reach', armLen: 7,
  });
  // high collar
  r.tri(nx - 6, ny + 1, nx - 2, ny - 4, nx - 2, ny + 2, '#9c1f2b');
  const hx = nx, hy = ny - 6;
  r.part(INK, (t) => t.shadedEllipse(hx, hy, 6, 6, skin, C.white, skinDark));
  // slicked hair with a widow's peak
  r.rect(hx - 6, hy - 6, 11, 3, '#111111');
  r.tri(hx - 1, hy - 4, hx + 3, hy - 4, hx + 1, hy - 1, '#111111');
  r.px(hx + 2, hy - 1, C.glow); r.px(hx + 5, hy - 1, C.glow);
  r.rect(hx + 2, hy + 3, 4, 1, INK);
  r.px(hx + 2, hy + 4, C.white); r.px(hx + 5, hy + 4, C.white);          // fangs
  return r;
}
