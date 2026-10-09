'use client';

// /art — every sprite you can replace, with exact sizes and frame order,
// and the current art as a template PNG to open in Aseprite and paint over.

import { useEffect, useRef, useState } from 'react';
import { ART_SLOTS, ART_SLOT_IDS, type ArtSlotId } from '@/game/artSlots';
import { framePaths } from '@/game/render/sprites/PlayerSpriteAssets';
import { DAD_SRC } from '@/game/render/sprites/dadSprite';
import { Raster } from '@/game/render/pixel/Raster';
import { drawHalvorsen, drawHideBox, drawClerk, drawManager, drawSyncer, type HalvorsenPose } from '@/game/render/characters/humans';
import {
  drawRecruiter, drawElvis, drawPig, drawVampire, drawGorilla, drawRobot, drawGuard, drawRat, drawPlant,
  type RecruiterPose, type ElvisPose,
} from '@/game/render/characters/creatures';
import { Fax, Spring, ChutePickup, drawCanopy } from '@/game/creaturesAndObjects/Gadgets';
import { Cctv } from '@/game/creaturesAndObjects/Cctv';
import { drawClippo, type ClippoFrame } from '@/game/interludes/desktop';
import { drawReviewForm, type ReviewFrame } from '@/game/interludes/review';

const FONT: React.CSSProperties = { fontFamily: 'var(--font-pixel, monospace)' };

/** Renders a slot's current art as a strip canvas (frame after frame). */
function slotStrip(id: ArtSlotId): HTMLCanvasElement {
  const slot = ART_SLOTS[id];
  const c = document.createElement('canvas');
  c.width = slot.w * slot.frames.length;
  c.height = slot.h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  slot.frames.forEach((name, i) => {
    g.save();
    g.translate(i * slot.w, 0);
    g.beginPath(); g.rect(0, 0, slot.w, slot.h); g.clip();
    drawFrame(g, id, name, i);
    g.restore();
  });
  return c;
}

function rig(g: CanvasRenderingContext2D, r: Raster): void { g.drawImage(r.toCanvas(), 0, 0); }

function drawFrame(g: CanvasRenderingContext2D, id: ArtSlotId, name: string, i: number): void {
  switch (id) {
    case 'halvorsen': return rig(g, drawHalvorsen(name as HalvorsenPose));
    case 'recruiter': return rig(g, drawRecruiter(name as RecruiterPose));
    case 'elvis':     return rig(g, drawElvis(name as ElvisPose));
    case 'hide_box':  return rig(g, drawHideBox());
    case 'board_heads': {
      const art = [drawManager(false), drawPig(0), drawVampire(false), drawGorilla(false), drawRobot(0)][i];
      const crop = [[8, 2, 20, 16], [7, 0, 22, 16], [10, 1, 18, 16], [9, 1, 20, 16], [7, 0, 22, 16]][i];
      const src = art.flipX().toCanvas();
      g.drawImage(src, 32 - crop[0] - crop[2], crop[1], crop[2], crop[3], 0, 0, 40, 32);
      return;
    }
    case 'dad_things': {
      g.fillStyle = '#1b1620'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#ff77a8'; g.fillRect(1, 1, 14, 14);
      g.fillStyle = '#1b1620'; g.font = '8px monospace'; g.fillText(name.slice(0, 2).toUpperCase(), 2, 11);
      return;
    }
    case 'fireball': {
      const s = [12, 20, 26, 22][i], o = (24 - s) / 2;
      const col = [['#e8452c', '#ffb347', '#fff6b0'], ['#e8452c', '#ffb347', '#fff6b0'], ['#e8452c', '#ffb347', '#ffd27a'], ['#6b6470', '#e8452c', '#ffb347']][i];
      col.forEach((c, k) => { g.fillStyle = c; const inset = k * (s / 6); g.fillRect(o + inset, o + inset, s - inset * 2, s - inset * 2); });
      return;
    }
    case 'fax': {
      const f = new Fax(0, 0, null);
      if (i === 1) f.busy = 20;
      g.translate(-f.x, -f.y); f.draw(g, 0);
      return;
    }
    case 'spring': {
      const s = new Spring(0, 0);
      (s as unknown as { squash: number }).squash = i === 1 ? 5 : 0;
      g.translate(-s.x, -s.y); s.draw(g, 0);
      return;
    }
    case 'chute': { const c = new ChutePickup(0, 0); g.translate(-c.x, -c.y); c.draw(g, 0); return; }
    case 'canopy': drawCanopy(g, 25, 78); return;
    case 'clippo': drawClippo(g, 0, 0, name as ClippoFrame); return;
    case 'review_form': drawReviewForm(g, 0, 0, name as ReviewFrame); return;
    case 'cctv': { const c = new Cctv(0, 0); (c as unknown as { drawBody(g: CanvasRenderingContext2D, x: number, y: number): void }).drawBody(g, 0, -1); return; }
  }
}

/** Enemies: walkers have 4 walk frames, hoppers 2 (ground, air). */
const ENEMIES: { id: string; frames: string[]; make: (i: number) => Raster }[] = [
  { id: 'clerk', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawClerk(i) },
  { id: 'syncer', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawSyncer(i) },
  { id: 'guard', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawGuard(i) },
  { id: 'rat', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawRat(i) },
  { id: 'pig', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawPig(i) },
  { id: 'robot', frames: ['walk0', 'walk1', 'walk2', 'walk3'], make: (i) => drawRobot(i) },
  { id: 'plant', frames: ['closed', 'open'], make: (i) => drawPlant(i === 1) },
  { id: 'manager', frames: ['ground', 'air'], make: (i) => drawManager(i === 1) },
  { id: 'gorilla', frames: ['ground', 'air'], make: (i) => drawGorilla(i === 1) },
  { id: 'vampire', frames: ['ground', 'air'], make: (i) => drawVampire(i === 1) },
];

function enemyStrip(e: typeof ENEMIES[number]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 32 * e.frames.length; c.height = 32;
  const g = c.getContext('2d')!;
  e.frames.forEach((_, i) => g.drawImage(e.make(i).toCanvas(), i * 32, 0));
  return c;
}

function download(canvas: HTMLCanvasElement, name: string): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = name;
  a.click();
}

function Preview({ make, alt }: { make: () => HTMLCanvasElement; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const c = make();
    c.style.width = `${c.width * 4}px`;
    c.style.imageRendering = 'pixelated';
    c.style.background = 'repeating-conic-gradient(#2a2f4a 0 25%, #1e2133 0 50%) 0 0 / 16px 16px';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', alt);
    host.replaceChildren(c);
  }, [make, alt]);
  return <div ref={ref} style={{ overflowX: 'auto', maxWidth: '100%' }} />;
}

function Card({ title, file, size, frames, notes, make, href }: {
  title: string; file: string; size: string; frames: readonly string[]; notes: string; make: () => HTMLCanvasElement;
  /** Already a file: download it as it is. */
  href?: string;
}) {
  const [, force] = useState(0);
  return (
    <section style={{ border: '1px solid #2a2f4a', padding: 14, margin: '14px 0' }}>
      <h3 style={{ ...FONT, fontSize: 12, color: '#ffd23f', margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 13, margin: '0 0 8px', color: '#c2c3c7' }}>
        <code>{file}</code> · frame <b>{size}</b> · {frames.length} frame{frames.length === 1 ? '' : 's'}: {frames.join(', ')}
      </p>
      <Preview make={make} alt={title} />
      <p style={{ fontSize: 13, color: '#c2c3c7' }}>{notes}</p>
      {href ? (
        <a className="pixel-btn" style={{ fontSize: 10, padding: '6px 10px', textDecoration: 'none', display: 'inline-block' }} href={href} download={file.split('/').pop()}>
          ⬇ DOWNLOAD TEMPLATE
        </a>
      ) : (
        <button className="pixel-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => { download(make(), file.split('/').pop()!); force((n) => n + 1); }}>
          ⬇ DOWNLOAD TEMPLATE
        </button>
      )}
    </section>
  );
}

export default function ArtSlotsPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 0); return () => clearTimeout(t); }, []);
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ ...FONT, color: '#6cc24a', fontSize: 'clamp(16px, 3vw, 28px)', margin: 0 }}>ART SLOTS</h1>
      <p style={{ color: '#c2c3c7', fontSize: 14, maxWidth: 720 }}>
        Every sprite you can replace. Download a template (the current art, at exactly the right size),
        paint over it in Aseprite, export the PNG to the path shown, and list it in <code>game/customSprites.ts</code>.
        Full guide: <code>docs/SPRITES.md</code> and <code>docs/SPRITE_REVIEW.md</code>.
      </p>
      {ready && (
        <>
          <h2 style={{ ...FONT, fontSize: 14, marginTop: 28 }}>TERO</h2>
          {Object.entries(framePaths).map(([name, def]) => (
            <Card
              key={name}
              title={`Tero — ${name}`}
              file={`public/sprites/player/${name}.png`}
              size="64×64" frames={Array.from({ length: def.frames }, (_, i) => `${name}${i}`)}
              notes={`${def.frames} frame${def.frames === 1 ? '' : 's'} at ${def.fps} fps. Feet on y≈61, facing right.`}
              href={def.src}
              make={() => {
                const c = document.createElement('canvas');
                const img = new Image();
                img.src = def.src;
                c.width = 64 * def.frames; c.height = 64;
                img.onload = () => c.getContext('2d')!.drawImage(img, 0, 0);
                return c;
              }}
            />
          ))}
          <Card
            title="Dada"
            file="public/sprites/player/dad.png"
            size="64×64" frames={['dad']}
            notes="One square frame (bigger is fine, it's scaled down smoothly). Facing right, feet on the bottom edge. Then set dad: true in game/customSprites.ts."
            href={DAD_SRC}
            make={() => {
              const c = document.createElement('canvas');
              const img = new Image();
              img.src = DAD_SRC;
              c.width = 64; c.height = 64;
              img.onload = () => c.getContext('2d')!.drawImage(img, 0, 0, 64, 64);
              return c;
            }}
          />
          <h2 style={{ ...FONT, fontSize: 14, marginTop: 28 }}>ENEMIES</h2>
          {ENEMIES.map((e) => (
            <Card
              key={e.id} title={e.id} file={`public/sprites/enemies/${e.id}.png`} size="32×32"
              frames={e.frames} notes="Facing right, feet on the bottom edge." make={() => enemyStrip(e)}
            />
          ))}
          <h2 style={{ ...FONT, fontSize: 14, marginTop: 28 }}>BOSSES, ELVIS, GADGETS</h2>
          {ART_SLOT_IDS.map((id) => {
            const s = ART_SLOTS[id];
            return (
              <Card
                key={id} title={s.title} file={`public/sprites/art/${id}.png`} size={`${s.w}×${s.h}`}
                frames={s.frames} notes={s.notes} make={() => slotStrip(id)}
              />
            );
          })}
        </>
      )}
    </main>
  );
}
