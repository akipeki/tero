// file: game/render/customImages.ts
//
// Loads the images listed in game/customSprites.ts and hands them to the
// renderers. Everything is optional: until an image has loaded (or if it
// fails to), the built-in code-drawn art is used.

import { CUSTOM_SPRITES, type CustomAnim, type CustomSprites } from '../customSprites';
import { framePaths, type PlayerFrameName } from './sprites/PlayerSpriteAssets';

export interface StripImage {
  img: HTMLImageElement;
  frames: number;
  /** Source size of one frame. */
  fw: number;
  fh: number;
}

/** Frame layout of a horizontal strip: square frames unless `frames` is given. */
export function stripLayout(width: number, height: number, frames?: number): { frames: number; fw: number; fh: number } {
  const n = Math.max(1, frames ?? Math.round(width / height));
  return { frames: n, fw: width / n, fh: height };
}

const enemies = new Map<string, StripImage>();
const props = new Map<string, StripImage>();
const listeners = new Set<() => void>();
let started = false;

function load(src: string, opts: CustomAnim): Promise<StripImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, ...stripLayout(img.naturalWidth, img.naturalHeight, opts.frames) });
    img.onerror = () => reject(new Error(`[Tero] custom sprite not found: ${src}`));
    img.src = src;
  });
}

/** Default fps per player animation (used when the list doesn't give one). */
const PLAYER_FPS: Record<PlayerFrameName, number> = {
  idle: 6, walk: 12, jump: 12, fall: 12, duck: 1, hurt: 14, lose: 1, win: 8, breathe: 14, glide: 6,
};

/** Starts loading every listed image. Safe to call more than once. */
export function initCustomSprites(list: CustomSprites = CUSTOM_SPRITES): Promise<void> {
  if (started || typeof window === 'undefined') return Promise.resolve();
  started = true;
  const jobs: Promise<void>[] = [];
  const warn = (e: unknown) => console.warn((e as Error).message);

  for (const [name, opts] of Object.entries(list.player) as [PlayerFrameName, CustomAnim][]) {
    const src = `/sprites/player/${name}.png`;
    jobs.push(load(src, opts).then((s) => {
      framePaths[name] = { ...framePaths[name], src, frames: s.frames, fps: opts.fps ?? PLAYER_FPS[name] };
    }, warn));
  }
  for (const [name, opts] of Object.entries(list.enemies) as [string, CustomAnim][]) {
    jobs.push(load(`/sprites/enemies/${name}.png`, opts).then((s) => { enemies.set(name, s); }, warn));
  }
  for (const id of list.props) {
    jobs.push(load(`/sprites/props/${id}.png`, {}).then((s) => { props.set(id, s); }, warn));
  }
  return Promise.all(jobs).then(() => { for (const fn of listeners) fn(); });
}

export function customEnemy(variant: string): StripImage | undefined {
  return enemies.get(variant);
}

export function customProp(id: string): StripImage | undefined {
  return props.get(id);
}

/** Called once everything has loaded (renderers drop their caches). */
export function onCustomSpritesLoaded(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
