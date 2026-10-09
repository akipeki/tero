// file: game/content/story/validate.ts
//
// Finds story references that point at cards that don't exist — e.g. a level
// intro still listing a card that was deleted in the editor.

import type { ContentPack } from '../types';

/** Returns one human-readable message per dangling card reference. */
export function findMissingCardRefs(pack: ContentPack): string[] {
  const missing: string[] = [];
  const check = (where: string, ids: string[] | undefined) => {
    for (const id of ids ?? []) {
      if (!pack.story.cards[id]) missing.push(`${where} → ${id}`);
    }
  };
  for (const c of pack.story.chapters) check(`chapter ${c.id} intro`, c.intro);
  for (const L of Object.values(pack.levels)) {
    check(`level ${L.id} intro`, L.intro);
    check(`level ${L.id} outro`, L.outro);
    L.triggers?.forEach((t, i) => check(`level ${L.id} trigger ${i}`, t.cards));
  }
  return missing;
}
