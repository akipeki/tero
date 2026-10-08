// file: game/interludes/registry.ts — interlude id → a fresh instance.

import type { Interlude, InterludeId } from './Interlude';
import { AcquisitionIntro, UnskippableAd } from './acquisition';
import { Cubicle3D } from './cubicle3d';

const MAKERS: Partial<Record<InterludeId, () => Interlude>> = {
  acquisition: () => new AcquisitionIntro(),
  unskippable_ad: () => new UnskippableAd(),
  cubicle3d: () => new Cubicle3D(),
};

export function makeInterlude(id: InterludeId): Interlude {
  const make = MAKERS[id];
  if (!make) throw new Error(`No interlude called "${id}"`);
  return make();
}
