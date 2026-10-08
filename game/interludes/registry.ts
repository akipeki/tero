// file: game/interludes/registry.ts — interlude id → a fresh instance.

import type { Interlude, InterludeId } from './Interlude';
import { AcquisitionIntro, UnskippableAd } from './acquisition';
import { Cubicle3D } from './cubicle3d';
import { QuarterlyReview } from './review';
import { ElevatorMuzak } from './muzak';
import { TermsAndConditions } from './terms';
import { NapTime } from './nap';
import { DesktopCrash } from './desktop';
import { OnboardingVhs } from './onboarding';
import { Captcha } from './captcha';
import { OnMute } from './mute';
import { OfficeChairGP } from './kart';

const MAKERS: Partial<Record<InterludeId, () => Interlude>> = {
  acquisition: () => new AcquisitionIntro(),
  unskippable_ad: () => new UnskippableAd(),
  cubicle3d: () => new Cubicle3D(),
  review: () => new QuarterlyReview(),
  muzak: () => new ElevatorMuzak(),
  terms: () => new TermsAndConditions(),
  nap: () => new NapTime(),
  desktop: () => new DesktopCrash(),
  onboarding: () => new OnboardingVhs(),
  captcha: () => new Captcha(),
  mute: () => new OnMute(),
  kart: () => new OfficeChairGP(),
};

export function makeInterlude(id: InterludeId): Interlude {
  const make = MAKERS[id];
  if (!make) throw new Error(`No interlude called "${id}"`);
  return make();
}
