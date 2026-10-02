// file: game/content/story/compile.ts
//
// Turns the writer-friendly script (inline lines, no ids) into the pack's
// StoryCard / Chapter / per-level fields. Card ids are generated from where
// the line sits, e.g. `b_card_level_2_trigger_0_1`.

import type { Chapter, StoryCard, StoryTrigger, SpriteId, SceneryPlacement, GagMood, GagDensity } from '../types';
import type { GagId } from '../../render/office/gags';
import type { DecorId } from '../../render/office/decor';

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
    /** Background gags at fixed spots — hints about what happened here. */
    scenery?: { atTile: number; gag: GagId }[];
    /** 'unhinged' fills the level with the weirder tier-2 gags first. */
    mood?: GagMood;
    /** Tero's crayon slogan above the elevator at the end of the floor. */
    goalWriting?: GagId;
    /** 'sparse' spaces the random gags out more. Default 'normal'. */
    density?: GagDensity;
    /** The floor's look: wallpaper, carpet, desks, background. */
    decor?: DecorId;
    /** Tile ranges [from, to] with no random gags — empty corridors. */
    quiet?: [number, number][];
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
  scenery?: SceneryPlacement[];
  gagMood?: GagMood;
  goalWriting?: string;
  gagDensity?: GagDensity;
  decor?: string;
  quietZones?: [number, number][];
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
      scenery: L.scenery?.map((g) => ({ tx: g.atTile, gag: g.gag })),
      gagMood: L.mood,
      goalWriting: L.goalWriting,
      gagDensity: L.density,
      decor: L.decor,
      quietZones: L.quiet,
    };
  }

  return { cards, chapters, levels };
}
