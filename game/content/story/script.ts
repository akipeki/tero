// file: game/content/story/script.ts
//
// ── THE STORY ── edit this file to change what characters say.
//
// Each line is { who, text }. Leave `who` out for narration. Use "\n" inside
// `text` for a line break. Keep a card to ~3 short lines so it fits the box.
//
//   cast      — everyone who speaks. `who` must be one of these keys
//               (TypeScript flags a typo).
//   chapters  — groups of levels. A chapter's intro plays before its first level.
//   levels    — keyed by built-in level id ('1', '2', ...):
//                 intro     plays before the level starts
//                 outro     plays when the player reaches the goal
//                 triggers  play when the player first walks past tile column `atTile`
//
// Intros don't replay when the player retries a level.

import { defineStory } from './compile';

export const STORY = defineStory({
  cast: {
    tero:  { name: 'TERO', portrait: 'b_sprite_player_idle' },
    boss:  { name: 'MR. HALVORSEN' },
    doris: { name: 'DORIS, ACCOUNTING' },
    it:    { name: 'GARY FROM IT' },
  },

  chapters: [
    {
      id: 'monday',
      name: 'Monday, 1993',
      levels: ['1', '2', '3'],
      intro: [
        { text: 'MONDAY, 8:58 AM.\nOMNIDATA CORP. 12 FLOORS OF BEIGE.' },
        { who: 'boss', text: 'Tero! The Quarterly Report.\nOn my desk. Floor 12. Before five.' },
        { who: 'tero', text: 'It\'s on a floppy somewhere\nin this building... right?' },
      ],
    },
  ],

  levels: {
    '1': {
      intro: [
        { text: 'FLOOR 1 — THE MAILROOM.' },
        { who: 'tero', text: 'Okay. Mailroom first.\nNobody ever comes down here.' },
      ],
      triggers: [
        {
          atTile: 41,
          lines: [
            { who: 'it', text: 'Psst. Your floppy went up\nin the internal mail. Floor 6.' },
          ],
        },
      ],
      outro: [
        { who: 'tero', text: 'Elevator! Floor 6, here I come.' },
      ],
    },

    '2': {
      intro: [
        { text: 'FLOOR 6 — THE CUBICLE FARM.' },
        { who: 'doris', text: 'Don\'t you DARE touch\nmy stapler, intern.' },
      ],
      triggers: [
        {
          atTile: 32,
          lines: [
            { who: 'doris', text: 'Your little disk? Gary took it\nto the boardroom. Coffee\'s fresh.' },
          ],
        },
      ],
      outro: [
        { who: 'tero', text: 'Boardroom. Floor 12.\nNo pressure.' },
      ],
    },

    '3': {
      intro: [
        { text: 'FLOOR 12 — THE BOARDROOM.\n4:51 PM.' },
        { who: 'boss', text: 'Nine minutes, Tero.\nI can hear the clock ticking.' },
      ],
      triggers: [
        {
          atTile: 58,
          lines: [
            { who: 'tero', text: 'I can see the door.\nAlmost there...' },
          ],
        },
      ],
      outro: [
        { who: 'boss', text: '4:59. Hm.\nSee you Tuesday, Tero.' },
        { text: 'TO BE CONTINUED...' },
      ],
    },
  },
});
