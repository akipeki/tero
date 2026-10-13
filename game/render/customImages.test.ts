import { describe, it, expect } from 'vitest';
import { stripLayout } from './customImages';
import { CUSTOM_SPRITES } from '../customSprites';
import { GAGS } from './office/gags';

describe('custom sprites', () => {
  it('reads square frames from a strip', () => {
    expect(stripLayout(512, 64)).toEqual({ frames: 8, fw: 64, fh: 64 });
    expect(stripLayout(1024, 1024)).toEqual({ frames: 1, fw: 1024, fh: 1024 });
  });

  it('honours an explicit frame count for non-square frames', () => {
    expect(stripLayout(300, 100, 2)).toEqual({ frames: 2, fw: 150, fh: 100 });
  });

  it('lists only props that exist', () => {
    for (const id of CUSTOM_SPRITES.props) expect(GAGS[id], id).toBeTruthy();
  });
});
