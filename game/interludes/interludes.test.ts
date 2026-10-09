import { describe, it, expect } from 'vitest';
import { INTERLUDE_IDS } from './Interlude';
import { STORY } from '../content/story/script';
import { MAP } from './cubicle3d';
import { chart } from './muzak';
import { TermsAndConditions } from './terms';
import { Secrets } from '../Secrets';

describe('interludes', () => {
  it('every interlude the story asks for exists', () => {
    const asked: string[] = [];
    for (const level of Object.values(STORY.levels)) {
      for (const t of level.triggers ?? []) {
        if (t.effect?.startsWith('interlude:')) asked.push(t.effect.slice('interlude:'.length));
      }
    }
    expect(asked.length).toBeGreaterThanOrEqual(10);
    for (const id of asked) expect(INTERLUDE_IDS).toContain(id);
  });

  it('Cubicle 3D: the keycard and the exit can be reached from the start', () => {
    const walk = new Set(['.', 'S', 'K', 'G', 'p', 'w']);
    const find = (c: string) => { for (let y = 0; y < MAP.length; y++) { const x = MAP[y].indexOf(c); if (x >= 0) return [x, y]; } return [-1, -1]; };
    const [sx, sy] = find('S');
    const seen = new Set([`${sx},${sy}`]);
    const queue = [[sx, sy]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (!seen.has(k) && walk.has(MAP[ny]?.[nx] ?? '#')) { seen.add(k); queue.push([nx, ny]); }
      }
    }
    const [kx, ky] = find('K');
    const [ex, ey] = find('E');
    expect(seen.has(`${kx},${ky}`)).toBe(true);
    expect(seen.has(`${ex + 1},${ey}`)).toBe(true);
    expect(MAP.every((r) => r.length === MAP[0].length)).toBe(true);
  });

  it('Elevator Muzak: the chart uses all four buttons, fairly evenly', () => {
    const lanes = [0, 0, 0, 0];
    for (const n of chart()) lanes[n.lane]++;
    const total = lanes.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(30);
    for (const l of lanes) expect(l / total).toBeGreaterThan(0.12);
  });

  it('Terms & Conditions: every clause is within one jump of the last', () => {
    const tc = new TermsAndConditions() as unknown as { rows: { y: number }[] };
    const apex = 6.6 ** 2 / (2 * 0.32);
    for (let i = 1; i < tc.rows.length; i++) {
      expect(tc.rows[i - 1].y - tc.rows[i].y).toBeLessThan(apex - 10);
    }
  });

  it('secrets fire once each', () => {
    const s = new Secrets();
    const sig = { idle: 0, calls: 0, backwards: 0, burnt: 0, deaths: 0, boxed: 0 };
    expect(s.check(sig)).toBeNull();
    sig.idle = 20 * 60;
    expect(s.check(sig)).toMatch(/IDLE/);
    expect(s.check(sig)).toBeNull();
    sig.deaths = 5;
    expect(s.check(sig)).toMatch(/WEBINAR/);
  });
});
