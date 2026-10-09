// file: game/render/office/decor.ts
//
// Per-floor décor. Every floor is the same grim office tower, but each one
// gets its own wallpaper, carpet, desks, background wall and blinds — and
// the higher you climb, the fancier (and emptier of daylight) it gets.
//
// A level picks its décor with `decor:` in the story script; Game calls
// setDecor() on load and the office tile/background drawers read getDecor().

export type DecorId =
  | 'basement'   // floor 1  — mailroom: concrete, pipes, metal shelving
  | 'compliance' // floor 3  — surveillance: pale grey-blue, a CCTV wall, barred windows
  | 'cubicles'   // floor 6  — beige & teal cubicle farm
  | 'boardroom'  // floor 12 — wood panelling, glass meeting rooms
  | 'legal'      // floor 13 — dark green, binders, blinds nearly shut
  | 'lab'        // floor 21 — white R&D lab, whiteboards
  | 'security'   // floor 27 — steel, CCTV wall, blinds fully shut
  | 'executive'  // floor 30 — 90s Memphis design, Scandinavian furniture
  | 'penthouse'  // floor 33 — marble and gold, open sky
  | 'stairwell'  // the way home — institutional green, yellow handrail, daylight at last
  | 'vents';     // between floors — inside the ventilation ducts: Elvis's happy place

/** What the cubicle-height strip of the background shows. */
export type MidLayer = 'cubicles' | 'shelving' | 'glass' | 'binders' | 'lab' | 'monitors' | 'memphis' | 'marble' | 'pipes';

/** How the desk platforms are built. */
export type DeskStyle = 'metal' | 'laminate' | 'wood' | 'white' | 'steel' | 'glass' | 'marble';

export interface Decor {
  id: DecorId;
  wall: string;
  wallStripe: string;
  rail: string;
  railLight: string;
  wainscot: string;
  wainscotPanel: string;
  wainscotLight: string;
  /** Window blinds drawn 0 (open) … 1 (fully shut). */
  blinds: number;
  /** Window size multiplier (penthouse gets floor-to-ceiling glass). */
  windowScale: number;
  /** 'barred' = small prison windows with metal bars and only black outside. */
  windows?: 'view' | 'barred' | 'grates';
  sky: [string, string, string];
  /** The motivational poster + clock between windows. */
  poster: boolean;
  mid: MidLayer;
  carpet: [string, string, string];
  slab: [string, string, string];
  desk: DeskStyle;
  ceiling: string;
  /** Haze over the background: lighter = more washed out. */
  haze: string;
}

const DUSK: [string, string, string] = ['#2b3a67', '#c46a6a', '#f2a65a'];

const FRIDAY: [string, string, string] = ['#7fb8e8', '#cfe6f5', '#fff3c4'];

export const DECORS: Record<DecorId, Decor> = {
  vents: {
    id: 'vents',
    wall: '#8a96a3', wallStripe: '#7c8895', rail: '#5d6875', railLight: '#9aa6b3',
    wainscot: '#6c7783', wainscotPanel: '#636e7a', wainscotLight: '#7f8a96',
    blinds: 0, windowScale: 0.6, windows: 'grates', sky: FRIDAY, poster: false,
    mid: 'pipes',
    carpet: ['#9aa6b3', '#b9c3cc', '#6c7783'], slab: ['#7c8895', '#9aa6b3', '#5d6875'],
    desk: 'steel', ceiling: '#a3aeb9', haze: 'rgba(255,240,220,0.10)',
  },
  stairwell: {
    id: 'stairwell',
    wall: '#8f9e8c', wallStripe: '#869583', rail: '#c9a01f', railLight: '#ffd23f',
    wainscot: '#4f6b55', wainscotPanel: '#47614c', wainscotLight: '#5d7a63',
    blinds: 0, windowScale: 0.8, sky: FRIDAY, poster: false,
    mid: 'shelving',
    carpet: ['#6e6e66', '#808078', '#5a5a54'], slab: ['#7a7a72', '#8e8e86', '#5e5e58'],
    desk: 'metal', ceiling: '#d8d6cc', haze: 'rgba(200,220,200,0.22)',
  },
  basement: {
    id: 'basement',
    wall: '#9a9a92', wallStripe: '#8e8e86', rail: '#5a5a54', railLight: '#74746c',
    wainscot: '#6e6e66', wainscotPanel: '#64645c', wainscotLight: '#7c7c74',
    blinds: 0, windowScale: 0.6, windows: 'barred', sky: ['#000000', '#000000', '#000000'], poster: false,
    mid: 'shelving',
    carpet: ['#6b5a44', '#7d6a52', '#544634'], slab: ['#7a7a72', '#8e8e86', '#5e5e58'],
    desk: 'metal', ceiling: '#cfccc0', haze: 'rgba(120,120,112,0.30)',
  },
  cubicles: {
    id: 'cubicles',
    wall: '#d6caae', wallStripe: '#cfc2a4', rail: '#7c3b4a', railLight: '#9b5566',
    wainscot: '#5f8a86', wainscotPanel: '#557d79', wainscotLight: '#6c9894',
    blinds: 0.28, windowScale: 1, sky: DUSK, poster: true,
    mid: 'cubicles',
    carpet: ['#5b6f8f', '#7184a3', '#465874'], slab: ['#8d8a80', '#a29f94', '#6f6c63'],
    desk: 'laminate', ceiling: '#e7e3d6', haze: 'rgba(226,218,196,0.28)',
  },
  boardroom: {
    id: 'boardroom',
    wall: '#b88a5c', wallStripe: '#a87c50', rail: '#5a3a22', railLight: '#7a5232',
    wainscot: '#6e4a2c', wainscotPanel: '#62412a', wainscotLight: '#865c38',
    blinds: 0.5, windowScale: 1, sky: DUSK, poster: true,
    mid: 'glass',
    carpet: ['#7a2e36', '#923a44', '#5e2228'], slab: ['#8d8a80', '#a29f94', '#6f6c63'],
    desk: 'wood', ceiling: '#e7e3d6', haze: 'rgba(214,190,160,0.26)',
  },
  legal: {
    id: 'legal',
    wall: '#3f5a48', wallStripe: '#38513f', rail: '#c9a24a', railLight: '#e0bd66',
    wainscot: '#4a3626', wainscotPanel: '#3f2e20', wainscotLight: '#5c4430',
    blinds: 0.88, windowScale: 0.9, sky: ['#1d2440', '#4a3a5a', '#7a5a6a'], poster: false,
    mid: 'binders',
    carpet: ['#2f4a3a', '#3e5e4a', '#22382c'], slab: ['#7a7a72', '#8e8e86', '#5e5e58'],
    desk: 'wood', ceiling: '#d8d4c4', haze: 'rgba(60,80,66,0.30)',
  },
  lab: {
    id: 'lab',
    wall: '#e6ebee', wallStripe: '#dde3e7', rail: '#3f7fd8', railLight: '#6a9ee6',
    wainscot: '#b9c3cb', wainscotPanel: '#aeb8c0', wainscotLight: '#c8d1d8',
    blinds: 0.4, windowScale: 1, sky: ['#5a7fb8', '#9fb8d8', '#d8e4ee'], poster: true,
    mid: 'lab',
    carpet: ['#8a949e', '#9ea8b2', '#6e7882'], slab: ['#a2a8ae', '#b6bcc2', '#82888e'],
    desk: 'white', ceiling: '#f2f4f5', haze: 'rgba(236,240,244,0.30)',
  },
  compliance: {
    id: 'compliance',
    wall: '#7a8794', wallStripe: '#727f8c', rail: '#d83b3b', railLight: '#e86a6a',
    wainscot: '#4a5562', wainscotPanel: '#434e5a', wainscotLight: '#5a6672',
    blinds: 1, windowScale: 0.7, windows: 'barred', sky: DUSK, poster: false,
    mid: 'monitors',
    carpet: ['#4a5260', '#5a6270', '#3a414c'], slab: ['#7a7e84', '#8e9298', '#5e6268'],
    desk: 'laminate', ceiling: '#c8ccd0', haze: 'rgba(90,100,112,0.26)',
  },
  security: {
    id: 'security',
    wall: '#5e6670', wallStripe: '#565e68', rail: '#c8323a', railLight: '#e05a60',
    wainscot: '#3f464f', wainscotPanel: '#383f47', wainscotLight: '#4c545e',
    blinds: 1, windowScale: 0.8, sky: DUSK, poster: false,
    mid: 'monitors',
    carpet: ['#3a3f48', '#4a505a', '#2a2e35'], slab: ['#6a6e74', '#7e8288', '#4e5258'],
    desk: 'steel', ceiling: '#b8bcc0', haze: 'rgba(70,76,86,0.32)',
  },
  executive: {
    id: 'executive',
    wall: '#2f8f8a', wallStripe: '#2a827d', rail: '#ff77a8', railLight: '#ff9fc2',
    wainscot: '#1d1d24', wainscotPanel: '#26262f', wainscotLight: '#ffd23f',
    blinds: 0.15, windowScale: 1.15, sky: ['#3a2a6a', '#d86a8a', '#ffb36b'], poster: false,
    mid: 'memphis',
    carpet: ['#4a2a6a', '#5e3a82', '#361e4e'], slab: ['#6a6070', '#7e7484', '#4e4654'],
    desk: 'glass', ceiling: '#efe8f0', haze: 'rgba(40,120,116,0.18)',
  },
  penthouse: {
    id: 'penthouse',
    wall: '#efe9dc', wallStripe: '#e6dfd0', rail: '#c9a24a', railLight: '#f0d27a',
    wainscot: '#d9d2c4', wainscotPanel: '#cfc7b8', wainscotLight: '#ece6d8',
    blinds: 0, windowScale: 1.45, sky: ['#4a7ac8', '#9fc4ea', '#fff0c8'], poster: false,
    mid: 'marble',
    carpet: ['#9c1f2b', '#b8323e', '#741520'], slab: ['#d9d2c4', '#ece6d8', '#b8b0a2'],
    desk: 'marble', ceiling: '#f6f2e8', haze: 'rgba(250,244,230,0.22)',
  },
};

let current: Decor = DECORS.cubicles;

export function setDecor(id: DecorId | undefined): void {
  current = DECORS[id ?? 'cubicles'] ?? DECORS.cubicles;
}

export function getDecor(): Decor {
  return current;
}

export const DECOR_IDS = Object.keys(DECORS) as DecorId[];

export function isDecorId(id: string): id is DecorId {
  return id in DECORS;
}
