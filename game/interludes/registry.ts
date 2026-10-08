// file: game/interludes/registry.ts — interlude id → a fresh instance.

import type { Interlude, InterludeId } from './Interlude';
import { AcquisitionIntro, UnskippableAd } from './acquisition';

const MAKERS: Partial<Record<InterludeId, () => Interlude>> = {
  acquisition: () => new AcquisitionIntro(),
  unskippable_ad: () => new UnskippableAd(),
};

export function makeInterlude(id: InterludeId): Interlude {
  const make = MAKERS[id];
  if (!make) throw new Error(`No interlude called "${id}"`);
  return make();
}
