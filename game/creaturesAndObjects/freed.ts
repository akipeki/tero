// file: game/creaturesAndObjects/freed.ts
//
// What happens to a worker Tero frees: colour comes back to their face,
// they drop the tie, shout something and skip off home, fading out.
// Walkers and Hoppers both use this; robots and plants can't be freed.

import { t } from '../i18n';
import { Raster } from '../render/pixel/Raster';
import { drawText, textWidth } from '../render/pixel/font';
import { stepBody } from '../physics/Physics';
import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects';
import type { WalkerVariant, HopperVariant } from './enemyKinds';

const FREED_FRAMES = 150;
const LAND_FRAMES  = 30;
const RUN_SPEED    = 2.2;
const BUBBLE_FRAMES = 105;

const GENERIC_LINES = [
  'HOME!', 'MY KIDS!', 'I QUIT!', 'THE SUN?!', 'BYE BOSS', 'NAP TIME',
  'MY DOG!', 'IS IT 5?', 'FREEDOM', 'PTO!!', 'WHAT YEAR?', 'MY BAND!',
  'SOUP!', 'GRASS!', 'MOM?',
];

const VARIANT_LINES: Partial<Record<WalkerVariant | HopperVariant, string[]>> = {
  guard:   ['OFF DUTY', 'NAP POST'],
  pig:     ['OINK. HOME.', 'NO MORE KPI'],
  rat:     ['SQUEAK! HOME'],
  gorilla: ['BANANA BREAK', 'HUG TIME'],
  vampire: ['SUN? FINE.', 'BED BY 6'],
  manager: ['NO MEETINGS', 'CANCEL Q4'],
};

let lineCounter = 0;
/** Deterministic-ish rotation so two neighbours rarely say the same thing. */
function pickLine(variant: WalkerVariant | HopperVariant): string {
  const own = VARIANT_LINES[variant];
  const n = lineCounter++;
  if (own && n % 2 === 0) return own[(n >> 1) % own.length];
  return GENERIC_LINES[(n * 7) % GENERIC_LINES.length];
}

export class FreedMotion {
  timer = 0;
  readonly line: string;
  private landed = false;
  private baseY = 0;
  private hopPhase = 0;

  constructor(variant: WalkerVariant | HopperVariant) {
    this.line = pickLine(variant);
  }

  get done(): boolean { return this.timer >= FREED_FRAMES; }
  /** Fade over the last third. */
  get alpha(): number {
    const t = this.timer / FREED_FRAMES;
    return t < 0.66 ? 1 : Math.max(0, (1 - t) / 0.34);
  }
  get showBubble(): boolean { return this.timer < BUBBLE_FRAMES; }
  /** Hop offset (px, negative = up) for the drawn sprite. */
  get hop(): number { return this.landed ? -Math.abs(Math.sin(this.hopPhase)) * 5 : 0; }

  /** Home is downstairs — they skip back the way Tero came. */
  update(body: creaturesAndObjects, ctx: UpdateCtx): void {
    this.timer++;
    if (!this.landed) {
      // Drop to the floor first (hoppers get freed mid-air).
      body.vx = 0;
      stepBody(body, ctx.map);
      if (body.onGround || this.timer > LAND_FRAMES) {
        this.landed = true;
        this.baseY = body.y;
      }
      return;
    }
    // Then skip away ignoring the map: pits and desks don't matter any more.
    body.x -= RUN_SPEED;
    body.y = this.baseY;
    this.hopPhase += 0.25;
  }
}

// ─── Speech bubble ───────────────────────────────────────────────────────────

const bubbles = new Map<string, HTMLCanvasElement>();

function bubble(text: string): HTMLCanvasElement {
  let c = bubbles.get(text);
  if (!c) {
    const w = textWidth(text) + 6;
    const r = new Raster(w + 2, 13);
    r.rect(1, 0, w, 1, '#1b1620');
    r.rect(1, 9, w, 1, '#1b1620');
    r.rect(0, 1, 1, 8, '#1b1620');
    r.rect(w + 1, 1, 1, 8, '#1b1620');
    r.rect(1, 1, w, 8, '#ffffff');
    drawText(r, text, 4, 2, '#1b1620');
    // tail
    r.rect(4, 10, 3, 1, '#1b1620');
    r.px(5, 11, '#1b1620');
    r.rect(5, 9, 1, 1, '#ffffff');
    c = r.toCanvas();
    bubbles.set(text, c);
  }
  return c;
}

/** A speech bubble whose tail points down at (x, y) in screen px. */
export function drawBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  const c = bubble(t(text));
  ctx.drawImage(c, Math.round(x - 5), Math.round(y - c.height));
}

/** Bubble above a freed worker's head, at hitbox top-centre. */
export function drawFreedBubble(
  ctx: CanvasRenderingContext2D, f: FreedMotion, body: creaturesAndObjects, camX: number,
): void {
  if (!f.showBubble) return;
  drawBubble(ctx, f.line, body.cx - camX, body.y + f.hop - 11);
}

/** The tie they drop, as a little burst of tie-coloured bits. */
export const TIE_COLORS: [string, string] = ['#d83b3b', '#ffd23f'];
