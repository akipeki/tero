// file: game/artSlots.ts
//
// ── ART SLOTS ── every piece of art you can replace with your own PNG
// (besides Tero, the enemies and the props, which have their own lists in
// customSprites.ts). Draw it in Aseprite at exactly these sizes, export the
// strip to public/sprites/art/<id>.png, list the id in customSprites.ts
// under `art`, and the game uses it instead of the code-drawn version.
//
// /art in the browser shows every slot and lets you download the current
// art as a template PNG at the right size to paint over.
//
// Strips: frames side by side in one row, in the order listed in `frames`.
// Characters face RIGHT, feet on the bottom edge, same anchor every frame.

export interface ArtSlot {
  id: ArtSlotId;
  /** What it is, for the /art page. */
  title: string;
  /** Frame names, in strip order. */
  frames: readonly string[];
  /** One frame, in pixels. */
  w: number;
  h: number;
  notes: string;
}

export const ART_SLOT_IDS = [
  'halvorsen', 'recruiter', 'board_heads', 'elvis', 'dad_things', 'fireball',
  'hide_box', 'fax', 'spring', 'chute', 'canopy', 'cctv', 'clippo', 'review_form',
] as const;
export type ArtSlotId = typeof ART_SLOT_IDS[number];

export const ART_SLOTS: Record<ArtSlotId, ArtSlot> = {
  halvorsen: {
    id: 'halvorsen', title: 'Mr. Halvorsen (Floor 12 boss)', w: 40, h: 60,
    frames: ['walk0', 'walk1', 'present', 'throw', 'hurt'],
    notes: 'Faces right. Keep his zombie skin #a8b394/#c9d1b4/#76826a and red eyes #ff4848: the game swaps them to warm skin when he\'s freed.',
  },
  recruiter: {
    id: 'recruiter', title: 'Chad from Talent Acquisition (Floor 6 mini-boss)', w: 40, h: 48,
    frames: ['walk0', 'walk1', 'throw', 'dash', 'hurt'],
    notes: 'A pig in a slim-fit suit, TALENT lanyard, clipboard. Faces right.',
  },
  board_heads: {
    id: 'board_heads', title: 'THE BOARD\'s five heads (Floor 33 boss)', w: 40, h: 32,
    frames: ['chairman', 'pig', 'vampire', 'gorilla', 'robot'],
    notes: 'Heads only, facing LEFT (towards Tero). Native 40×32: this replaces the 2×-scaled crops. The necks, collars and ties are drawn by code.',
  },
  elvis: {
    id: 'elvis', title: 'Elvis the office dog (The Vents)', w: 84, h: 56,
    frames: ['run0', 'run1', 'run2', 'run3', 'sit', 'jump', 'yelp'],
    notes: 'Faces right, paws on the bottom edge. Tero sits on his back about 26 px above the paws, roughly at his middle.',
  },
  dad_things: {
    id: 'dad_things', title: 'Dad\'s things (one per floor)', w: 16, h: 16,
    frames: ['watch', 'drawing', 'photo', 'letter', 'slipper', 'buspass', 'book', 'remote', 'key', 'sandwich', 'badge'],
    notes: 'Little icons. The pink glow behind them is drawn by code.',
  },
  fireball: {
    id: 'fireball', title: 'Baby dragon fire', w: 24, h: 24,
    frames: ['spark', 'full', 'fading', 'smoke'],
    notes: 'One flame from birth to smoke. Round and a bit wobbly: BABY fire. Drawn scaled to the flame\'s size (12→32 px).',
  },
  hide_box: {
    id: 'hide_box', title: 'The cardboard box Tero hides in', w: 34, h: 24,
    frames: ['box'],
    notes: 'Open side down. A peephole helps.',
  },
  fax: {
    id: 'fax', title: 'Fax machine teleporter (Floor 21)', w: 28, h: 26,
    frames: ['idle', 'printing'],
    notes: 'Bright: it\'s gameplay. The FAX/OUT label and the DOWN prompt are drawn by code.',
  },
  spring: {
    id: 'spring', title: 'The Synergy Spring (Floor 21)', w: 26, h: 14,
    frames: ['ready', 'squashed'],
    notes: 'Yellow-and-black safety tape on top: you stand on it.',
  },
  chute: {
    id: 'chute', title: 'Golden parachute pickup (Floor 30)', w: 20, h: 22,
    frames: ['sack'],
    notes: 'A gold sack. The glow and bobbing are drawn by code.',
  },
  canopy: {
    id: 'canopy', title: 'Golden parachute canopy (Floor 30)', w: 50, h: 40,
    frames: ['open'],
    notes: 'Strings meet at the bottom centre, which sits just above Tero\'s head.',
  },
  cctv: {
    id: 'cctv', title: 'Security camera (Floors 3 and 27)', w: 32, h: 16,
    frames: ['camera'],
    notes: 'A chunky 1990s CCTV housing with a sun hood, pointing RIGHT, lens at the right end. The game flips and tilts it to point anywhere, and draws the pole, wall bracket or pillar clamp, the light cone and the lens light. The mount point is about 12 px from the left end.',
  },

  clippo: {
    id: 'clippo', title: 'Clippo, the paperclip assistant (Blue Screen, Floor 33)', w: 32, h: 44,
    frames: ['idle', 'talk', 'hurt', 'broken'],
    notes: 'A bent paperclip with googly eyes, centred, about 20 px wide. The eyes at y ≈ 12–19. His speech bubble and the tips he throws are drawn by code.',
  },
  review_form: {
    id: 'review_form', title: 'THE PERFORMANCE REVIEW (RPG battle, after Floor 12)', w: 132, h: 116,
    frames: ['idle', 'attack', 'hurt', 'defeated'],
    notes: 'A sentient A4 form (about 90 × 110, right side of the frame) with an angry face, a 1-of-5 star rating, and a red pen arm sticking out to the left. Faces LEFT, towards Tero.',
  },
};
