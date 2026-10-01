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
//                 scenery   background gags at fixed tile columns — use them to hint
//                           at what happened here (ids: game/render/office/gags.ts).
//                           The rest of each level is filled with random gags.
//                 goalWriting  Tero's crayon slogan above the elevator (his flagpole)
//                 mood      'unhinged' lets the auto-fill use the weird tier-2 gags
//                           (and use them first). Default is 'tame'.
//
// Intros don't replay when the player retries a level.

import { defineStory } from './compile';

export const STORY = defineStory({
  cast: {
    tero:  { name: 'TERO (AGE 2)', portrait: 'b_sprite_player_idle' },
    dad:   { name: 'DAD', portrait: 'b_sprite_dad' },
    boss:  { name: 'MR. HALVORSEN' },
    doris: { name: 'DORIS, ACCOUNTING' },
    it:    { name: 'GARY FROM IT' },
    board: { name: 'THE BOARD' },
  },

  chapters: [
    {
      id: 'monday',
      name: 'Getting in',
      levels: ['1', '2', '3'],
      intro: [
        { text: 'SIX MONTHS AGO, THE COMPANY ASKED DAD\nTO GIVE A LITTLE BIT MORE.' },
        { who: 'boss', text: 'Just a few extra hours. For the family.\nThe COMPANY family.' },
        { text: 'DAD NEVER CAME HOME.' },
        { text: 'TERO, AGE 2, HAS HAD ENOUGH.' },
        { who: 'tero', text: 'Dada.' },
      ],
    },
    {
      id: 'tuesday',
      name: 'The ascent',
      levels: ['4', '5', '6'],
      intro: [
        { text: 'THE OFFICE KEEPS GOING UP.\nSO DOES TERO.' },
        { who: 'it', text: 'Your dad got promoted to floor 33.\nThe Board took him.' },
        { who: 'tero', text: 'Bad board.' },
        { text: 'NOBODY COMES BACK DOWN FROM 33.\nNOBODY HAS EVER SENT A TODDLER.' },
      ],
    },
  ],

  levels: {
    '1': {
      goalWriting: 'crayon_power',
      intro: [
        { text: 'FLOOR 1 — THE MAILROOM.' },
        { who: 'tero', text: 'Dada? Dada!' },
      ],
      triggers: [
        {
          atTile: 17,
          lines: [
            { text: 'DAD\'S OLD DESK. HIS FACE IN THE PHOTO\nHAS BEEN REPLACED BY A STICKY NOTE.' },
            { who: 'tero', text: 'Dada... T. B. D.?' },
          ],
        },
        {
          atTile: 37,
          lines: [
            { who: 'tero', text: 'Uh oh. Copier owie.' },
          ],
        },
        {
          atTile: 41,
          lines: [
            { who: 'it', text: 'A baby dragon? In the mailroom?\nOh. You\'re #4471\'s kid.' },
            { who: 'it', text: 'He got moved up. Floor 6.\nAccounts did the copier, by the way.' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'party_aftermath' },
        { atTile: 15, gag: 'banner_mondays' },
        { atTile: 17, gag: 'dad_photo' },
        { atTile: 34, gag: 'copier_slain' },
        { atTile: 52, gag: 'supply_closet' },
      ],
      outro: [
        { who: 'tero', text: 'Up! UP!' },
      ],
    },

    '2': {
      goalWriting: 'crayon_want',
      intro: [
        { text: 'FLOOR 6 — THE CUBICLE FARM.' },
        { who: 'doris', text: 'Brrrains... I mean, BUDGETS.\nIs that a BABY? On a WEEKDAY?' },
      ],
      triggers: [
        {
          atTile: 14,
          lines: [
            { text: 'DAD\'S MUG. THE COFFEE IN IT\nIS SIX MONTHS COLD.' },
            { who: 'tero', text: '...Dada mug.' },
          ],
        },
        {
          atTile: 32,
          lines: [
            { who: 'doris', text: 'Your father? Boardroom, sweetie.\nHave a bottle of coffee. Grow up fast.' },
          ],
        },
        {
          atTile: 47,
          lines: [
            { who: 'tero', text: 'Das Kapital for Toddlers:\nWho owns our dadas?' },
          ],
        },
      ],
      scenery: [
        { atTile: 11, gag: 'fridge_notes' },
        { atTile: 14, gag: 'dad_mug' },
        { atTile: 30, gag: 'copier_butt' },
        { atTile: 46, gag: 'money_shrine' },
      ],
      outro: [
        { who: 'tero', text: 'Bottle good. More bottle.' },
      ],
    },

    '3': {
      goalWriting: 'crayon_resource',
      intro: [
        { text: 'FLOOR 12 — THE BOARDROOM.' },
        { who: 'boss', text: 'Your father is in a meeting.\nHe has been in a meeting since March.' },
      ],
      triggers: [
        {
          atTile: 10,
          lines: [
            { text: 'DAD\'S CALENDAR. EVERY DAY CROSSED OUT.\nONE DAY CIRCLED: "HOME?"' },
          ],
        },
        {
          atTile: 48,
          lines: [
            { who: 'tero', text: 'Meet. ???. Profit.' },
            { who: 'tero', text: '...Dumb.' },
          ],
        },
        {
          atTile: 58,
          lines: [
            { who: 'boss', text: 'He\'s been promoted. Floor 33.\nYou\'ll never get past Legal.' },
            { who: 'tero', text: 'DADA IS NOT A RESOURCE.' },
          ],
        },
      ],
      scenery: [
        { atTile: 1,  gag: 'employee_month' },
        { atTile: 10, gag: 'dad_calendar' },
        { atTile: 20, gag: 'banner_q4' },
        { atTile: 45, gag: 'whiteboard' },
        { atTile: 60, gag: 'sign_hr' },
      ],
      outro: [
        { who: 'tero', text: 'Dada. Floor. Thirty. Free.' },
        { text: 'MEANWHILE, ON FLOOR 33...' },
        { who: 'dad', text: '...What month is it?' },
      ],
    },

    // ── Chapter 2: the floors where things got weird ────────────────────────

    '4': {
      goalWriting: 'crayon_unite',
      mood: 'unhinged',
      intro: [
        { text: 'FLOOR 13 — LEGAL.\nABANDON HOPE. BILLED HOURLY.' },
      ],
      triggers: [
        {
          atTile: 33,
          lines: [
            { text: '"PROJECT ORPHANAGE." DAD\'S COMPANY\nIS EVICTING KIDS WHO HAVE NO DADS AT ALL.' },
            { who: 'tero', text: 'NO.' },
          ],
        },
        {
          atTile: 52,
          lines: [
            { text: 'A SOUL TRANSFER AGREEMENT.\nSIGNED: #4471.' },
            { who: 'tero', text: 'Dada soul?!' },
          ],
        },
      ],
      scenery: [
        { atTile: 5,  gag: 'banner_capitalism' },
        { atTile: 30, gag: 'orphan_plan' },
        { atTile: 50, gag: 'soul_contract' },
        { atTile: 62, gag: 'banner_family' },
      ],
      outro: [
        { who: 'tero', text: 'Tear up. Tear UP.' },
      ],
    },

    '5': {
      goalWriting: 'crayon_go_home',
      mood: 'unhinged',
      intro: [
        { text: 'FLOOR 21 — R&D.\n(RAGE & DEPRESSION)' },
        { who: 'it', text: 'Careful, kid. They just found out\nthe bonus pool is a kiddie pool.' },
      ],
      triggers: [
        {
          atTile: 27,
          lines: [
            { who: 'tero', text: 'Axe. Computer. Ouchie.' },
          ],
        },
        {
          atTile: 43,
          lines: [
            { text: 'A SLEEPING BAG UNDER A DESK.\nDAD\'S SLIPPERS. DAD\'S PILLOW.' },
            { who: 'tero', text: 'Dada sleep... HERE?' },
          ],
        },
        {
          atTile: 52,
          lines: [
            { who: 'tero', text: 'Wheel go round.\nNobody go anywhere.' },
          ],
        },
        {
          atTile: 59,
          lines: [
            { who: 'tero', text: 'Doggy!' },
            { who: 'it', text: 'That\'s the VP of Sales.\nBest quarter we ever had.' },
          ],
        },
      ],
      scenery: [
        { atTile: 10, gag: 'banner_fun_lasted' },
        { atTile: 25, gag: 'smashed_pc' },
        { atTile: 34, gag: 'flipped_desk' },
        { atTile: 42, gag: 'dad_cot' },
        { atTile: 50, gag: 'intern_wheel' },
        { atTile: 58, gag: 'poodle_desk' },
      ],
      outro: [
        { who: 'it', text: 'Top floor\'s next. Go get him, kid.' },
      ],
    },

    '6': {
      goalWriting: 'crayon_power',
      mood: 'unhinged',
      intro: [
        { text: 'FLOOR 33 — THE SHAREHOLDERS\' SANCTUM.' },
        { who: 'board', text: 'A CHILD? HERE?\nWHAT IS ITS QUARTERLY OUTPUT?' },
      ],
      triggers: [
        {
          atTile: 29,
          lines: [
            { who: 'tero', text: 'Chair. Money. ...Yucky.' },
          ],
        },
        {
          atTile: 68,
          lines: [
            { who: 'tero', text: 'DADA!!' },
            { who: 'dad', text: '...Tero? Is it the weekend?' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'banner_growth' },
        { atTile: 15, gag: 'coffee_iv' },
        { atTile: 27, gag: 'money_throne' },
        { atTile: 40, gag: 'sign_shareholders' },
        { atTile: 47, gag: 'lost_and_found' },
        { atTile: 69, gag: 'dad_desk' },
      ],
      outro: [
        { text: 'TERO HOLDS UP DAD\'S TIE.\nSIX MONTHS OF FLOOR DUST ON IT.' },
        { who: 'dad', text: 'I... I came in for "a few extra hours."' },
        { who: 'tero', text: 'You gave them everything.\nWe got the leftovers.' },
        { who: 'board', text: 'HE HAS A DELIVERABLE DUE.' },
        { text: 'DAD CLOSES THE LAPTOP.' },
        { who: 'dad', text: 'Let\'s go home, buddy.' },
        { who: 'tero', text: 'Home.' },
        { text: 'DAD TOOK THE REST OF THE YEAR OFF.\nTHE QUARTERLY REPORT WAS LATE.\nNOBODY DIED.' },
      ],
    },
  },
});
