// file: game/content/story/compile.ts
//
// Turns the writer-friendly script (inline lines, no ids) into the pack's
// StoryCard / Chapter / per-level fields. Card ids are generated from where
// the line sits, e.g. `b_card_level_2_trigger_0_1`.

import type { Chapter, StoryCard, StoryTrigger, SpriteId } from '../types';

export interface CastMember {
  name: string;
  portrait?: SpriteId;
}

export interface Line<C extends string> {
  /** Cast key. Omit for narration. */
  who?: C;
  text: string;
}

export interface StoryScript<C extends string> {
  cast: Record<C, CastMember>;
  chapters: {
    id: string;
    name: string;
    /** Built-in level ids in play order. */
    levels: string[];
    intro?: Line<C>[];
  }[];
  levels: Record<string, {
    intro?: Line<C>[];
    outro?: Line<C>[];
    triggers?: { atTile: number; lines: Line<C>[] }[];
  }>;
}

/** Identity function that pins `who` to the cast keys, so typos fail to compile. */
export function defineStory<C extends string>(script: StoryScript<C>): StoryScript<C> {
  return script;
}

export interface LevelStory {
  intro?: string[];
  outro?: string[];
  triggers?: StoryTrigger[];
}

export interface CompiledStory {
  cards: Record<string, StoryCard>;
  chapters: Chapter[];
  /** Keyed by pack level id (`b_level_<id>`). */
  levels: Record<string, LevelStory>;
}

export function compileStory<C extends string>(script: StoryScript<C>): CompiledStory {
  const cards: Record<string, StoryCard> = {};

  const emit = (prefix: string, lines: Line<C>[] | undefined): string[] | undefined => {
    if (!lines?.length) return undefined;
    return lines.map((line, i) => {
      const id = `${prefix}_${i}`;
      const member = line.who ? script.cast[line.who] : undefined;
      if (line.who && !member) throw new Error(`Story: unknown speaker "${line.who}" in ${id}`);
      cards[id] = {
        id,
        text: line.text,
        ...(member && { speaker: member.name }),
        ...(member?.portrait && { portrait: member.portrait }),
      };
      return id;
    });
  };

  const chapters: Chapter[] = script.chapters.map((c) => ({
    id: `b_chapter_${c.id}`,
    name: c.name,
    levelIds: c.levels.map((l) => `b_level_${l}`),
    intro: emit(`b_card_chapter_${c.id}_intro`, c.intro),
  }));

  const levels: Record<string, LevelStory> = {};
  for (const [lid, L] of Object.entries(script.levels)) {
    const base = `b_card_level_${lid}`;
    levels[`b_level_${lid}`] = {
      intro: emit(`${base}_intro`, L.intro),
      outro: emit(`${base}_outro`, L.outro),
      triggers: L.triggers?.map((t, i) => ({
        tx: t.atTile,
        cards: emit(`${base}_trigger_${i}`, t.lines) ?? [],
      })),
    };
  }

  return { cards, chapters, levels };
}
