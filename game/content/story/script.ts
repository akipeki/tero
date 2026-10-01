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
        { text: 'IN A WORLD WHERE DRAGONS TELL\nSCARY STORIES ABOUT HUMANS...' },
        { text: 'OMNIDATA CORP. 12 FLOORS OF BEIGE\nCUBICLES AND SHUFFLING MIDDLE MANAGERS.' },
        { who: 'boss', text: 'Grrrnnh... Tero. The Quarterly Report.\nFloor 12. My desk. Before five.' },
        { who: 'tero', text: 'Nobody will notice I\'m a dragon.\nI\'m wearing a tie.' },
      ],
    },
  ],

  levels: {
    '1': {
      intro: [
        { text: 'FLOOR 1 — THE MAILROOM.' },
        { who: 'tero', text: 'Office rule number one:\ndon\'t let the humans touch you.' },
      ],
      triggers: [
        {
          atTile: 41,
          lines: [
            { who: 'it', text: 'Psst. Big green guy. Your floppy\nwent up in the internal mail. Floor 6.' },
            { who: 'tero', text: 'You can see I\'m a dragon?' },
            { who: 'it', text: 'I work in IT. I\'ve seen worse.' },
          ],
        },
      ],
      outro: [
        { who: 'tero', text: 'Elevator! Hold the door!\n...Why is everyone moaning?' },
      ],
    },

    '2': {
      intro: [
        { text: 'FLOOR 6 — THE CUBICLE FARM.' },
        { who: 'doris', text: 'Brrrains... I mean, BUDGETS.\nDon\'t you DARE touch my stapler.' },
      ],
      triggers: [
        {
          atTile: 32,
          lines: [
            { who: 'doris', text: 'Your little disk? The managers took it\nto the boardroom. Have some coffee.' },
            { who: 'tero', text: 'Coffee makes me BIG.\nBig dragon. Big energy.' },
          ],
        },
      ],
      outro: [
        { who: 'tero', text: 'Boardroom. Floor 12.\nNo pressure. No pressure at all.' },
      ],
    },

    '3': {
      intro: [
        { text: 'FLOOR 12 — THE BOARDROOM.\n4:51 PM.' },
        { who: 'boss', text: 'Nine minutes, Tero.\nI can hear the clock... ticking.' },
      ],
      triggers: [
        {
          atTile: 58,
          lines: [
            { who: 'tero', text: 'I can see the elevator.\nAlmost there...' },
          ],
        },
      ],
      outro: [
        { who: 'boss', text: '4:59. Hm. Adequate.\n...Nice tie.' },
        { who: 'tero', text: '(He didn\'t notice!)' },
        { text: 'TO BE CONTINUED...' },
      ],
    },
  },
});
