import { describe, expect, it } from 'vitest';
import { ART_SLOTS, ART_SLOT_IDS } from './artSlots';
import { DAD_THINGS } from './creaturesAndObjects/Gadgets';
import { drawElvis, ELVIS_W, ELVIS_H, drawRecruiter, RECRUITER_W, RECRUITER_H, type ElvisPose, type RecruiterPose } from './render/characters/creatures';
import { drawHalvorsen, HALVORSEN_W, HALVORSEN_H, drawHideBox, type HalvorsenPose } from './render/characters/humans';

describe('art slots', () => {
  it('every slot is described and its frame names are unique', () => {
    for (const id of ART_SLOT_IDS) {
      const s = ART_SLOTS[id];
      expect(s.id).toBe(id);
      expect(new Set(s.frames).size).toBe(s.frames.length);
      expect(s.w).toBeGreaterThan(0);
    }
  });

  it('Dad\'s things: one frame per thing, in the game\'s order', () => {
    expect(ART_SLOTS.dad_things.frames).toEqual(Object.keys(DAD_THINGS));
  });

  it('slot sizes match the built-in art they replace', () => {
    for (const f of ART_SLOTS.elvis.frames) {
      const r = drawElvis(f as ElvisPose);
      expect([r.w, r.h]).toEqual([ELVIS_W, ELVIS_H]);
    }
    for (const f of ART_SLOTS.recruiter.frames) expect(drawRecruiter(f as RecruiterPose).w).toBe(RECRUITER_W);
    for (const f of ART_SLOTS.halvorsen.frames) expect(drawHalvorsen(f as HalvorsenPose).h).toBe(HALVORSEN_H);
    expect([ART_SLOTS.elvis.w, ART_SLOTS.elvis.h]).toEqual([ELVIS_W, ELVIS_H]);
    expect([ART_SLOTS.recruiter.w, ART_SLOTS.recruiter.h]).toEqual([RECRUITER_W, RECRUITER_H]);
    expect([ART_SLOTS.halvorsen.w, ART_SLOTS.halvorsen.h]).toEqual([HALVORSEN_W, HALVORSEN_H]);
    const box = drawHideBox();
    expect([box.w, box.h]).toEqual([ART_SLOTS.hide_box.w, ART_SLOTS.hide_box.h]);
  });

  it('THE BOARD has a frame per head', () => {
    expect(ART_SLOTS.board_heads.frames).toHaveLength(5);
  });
});
