// file: game/render/characters/dragon.ts
//
// The dragons, drawn by small pixel rigs instead of by hand, so every pose is
// consistent and a new animation is just a list of poses. Faces right; feet
// stand on the bottom row of a 64×64 frame.
//
//   drawBaby — TERO, age 2, the hero. Huge head, round tummy, diaper,
//              pacifier, mismatched googly eyes — and Dad's tie, far too
//              long, dragging along the floor behind him.
//   drawDad  — Dad, six months into "giving a little more". The grown-up
//              rig in a suit, greyed out and exhausted. Same tie.
//
// `npm run sprites` renders these poses to public/images/dragon/*.png.

import { Raster, strip } from '../pixel/Raster';

export const DRAGON_FRAME = 64;

const BABY_PALETTE = {
  ink:       '#1e2a2b',
  body:      '#6cc24a',
  bodyLight: '#a5e57b',
  bodyDark:  '#3e8a3c',
  limbDark:  '#2f6e33',
  belly:     '#f6e7b2',
  bellyDark: '#dcc583',
  zip:       '#8b929c',
  zipLight:  '#d8dde3',
  spike:     '#ff9a52',
  spikeDark: '#d8692c',
  wing:      '#ffb36b',
  wingDark:  '#e07b3a',
  horn:      '#fff0b8',
  hornDark:  '#d9c27a',
  eye:       '#ffffff',
  pupil:     '#1e2a2b',
  blush:     '#ff8ea0',
  mouth:     '#5a1f2b',
  tongue:    '#ff6f86',
  tie:       '#3d6be0',
  tieStripe: '#ffd23f',
  tooth:     '#ffffff',
  smoke:     '#c9ccd1',
  smokeDark: '#9aa0a8',
  diaper:    '#f7f7f2',
  diaperDark:'#d9d9cf',
  pin:       '#e8b72f',
  paci:      '#8fd3ff',
  paciRing:  '#ff8ea0',
  suit:      '#4a5163',
  suitLight: '#646c80',
  suitDark:  '#343a48',
  shirt:     '#e9e6dc',
};

type Palette = typeof BABY_PALETTE;

/** Dad: same family, six months without daylight. */
const DAD_PALETTE: Palette = {
  ...BABY_PALETTE,
  body:      '#8fa07e',
  bodyLight: '#aab796',
  bodyDark:  '#5f6f55',
  limbDark:  '#4f5d47',
  belly:     '#d9d2b6',
  bellyDark: '#b8b093',
  spike:     '#b8855a',
  spikeDark: '#8c6040',
  wing:      '#c49a70',
  wingDark:  '#96704c',
  horn:      '#e3dcc0',
  blush:     '#a8968f',
};

/** Active palette. The part helpers read it, so drawDad swaps it in while it draws. */
let C: Palette = BABY_PALETTE;

export type Eyes  = 'open' | 'blink' | 'happy' | 'squeeze' | 'x' | 'wide' | 'tired';
export type Mouth = 'smile' | 'open' | 'o' | 'tongue' | 'wobble' | 'flat';

export interface DragonPose {
  /** Body/head vertical offset (+ = down). */
  bob?: number;
  /** Extra head offset on top of bob. */
  headX?: number;
  headY?: number;
  /** Feet: horizontal offset from rest and lift off the ground. */
  backFoot?:  { dx?: number; lift?: number };
  frontFoot?: { dx?: number; lift?: number };
  /** Arm angles in radians: 0 = pointing forward, + = down, - = up. */
  backArm?: number;
  frontArm?: number;
  /** Tail sway -1..1. */
  tail?: number;
  /** Wing flap 0 (folded) .. 1 (up). */
  wing?: number;
  /** Tie lift 0..1 (flutters up when airborne). */
  tieUp?: number;
  /** Crouch 0..1 (duck). */
  crouch?: number;
  eyes?: Eyes;
  mouth?: Mouth;
  /** Smoke puff from the nostril: 0 = none, 1..2 = rising stages. */
  smoke?: number;
  /** Grown-up only: wear the suit jacket. */
  suit?: boolean;
  /** Baby only: pacifier in (default) — it pops out whenever the mouth opens. */
  paci?: boolean;
}

// ─── Dad (the grown-up rig) ──────────────────────────────────────────────────

export function drawDad(pose: DragonPose = {}): Raster {
  const prev = C;
  C = DAD_PALETTE;
  try {
    return drawGrownUp({ eyes: 'tired', mouth: 'flat', suit: true, bob: 1, ...pose });
  } finally {
    C = prev;
  }
}

function drawGrownUp(pose: DragonPose): Raster {
  const r = new Raster(DRAGON_FRAME, DRAGON_FRAME);
  const crouch = pose.crouch ?? 0;
  const bob = (pose.bob ?? 0) + Math.round(crouch * 7);
  const hx = pose.headX ?? 0;
  const hy = bob + (pose.headY ?? 0) + Math.round(crouch * 4);
  const tail = pose.tail ?? 0;
  const wing = pose.wing ?? 0;

  // ── Tail (behind everything) ─────────────────────────────────────────────
  r.part(C.ink, (t) => {
    const p = [
      [22, 51 + bob],
      [15, 55 + bob + tail],
      [9, 58 + tail * 2],
      [5, 57 + tail * 3],
    ];
    t.capsule(p[0][0], p[0][1], p[1][0], p[1][1], 5, C.body);
    t.capsule(p[1][0], p[1][1], p[2][0], p[2][1], 3.5, C.body);
    t.capsule(p[2][0], p[2][1], p[3][0], p[3][1], 2, C.body);
    // spade tip
    t.tri(p[3][0] + 1, p[3][1] - 4, p[3][0] - 5, p[3][1], p[3][0] + 1, p[3][1] + 3, C.spike);
    // underside shade
    t.capsule(p[0][0], p[0][1] + 3, p[2][0] + 1, p[2][1] + 1, 1, C.bodyDark);
  });

  // ── Back leg + foot ──────────────────────────────────────────────────────
  drawLeg(r, 27, pose.backFoot, bob, crouch, true);

  // ── Wings (tiny, useless) ────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    const by = 40 + bob;
    const tipY = by - 8 - Math.round(wing * 6);
    const tipX = 12 + Math.round(wing * 2);
    t.tri(24, by - 2, tipX, tipY, 18, by + 5, C.wing);
    t.tri(24, by - 2, tipX, tipY, 21, by + 6, C.wing);
    // membrane ribs
    t.line(23, by - 1, tipX + 1, tipY + 1, C.wingDark);
    t.line(22, by + 2, tipX + 2, tipY + 4, C.wingDark);
  });

  // ── Back arm (mostly hidden behind the tummy) ────────────────────────────
  drawArm(r, 37, 41 + bob, pose.backArm ?? 0.5, true);

  // ── Body ─────────────────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.shadedEllipse(31, 46 + bob, 11, 11 - crouch * 2, C.body, C.bodyLight, C.bodyDark);
    // back spikes
    for (const [sx, sy] of [[21, 39], [20, 45], [21, 51]] as const) {
      t.tri(sx + 2, sy - 3 + bob, sx - 3, sy + bob, sx + 2, sy + 3 + bob, C.spike);
    }
  });
  if (pose.suit) {
    // suit jacket over the tummy, shirt showing in the V
    r.part(C.ink, (t) => t.shadedEllipse(32, 47 + bob, 10, 10 - crouch * 2, C.suit, C.suitLight, C.suitDark));
    r.tri(35, 37 + bob, 42, 37 + bob, 38, 51 + bob, C.shirt);
    r.px(36, 46 + bob, C.ink); r.px(36, 50 + bob, C.ink);
  } else {
    // tummy patch + zipper (no outline — it's printed on the costume)
    r.shadedEllipse(35, 48 + bob, 7, 8 - crouch * 2, C.belly, undefined, C.bellyDark);
    for (let y = 42 + bob; y <= 55 + bob - Math.round(crouch * 2); y++) {
      r.px(33, y, y % 2 ? C.zip : C.zipLight);
    }
    r.rect(32, 41 + bob, 2, 2, C.zipLight);
    r.px(32, 43 + bob, C.zip);
  }

  // ── Front leg ────────────────────────────────────────────────────────────
  drawLeg(r, 36, pose.frontFoot, bob, crouch, false);

  // ── Horns + head crest (behind the head) ─────────────────────────────────
  r.part(C.ink, (t) => {
    t.tri(27 + hx, 21 + hy, 23 + hx, 12 + hy, 31 + hx, 19 + hy, C.horn);
    t.tri(35 + hx, 19 + hy, 38 + hx, 10 + hy, 40 + hx, 20 + hy, C.horn);
    t.line(25 + hx, 15 + hy, 27 + hx, 19 + hy, C.hornDark);
    t.line(38 + hx, 13 + hy, 38 + hx, 18 + hy, C.hornDark);
    for (const [sx, sy] of [[22, 25], [21, 31]] as const) {
      t.tri(sx + 3 + hx, sy - 3 + hy, sx - 3 + hx, sy + hy, sx + 3 + hx, sy + 3 + hy, C.spike);
    }
  });

  // ── Head + snout (one outlined blob) ─────────────────────────────────────
  r.part(C.ink, (t) => {
    t.shadedEllipse(33 + hx, 28 + hy, 12, 10, C.body, C.bodyLight, C.bodyDark);
    t.shadedEllipse(45 + hx, 31 + hy, 7, 5, C.body, C.bodyLight, C.bodyDark);
  });
  // chin / lower jaw tint
  r.line(39 + hx, 35 + hy, 49 + hx, 34 + hy, C.bodyDark);

  // nostril
  r.rect(49 + hx, 28 + hy, 2, 1, C.ink);
  // blush
  r.rect(39 + hx, 31 + hy, 3, 1, C.blush);
  r.px(40 + hx, 32 + hy, C.blush);

  // ── Tie (under the chin, over the tummy — the whole outfit) ──────────────
  r.part(C.ink, (t) => {
    const ty = 37 + hy;
    const up = pose.tieUp ?? 0;
    t.rect(38 + hx, ty, 4, 3, C.tie);                     // knot
    const tipX = 40 + hx + Math.round(up * 7);
    const tipY = ty + 13 - Math.round(up * 7);
    t.tri(37 + hx, ty + 3, 42 + hx, ty + 3, tipX + 2, tipY, C.tie);
    t.tri(37 + hx, ty + 3, tipX - 2, tipY, tipX + 2, tipY, C.tie);
    t.tri(tipX - 2, tipY, tipX + 2, tipY, tipX, tipY + 2, C.tie);
    // loud 90s diagonal stripes
    for (let k = 0; k < 4; k++) {
      const frac = (k + 1) / 5;
      const sx = Math.round(38 + hx + (tipX - 38 - hx) * frac);
      const sy = Math.round(ty + 3 + (tipY - ty - 3) * frac);
      t.line(sx - 1, sy + 1, sx + 2, sy - 1, C.tieStripe);
    }
    t.px(39 + hx, ty + 1, C.tieStripe);
  });

  // ── Front arm (over the tie so waving shows) ─────────────────────────────
  drawArm(r, 36, 43 + bob, pose.frontArm ?? 0.6, false);

  drawMouth(r, 40 + hx, 33 + hy, pose.mouth ?? 'smile');
  drawEyes(r,
    { x: 38 + hx, y: 24 + hy, r: 4.5 },
    { x: 29 + hx, y: 23 + hy, r: 3.2 },
    pose.eyes ?? 'open');

  if (pose.smoke) drawSmoke(r, 52 + hx, 26 + hy, pose.smoke);

  return r;
}

// ─── Baby Tero (the hero) ────────────────────────────────────────────────────

export function drawBaby(pose: DragonPose = {}): Raster {
  const r = new Raster(DRAGON_FRAME, DRAGON_FRAME);
  const crouch = pose.crouch ?? 0;
  const bob = (pose.bob ?? 0) + Math.round(crouch * 4);
  const hx = pose.headX ?? 0;
  const hy = bob + (pose.headY ?? 0) + Math.round(crouch * 4);
  const tail = pose.tail ?? 0;
  const wing = pose.wing ?? 0;
  const leg = { hipY: 56, legR: 2.8, footRx: 4.5 };

  // ── Stubby tail ──────────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.capsule(23, 56 + bob, 15, 59 + tail, 3.5, C.body);
    t.capsule(15, 59 + tail, 9, 59 + tail * 2, 2, C.body);
    t.tri(10, 55 + tail * 2, 5, 59 + tail * 2, 10, 62 + tail * 2, C.spike);
  });

  // Dad's tie, much too long: hangs off the tummy and drags along the floor
  // behind the feet (or flies back when airborne — drawn later, in front).
  const up = pose.tieUp ?? 0;
  const flying = up > 0.3;
  const drag = Math.round(tail * 2);
  if (!flying) drawLongTie(r, [[42, 54 + bob], [42, 60], [33, 62], [17 + drag, 62]], false);

  drawLeg(r, 28, pose.backFoot, bob, crouch, true, leg);

  // ── Wing nubs ────────────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    const by = 47 + bob;
    t.tri(25, by - 1, 18, by - 6 - Math.round(wing * 4), 21, by + 4, C.wing);
    t.line(24, by, 19, by - 4 - Math.round(wing * 4), C.wingDark);
  });

  drawArm(r, 36, 49 + bob, pose.backArm ?? 0.6, true, 5);

  // ── Round tummy ──────────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.shadedEllipse(32, 51 + bob, 9, 8 - crouch, C.body, C.bodyLight, C.bodyDark);
    t.tri(24, 46 + bob, 19, 49 + bob, 24, 52 + bob, C.spike);
  });
  r.shadedEllipse(35, 50 + bob, 5, 5, C.belly, undefined, C.bellyDark);

  // ── Diaper ───────────────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.shadedEllipse(32, 57 + bob, 9.5, 4.5, C.diaper, undefined, C.diaperDark);
    t.rect(23, 53 + bob, 19, 3, C.diaper);
  });
  r.line(24, 54 + bob, 40, 54 + bob, C.diaperDark);
  r.rect(37, 55 + bob, 3, 1, C.pin);
  r.px(40, 55 + bob, C.zip);

  drawLeg(r, 36, pose.frontFoot, bob, crouch, false, leg);

  // ── Horn nubs + crest ────────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.tri(27 + hx, 25 + hy, 25 + hx, 19 + hy, 31 + hx, 24 + hy, C.horn);
    t.tri(37 + hx, 23 + hy, 40 + hx, 17 + hy, 42 + hx, 24 + hy, C.horn);
    t.tri(23 + hx, 31 + hy, 18 + hx, 34 + hy, 23 + hx, 37 + hy, C.spike);
  });

  // ── Big head, short snout ────────────────────────────────────────────────
  r.part(C.ink, (t) => {
    t.shadedEllipse(34 + hx, 34 + hy, 13, 11.5, C.body, C.bodyLight, C.bodyDark);
    t.shadedEllipse(46 + hx, 37 + hy, 6.5, 4.5, C.body, C.bodyLight, C.bodyDark);
  });
  r.rect(50 + hx, 35 + hy, 1, 1, C.ink);                         // nostril
  r.rect(36 + hx, 40 + hy, 3, 1, C.blush);                       // blush
  r.px(37 + hx, 41 + hy, C.blush);

  // ── Tie knot + front drape (the floor trail was drawn behind the legs) ───
  drawLongTie(r, flying
    ? [[41, 47 + bob], [36, 45 + bob], [27, 42 + bob - up * 2], [17, 41 + bob - up * 4], [9, 43 + bob - up * 3]]
    : [[41, 47 + bob], [42, 55 + bob]], true, flying);

  drawArm(r, 37, 50 + bob, pose.frontArm ?? 0.7, false, 5);

  // ── Face ─────────────────────────────────────────────────────────────────
  const mouth = pose.mouth ?? 'smile';
  const paci = (pose.paci ?? true) && mouth === 'smile';
  if (!paci) drawMouth(r, 41 + hx, 39 + hy, mouth);
  drawEyes(r,
    { x: 39 + hx, y: 31 + hy, r: 5.5 },
    { x: 29 + hx, y: 30 + hy, r: 4 },
    pose.eyes ?? 'open');
  if (paci) {
    r.part(C.ink, (t) => t.ellipse(52 + hx, 39 + hy, 1.5, 3.5, C.paci));
    r.part(C.ink, (t) => t.ellipse(55 + hx, 39 + hy, 1.8, 1.8, C.paciRing));
    r.px(55 + hx, 39 + hy, C.ink);
  }
  if (pose.smoke) drawSmoke(r, 50 + hx, 31 + hy, pose.smoke);

  return r;
}

/** A tie drawn along a path, optionally starting with the knot and ending
 *  with the wide tip. */
function drawLongTie(r: Raster, pts: [number, number][], knot = true, tip = true): void {
  r.part(C.ink, (t) => {
    if (knot) t.rect(pts[0][0] - 2, pts[0][1] - 1, 4, 3, C.tie);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      t.capsule(x0, y0, x1, y1, i === pts.length - 1 && tip ? 2 : 1.6, C.tie);
    }
    if (tip) {
      const [ex, ey] = pts[pts.length - 1];
      t.ellipse(ex, ey, 2.6, 2, C.tie);
    }
  });
  // loud 90s stripes along the way
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    for (const f of [0.3, 0.75]) {
      const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
      r.px(x, y, C.tieStripe);
      r.px(x + 1, y - 1, C.tieStripe);
    }
  }
}

// ─── Parts ───────────────────────────────────────────────────────────────────

function drawLeg(
  r: Raster, hipX: number, foot: DragonPose['backFoot'], bob: number, crouch: number, back: boolean,
  size: { hipY: number; legR: number; footRx: number } = { hipY: 52, legR: 3.2, footRx: 5.5 },
): void {
  const dx = foot?.dx ?? 0;
  const lift = foot?.lift ?? 0;
  const footX = hipX + 1 + dx;
  const footY = 61 - lift;
  const hipY = size.hipY + bob;
  const kneeOut = Math.round(crouch * 3);
  r.part(C.ink, (t) => {
    const fill = back ? C.limbDark : C.body;
    t.capsule(hipX, hipY, footX - 1 + kneeOut, Math.max(hipY, footY - 3), size.legR, fill);
    // big floppy foot with three toes
    t.shadedEllipse(footX + 1, footY, size.footRx, 2.6, back ? C.limbDark : C.body, back ? undefined : C.bodyLight, C.bodyDark);
  });
  r.px(footX + 3, footY + 1, C.horn);
  r.px(footX + 5, footY + 1, C.horn);
  r.px(footX + 6, footY, C.horn);
}

function drawArm(r: Raster, sx: number, sy: number, angle: number, back: boolean, len = 7): void {
  const hx = sx + Math.cos(angle) * len;
  const hy = sy + Math.sin(angle) * len;
  r.part(C.ink, (t) => {
    t.capsule(sx, sy, hx, hy, 2, back ? C.limbDark : C.body);
    t.ellipse(hx + Math.cos(angle), hy + Math.sin(angle), 2, 2, back ? C.limbDark : C.body);
  });
  // little claw
  r.px(hx + Math.cos(angle) * 2, hy + Math.sin(angle) * 2, C.horn);
}

interface EyeSpot { x: number; y: number; r: number }

/** Near eye big, far eye small — the googly mismatch runs in the family. */
function drawEyes(r: Raster, near: EyeSpot, far: EyeSpot, eyes: Eyes): void {
  if (eyes === 'blink') {
    r.line(near.x - 3, near.y + 1, near.x + 3, near.y + 1, C.ink);
    r.line(far.x - 2, far.y + 1, far.x + 2, far.y + 1, C.ink);
    return;
  }
  if (eyes === 'happy') {
    for (const e of [near, far]) {
      const w = Math.round(e.r) - 1;
      r.line(e.x - w, e.y + 1, e.x, e.y - 1, C.ink);
      r.line(e.x, e.y - 1, e.x + w, e.y + 1, C.ink);
    }
    return;
  }
  if (eyes === 'squeeze') {
    r.line(near.x - 3, near.y - 2, near.x + 2, near.y, C.ink);
    r.line(near.x + 2, near.y, near.x - 3, near.y + 2, C.ink);
    r.line(far.x + 2, far.y - 1, far.x - 2, far.y + 1, C.ink);
    r.line(far.x - 2, far.y + 1, far.x + 2, far.y + 2, C.ink);
    return;
  }

  r.part(C.ink, (t) => {
    t.ellipse(near.x, near.y, near.r, near.r + 0.5, C.eye);
    t.ellipse(far.x, far.y, far.r, far.r + 0.5, C.eye);
  });
  if (eyes === 'tired') {
    // heavy lids + bags: six months of "just a little more"
    for (const e of [near, far]) {
      r.rect(e.x, e.y + 1, 2, 2, C.pupil);
      r.rect(Math.floor(e.x - e.r), Math.floor(e.y - e.r - 1), Math.ceil(e.r * 2) + 1, Math.ceil(e.r) + 1, C.body);
      r.line(e.x - e.r + 1, e.y, e.x + e.r - 1, e.y, C.ink);
      r.line(e.x - e.r + 1, e.y + e.r + 2, e.x + e.r - 2, e.y + e.r + 2, C.bodyDark);
    }
    return;
  }
  if (eyes === 'x') {
    for (const e of [near, far]) {
      const k = e.r > 4 ? 2 : 1;
      r.line(e.x - k, e.y - k, e.x + k, e.y + k, C.ink);
      r.line(e.x - k, e.y + k, e.x + k, e.y - k, C.ink);
    }
    return;
  }
  const big = eyes === 'wide' ? 1 : 2;
  // pupils look forward-ish, slightly cross-eyed for charm
  r.rect(near.x + 1, near.y - 1 + (eyes === 'wide' ? 1 : 0), big, big + 1, C.pupil);
  r.rect(far.x + 1, far.y, big - (eyes === 'wide' ? 0 : 0), big, C.pupil);
  // sparkle
  r.px(near.x - 1, near.y - 2, C.eye);
  if (eyes !== 'wide') r.px(near.x + 1, near.y - 1, C.eye);
}

function drawMouth(r: Raster, x: number, y: number, mouth: Mouth): void {
  switch (mouth) {
    case 'smile':
      r.line(x, y, x + 3, y + 1, C.ink);
      r.line(x + 3, y + 1, x + 9, y, C.ink);
      // snaggletooth poking up from the lower jaw
      r.px(x + 5, y, C.tooth);
      r.px(x + 5, y - 1, C.tooth);
      break;
    case 'open':
      r.part(C.ink, (t) => {
        t.ellipse(x + 5, y + 1, 3.5, 2, C.mouth);
      });
      r.rect(x + 4, y + 2, 3, 1, C.tongue);
      r.px(x + 6, y - 1, C.tooth);
      break;
    case 'o':
      r.part(C.ink, (t) => t.ellipse(x + 6, y + 1, 1.5, 1.5, C.mouth));
      break;
    case 'tongue':
      r.line(x, y, x + 9, y, C.ink);
      r.part(C.ink, (t) => t.ellipse(x + 7, y + 2, 1.5, 2, C.tongue));
      break;
    case 'wobble':
      for (let i = 0; i <= 8; i++) r.px(x + 1 + i, y + (i % 2), C.ink);
      break;
    case 'flat':
      r.line(x + 1, y + 1, x + 9, y + 1, C.ink);
      break;
  }
}

function drawSmoke(r: Raster, x: number, y: number, stage: number): void {
  r.part(C.smokeDark, (t) => {
    if (stage === 1) t.ellipse(x + 1, y, 1.5, 1.5, C.smoke);
    else {
      t.ellipse(x + 3, y - 4, 2.5, 2, C.smoke);
      t.ellipse(x + 1, y - 1, 1, 1, C.smoke);
    }
  });
}

// ─── Animations ──────────────────────────────────────────────────────────────

export interface DragonAnim {
  poses: DragonPose[];
  fps: number;
}

const TAU = Math.PI * 2;

function walkCycle(n: number): DragonPose[] {
  return Array.from({ length: n }, (_, i) => {
    const p = (i / n) * TAU;
    const s = Math.sin(p), c = Math.cos(p);
    return {
      // big toddler steps: the feet swing well clear of the diaper
      backFoot:  { dx: Math.round(-7 * c), lift: Math.round(Math.max(0, s) * 5) },
      frontFoot: { dx: Math.round(7 * c),  lift: Math.round(Math.max(0, -s) * 5) },
      // up on the passing pose, down on contact — a bouncy waddle
      bob: Math.abs(c) > 0.7 ? 1 : -1,
      headX: Math.round(c * 1.5),
      backArm: 0.4 + 0.5 * c,
      frontArm: 0.4 - 0.5 * c,
      tail: Math.round(s),
      wing: Math.max(0, s) * 0.3,
    };
  });
}

export const DRAGON_ANIMS = {
  idle: {
    fps: 6,
    poses: [
      {}, {}, { bob: 1 }, { bob: 1, tail: 1 },
      { bob: 1, tail: 1, eyes: 'blink' }, { bob: 1 }, { smoke: 1 }, { smoke: 2 },
    ],
  },
  walk: { fps: 12, poses: walkCycle(8) },
  jump: {
    fps: 12,
    poses: [
      { eyes: 'wide', mouth: 'open', backArm: -0.9, frontArm: -1.1, wing: 1, tieUp: 1,
        backFoot: { dx: -2, lift: 4 }, frontFoot: { dx: 2, lift: 5 }, tail: -1 },
      { eyes: 'wide', mouth: 'open', backArm: -1.1, frontArm: -0.9, wing: 0.3, tieUp: 1,
        backFoot: { dx: -2, lift: 4 }, frontFoot: { dx: 2, lift: 5 }, tail: -1 },
    ],
  },
  fall: {
    fps: 12,
    poses: [
      { eyes: 'wide', mouth: 'o', backArm: -1.4, frontArm: -0.4, wing: 1, tieUp: 0.6,
        backFoot: { dx: -3, lift: 1 }, frontFoot: { dx: 4, lift: 2 }, tail: 1 },
      { eyes: 'wide', mouth: 'o', backArm: -0.4, frontArm: -1.4, wing: 0.2, tieUp: 0.8,
        backFoot: { dx: -3, lift: 2 }, frontFoot: { dx: 4, lift: 1 }, tail: 1 },
    ],
  },
  duck: {
    fps: 1,
    poses: [{ crouch: 1, eyes: 'squeeze', mouth: 'wobble', backArm: -1.6, frontArm: -1.4 }],
  },
  hurt: {
    fps: 14,
    poses: [
      { eyes: 'squeeze', mouth: 'o', headX: -1, backArm: -1.2, frontArm: -1.2, tail: 1 },
      { eyes: 'squeeze', mouth: 'o', headX: 1, backArm: -1.0, frontArm: -1.4, tail: -1 },
    ],
  },
  // Fire: head thrown forward, mouth wide, wings up, arms back for power
  breathe: {
    fps: 14,
    poses: [
      { eyes: 'squeeze', mouth: 'open', headX: 2, headY: 1, backArm: 2.4, frontArm: 2.2, wing: 1, tail: -1,
        backFoot: { dx: -3 }, frontFoot: { dx: 4 } },
      { eyes: 'squeeze', mouth: 'open', headX: 3, headY: 0, backArm: 2.2, frontArm: 2.5, wing: 0.6, tail: 1,
        backFoot: { dx: -3 }, frontFoot: { dx: 4 } },
    ],
  },
  // Golden parachute: both arms up holding the strings, feet dangling
  glide: {
    fps: 6,
    poses: [
      { eyes: 'happy', mouth: 'o', backArm: -1.5, frontArm: -1.7, wing: 0.4, tieUp: 0.5,
        backFoot: { dx: -1, lift: 3 }, frontFoot: { dx: 2, lift: 2 }, tail: 1 },
      { eyes: 'happy', mouth: 'o', backArm: -1.7, frontArm: -1.5, wing: 0.7, tieUp: 0.7,
        backFoot: { dx: -1, lift: 2 }, frontFoot: { dx: 2, lift: 3 }, tail: 0 },
    ],
  },
  lose: {
    fps: 1,
    poses: [{ eyes: 'x', mouth: 'tongue', bob: 2, headY: 2, backArm: 1.3, frontArm: 1.3, tail: 1 }],
  },
  win: {
    fps: 8,
    poses: [
      { eyes: 'happy', mouth: 'open', backArm: -1.3, frontArm: -1.5, wing: 1 },
      { eyes: 'happy', mouth: 'open', backArm: -1.6, frontArm: -1.2, wing: 0.2, bob: -1 },
      { eyes: 'happy', mouth: 'open', backArm: -1.3, frontArm: -1.5, wing: 1, bob: -2 },
      { eyes: 'happy', mouth: 'smile', backArm: -1.6, frontArm: -1.2, wing: 0.2, bob: -1 },
    ],
  },
} satisfies Record<string, DragonAnim>;

export type DragonAnimName = keyof typeof DRAGON_ANIMS;

/** Baby Tero's animation strip. */
export function renderDragonStrip(name: DragonAnimName): Raster {
  return strip(DRAGON_ANIMS[name].poses.map((p) => drawBaby(p)));
}
