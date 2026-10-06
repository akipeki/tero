// file: game/render/characters/humans.ts
//
// The HUMANS — short, stocky, grey-skinned office workers who shamble like
// zombies in their business suits. Drawn by rig into 32×32 frames, facing
// right, feet on the bottom row.
//
//   clerk   — the Walker. Arms out, shuffling, glowing eyes.
//   manager — the Hopper. Bald, glasses, briefcase, hops at you screaming.

import { Raster } from '../pixel/Raster';

export const HUMAN_FRAME = 32;

const C = {
  ink:       '#1b1620',
  skin:      '#a8b394',
  skinLight: '#c9d1b4',
  skinDark:  '#76826a',
  socket:    '#3b2a3f',
  glow:      '#ff4848',
  glowCore:  '#ffd0c0',
  hair:      '#3d3330',
  hairLight: '#5c4d47',
  suit:      '#3c4558',
  suitLight: '#566179',
  suitDark:  '#272d3b',
  shirt:     '#e9e6dc',
  tieRed:    '#b8343a',
  shoe:      '#16141a',
  teeth:     '#e8e2c8',
  mouth:     '#2a1218',
  mgrSuit:   '#7a6a52',
  mgrLight:  '#978566',
  mgrDark:   '#57492f',
  glasses:   '#d9e4ea',
  case:      '#6b3f22',
  caseLight: '#8f5a33',
  metal:     '#c9c2a8',
} as const;

// ─── Clerk (Walker) ──────────────────────────────────────────────────────────

/** 4-frame shamble: `f` = 0..3. */
export function drawClerk(f: number): Raster {
  const r = new Raster(HUMAN_FRAME, HUMAN_FRAME);
  const step = [0, 1, 0, -1][f % 4];
  const bob = f % 2;            // lurch down on each step
  const armBob = [0, 1, 1, 0][f % 4];

  // back arm reaching forward (darker, behind body)
  r.part(C.ink, (t) => {
    t.capsule(17, 17 + bob, 26, 16 + bob + armBob, 1.6, C.suitDark);
    t.ellipse(27, 16 + bob + armBob, 1.8, 1.8, C.skinDark);
  });

  // legs + shoes (short!)
  r.part(C.ink, (t) => {
    t.rect(12 + step, 25, 4, 4, C.suitDark);
    t.rect(17 - step, 25, 4, 4, C.suit);
    t.rect(11 + step, 28, 6, 3, C.shoe);
    t.rect(16 - step, 28, 7, 3, C.shoe);
  });

  // body: boxy suit jacket
  r.part(C.ink, (t) => {
    t.shadedEllipse(16, 21 + bob, 7, 5.5, C.suit, C.suitLight, C.suitDark);
    t.rect(10, 21 + bob, 13, 5, C.suit);
    t.rect(10, 24 + bob, 13, 2, C.suitDark);
  });
  // shirt V + crooked tie
  r.tri(17, 16 + bob, 21, 16 + bob, 19, 21 + bob, C.shirt);
  r.rect(18, 17 + bob, 2, 2, C.tieRed);
  r.line(19, 19 + bob, 20, 23 + bob, C.tieRed);

  // head: too big, slightly forward and down — the zombie slouch
  const hx = 17, hy = 10 + bob;
  r.part(C.ink, (t) => {
    t.shadedEllipse(hx, hy, 7, 6.5, C.skin, C.skinLight, C.skinDark);
    t.ellipse(hx - 6, hy + 1, 1.5, 2, C.skinDark);            // ear
  });
  // sad comb-over
  r.rect(hx - 6, hy - 6, 9, 2, C.hair);
  r.line(hx - 5, hy - 7, hx + 4, hy - 6, C.hair);
  r.line(hx - 3, hy - 7, hx + 5, hy - 5, C.hairLight);
  r.px(hx + 6, hy - 4, C.hair);
  // sunken sockets with glowing pupils
  r.rect(hx, hy - 2, 3, 3, C.socket);
  r.rect(hx + 4, hy - 2, 3, 3, C.socket);
  r.px(hx + 2, hy - 1, C.glow);
  r.px(hx + 6, hy - 1, C.glow);
  r.px(hx + 2, hy - 2, C.glowCore);
  // under-eye bags + frown of jagged teeth
  r.line(hx, hy + 1, hx + 2, hy + 1, C.skinDark);
  r.rect(hx + 1, hy + 3, 6, 2, C.mouth);
  r.px(hx + 2, hy + 3, C.teeth);
  r.px(hx + 4, hy + 4, C.teeth);
  r.px(hx + 6, hy + 3, C.teeth);

  // front arm, stiff and reaching
  r.part(C.ink, (t) => {
    t.capsule(15, 19 + bob, 25, 19 + bob - armBob, 1.8, C.suit);
    t.rect(25, 18 + bob - armBob, 3, 3, C.skin);
  });
  r.px(28, 19 + bob - armBob, C.skinDark);

  return r;
}

// ─── Manager (Hopper) ────────────────────────────────────────────────────────

export function drawManager(airborne: boolean): Raster {
  const r = new Raster(HUMAN_FRAME, HUMAN_FRAME);
  const lift = airborne ? -3 : 1;   // crouched on the ground, stretched in air

  // briefcase in the back hand
  r.part(C.ink, (t) => {
    const cy = airborne ? 15 : 22;
    t.rect(4, cy, 8, 6, C.case);
    t.rect(4, cy, 8, 2, C.caseLight);
    t.rect(7, cy - 2, 3, 2, C.metal);
    t.capsule(12, cy, 14, 18 + lift, 1.2, C.mgrDark);
  });

  // legs: splayed crouch on the ground, tucked in the air
  r.part(C.ink, (t) => {
    if (airborne) {
      t.rect(12, 22, 4, 4, C.mgrDark);
      t.rect(17, 22, 4, 4, C.mgrSuit);
      t.rect(11, 25, 6, 3, C.shoe);
      t.rect(17, 25, 6, 3, C.shoe);
    } else {
      t.rect(10, 26, 5, 3, C.mgrDark);
      t.rect(18, 26, 5, 3, C.mgrSuit);
      t.rect(8, 28, 7, 3, C.shoe);
      t.rect(18, 28, 8, 3, C.shoe);
    }
  });

  // body
  r.part(C.ink, (t) => {
    t.shadedEllipse(16, 21 + lift, 7.5, 5.5, C.mgrSuit, C.mgrLight, C.mgrDark);
  });
  r.tri(17, 16 + lift, 21, 16 + lift, 19, 20 + lift, C.shirt);
  // tie flips up over the shoulder when he hops
  if (airborne) r.capsule(19, 17 + lift, 23, 12 + lift, 0.8, C.tieRed);
  else r.line(19, 18 + lift, 19, 23 + lift, C.tieRed);

  // bald head, big glasses, screaming
  const hx = 17, hy = 10 + lift;
  r.part(C.ink, (t) => {
    t.shadedEllipse(hx, hy, 7, 6.5, C.skin, C.skinLight, C.skinDark);
    t.ellipse(hx - 6, hy + 1, 1.5, 2, C.skinDark);
  });
  r.rect(hx - 6, hy - 1, 2, 3, C.hair);          // hair ring around the side
  r.px(hx - 2, hy - 5, C.skinLight);              // head shine
  r.px(hx - 1, hy - 5, C.skinLight);
  // glasses
  r.rect(hx, hy - 2, 3, 3, C.glasses);
  r.rect(hx + 4, hy - 2, 3, 3, C.glasses);
  r.line(hx + 3, hy - 1, hx + 4, hy - 1, C.ink);
  r.px(hx + 2, hy - 1, C.glow);
  r.px(hx + 6, hy - 1, C.glow);
  // open scream
  r.rect(hx + 2, hy + 2, 4, airborne ? 4 : 3, C.mouth);
  r.rect(hx + 2, hy + 2, 4, 1, C.teeth);

  // front arm: fist raised in the air, pointing on the ground
  r.part(C.ink, (t) => {
    if (airborne) {
      t.capsule(20, 19 + lift, 27, 12 + lift, 1.8, C.mgrSuit);
      t.ellipse(28, 11 + lift, 2, 2, C.skin);
    } else {
      t.capsule(15, 19 + lift, 25, 17 + lift, 1.8, C.mgrSuit);
      t.ellipse(26, 17 + lift, 2, 1.6, C.skin);
    }
  });

  return r;
}

// ─── Mr. Halvorsen (the Floor 12 boss) ───────────────────────────────────────

export const HALVORSEN_W = 40;
export const HALVORSEN_H = 60;

export type HalvorsenPose = 'walk0' | 'walk1' | 'present' | 'throw' | 'hurt';

/** Tall, thin, TED-talk headset, pinstripes, a tie down to his knees and a
 *  presentation clicker. Faces right; feet on the bottom edge. Zombie skin,
 *  so the freed recolour gives him his face back. */
export function drawHalvorsen(pose: HalvorsenPose): Raster {
  const r = new Raster(HALVORSEN_W, HALVORSEN_H);
  const hurt = pose === 'hurt';
  const lean = hurt ? -2 : 0;
  const pin = '#3a4878';
  const suit = '#26305a', suitLight = '#34407a', suitDark = '#181e3c';

  // long legs: a stride when walking
  r.part(C.ink, (t) => {
    const a = pose === 'walk0' ? 3 : pose === 'walk1' ? -3 : 0;
    t.capsule(17, 40, 16 + a, 55, 2.6, suitDark);
    t.capsule(23, 40, 24 - a, 55, 2.6, suit);
    t.rect(11 + a, 55, 8, 4, C.shoe);
    t.rect(21 - a, 55, 9, 4, C.shoe);
  });

  // back arm (holds the pie when throwing)
  r.part(C.ink, (t) => {
    if (pose === 'throw') {
      t.capsule(16 + lean, 24, 12 + lean, 10, 2.2, suitDark);
      t.ellipse(12 + lean, 8, 5, 5, '#ffd23f');              // the pie chart
      t.tri(12 + lean, 8, 17 + lean, 8, 12 + lean, 3, '#d83b3b');
    } else {
      t.capsule(16 + lean, 24, 14 + lean, 38, 2.2, suitDark);
    }
  });

  // torso: tall jacket with pinstripes
  r.part(C.ink, (t) => {
    t.shadedEllipse(20 + lean, 31, 8, 12, suit, suitLight, suitDark);
  });
  for (let x = 14; x <= 26; x += 3) r.line(x + lean, 22, x + lean, 41, pin);
  r.tri(18 + lean, 20, 23 + lean, 20, 20 + lean, 27, C.shirt);
  // the tie, all the way to his knees
  r.rect(20 + lean, 22, 2, 24, C.tieRed);
  r.px(20 + lean, 46, C.tieRed);

  // head: long face, combover, headset mic
  const hx = 21 + lean, hy = 12;
  r.part(C.ink, (t) => {
    t.shadedEllipse(hx, hy, 6.5, 8, C.skin, C.skinLight, C.skinDark);
  });
  r.rect(hx - 6, hy - 8, 10, 3, C.hair);                    // the combover
  r.rect(hx - 2, hy - 9, 8, 1, C.hairLight);
  r.rect(hx - 5, hy - 2, 2, 4, C.ink);                       // headset ear piece
  r.line(hx - 4, hy + 2, hx + 3, hy + 5, C.ink);             // mic boom
  r.rect(hx + 3, hy + 4, 2, 2, C.ink);                       // mic
  // glasses + eyes
  r.rect(hx, hy - 3, 3, 3, C.glasses);
  r.rect(hx + 4, hy - 3, 3, 3, C.glasses);
  if (hurt) {
    r.px(hx + 1, hy - 2, C.ink); r.px(hx + 5, hy - 2, C.ink);
  } else {
    r.px(hx + 2, hy - 2, C.glow); r.px(hx + 6, hy - 2, C.glow);
  }
  // the smile that never reaches the eyes (or a wince)
  if (hurt) r.rect(hx + 1, hy + 3, 4, 2, C.mouth);
  else { r.line(hx, hy + 3, hx + 5, hy + 3, C.mouth); r.px(hx, hy + 2, C.mouth); r.rect(hx + 1, hy + 3, 4, 1, C.teeth); }

  // front arm: clicker held out
  r.part(C.ink, (t) => {
    if (pose === 'present') {
      t.capsule(22 + lean, 24, 34, 22, 2.2, suit);
      t.ellipse(35, 22, 2, 2, C.skin);
      t.rect(36, 20, 3, 4, C.ink);                            // the clicker
    } else if (hurt) {
      t.capsule(22 + lean, 24, 30, 14, 2.2, suit);
      t.ellipse(31, 13, 2, 2, C.skin);
    } else {
      t.capsule(22 + lean, 24, 25, 37, 2.2, suit);
      t.ellipse(25, 38, 2, 2, C.skin);
    }
  });
  if (pose === 'present') r.px(39, 21, C.glow);              // laser dot on the clicker
  return r;
}
