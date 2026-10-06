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
//                 decor     the floor's look (render/office/decor.ts): basement,
//                           cubicles, boardroom, legal, lab, security, executive, penthouse
//                 quiet     [from, to] tile ranges the random gags leave empty
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
    guard: { name: 'SECURITY' },
    pig:   { name: 'VP OF SYNERGY' },
  },

  chapters: [
    {
      id: 'monday',
      name: 'Getting in',
      levels: ['1', '2', '3'],
      // One card, then play. The rest of the backstory is on the walls
      // (memo_more, sign_tape in level 1's scenery).
      intro: [
        { text: 'DAD WENT TO WORK SIX MONTHS AGO.\nHE NEVER CAME HOME.' },
      ],
    },
    {
      id: 'tuesday',
      name: 'The ascent',
      levels: ['4', '5', '7', '8', '6'],
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
      decor: 'basement',
      density: 'sparse',
      goalWriting: 'crayon_power',
      // The Monday rush and the leak crossing stay readable: no random gags there.
      quiet: [[19, 31], [49, 56]],
      triggers: [
        {
          // Dad's old desk. This is what makes Tero angry enough to breathe fire.
          atTile: 12,
          lines: [
            { text: 'DAD\'S OLD DESK. HIS FACE IN THE PHOTO\nHAS BEEN REPLACED BY A STICKY NOTE.' },
            { who: 'tero', text: 'Dada... T. B. D.?' },
            { who: 'tero', text: '...GRRRRR.' },
          ],
          effect: 'tantrum',
        },
        {
          atTile: 33,
          lines: [
            { text: 'TIP: X = FIRE. NOT ANGRY ENOUGH?\nEVEN A TINY PUFF BURNS PAPERWORK.' },
          ],
        },
        {
          atTile: 37,
          lines: [
            { who: 'tero', text: 'Uh oh. Copier owie.' },
          ],
        },
        {
          atTile: 40,
          lines: [
            { who: 'it', text: 'A baby dragon? In the mailroom?\nOh. You\'re #4471\'s kid.' },
            { who: 'it', text: 'You sent Brenda HOME? She\'s been\nhere since 1987. Your dad\'s on 6.' },
          ],
        },
      ],
      scenery: [
        { atTile: 1,  gag: 'memo_more' },
        { atTile: 0,  gag: 'party_aftermath' },
        { atTile: 6,  gag: 'sign_tape' },
        { atTile: 11, gag: 'dad_photo' },
        { atTile: 21, gag: 'banner_mondays' },
        { atTile: 36, gag: 'copier_slain' },
        { atTile: 45, gag: 'wet_floor_sign' },
        { atTile: 59, gag: 'sign_incident' },
        { atTile: 66, gag: 'grave_mark' },
        { atTile: 71, gag: 'vhs_archive' },
      ],
      outro: [
        { who: 'tero', text: 'Up! UP!' },
      ],
    },

    '2': {
      decor: 'cubicles',
      // a long, empty corridor after the opening: just the SYNERGY poster
      quiet: [[19, 34]],
      density: 'sparse',
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
          atTile: 18,
          lines: [
            { text: 'TIP: DON\'T MAKE EYE CONTACT.\nHOLD DOWN TO HIDE IN A BOX.' },
          ],
        },
        {
          atTile: 66,
          lines: [
            { who: 'doris', text: 'Your father? Boardroom, sweetie.\nHave a bottle of coffee. Grow up fast.' },
          ],
        },
        {
          atTile: 77,
          lines: [
            { who: 'tero', text: 'Das Kapital for Toddlers:\nWho owns our dadas?' },
          ],
        },
      ],
      scenery: [
        { atTile: 4,  gag: 'dead_xmas_tree' },
        { atTile: 11, gag: 'fridge_notes' },
        { atTile: 14, gag: 'dad_mug' },
        { atTile: 25, gag: 'poster_synergy' },
        { atTile: 35, gag: 'water_dispenser' },
        { atTile: 76, gag: 'money_shrine' },
        { atTile: 80, gag: 'vending_snacks' },
      ],
      outro: [
        { who: 'tero', text: 'Bottle good. More bottle.' },
      ],
    },

    '3': {
      decor: 'boardroom',
      density: 'sparse',
      goalWriting: 'crayon_resource',
      // The arena stays clean: just the projector screen and the elevator.
      quiet: [[60, 79]],
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
          atTile: 47,
          lines: [
            { who: 'tero', text: 'Meet. ???. Profit.' },
            { who: 'tero', text: '...Dumb.' },
          ],
        },
        {
          // The boss fight. The door shuts behind Tero once the lines are done.
          atTile: 65,
          lines: [
            { who: 'boss', text: 'Ah. The toddler. Take a seat.\nThis meeting has 47 slides.' },
            { who: 'tero', text: 'No.' },
            { who: 'boss', text: 'Your father? Promoted. Floor 33.\nYou\'ll never get past Legal.' },
            { who: 'tero', text: 'DADA IS NOT A RESOURCE.' },
          ],
          effect: 'boss',
        },
      ],
      scenery: [
        { atTile: 1,  gag: 'employee_month' },
        { atTile: 10, gag: 'dad_calendar' },
        { atTile: 20, gag: 'banner_q4' },
        { atTile: 31, gag: 'room_closed' },
        { atTile: 45, gag: 'whiteboard' },
        { atTile: 55, gag: 'copier_jam' },
      ],
      outro: [
        { who: 'tero', text: 'Dada. Floor. Thirty. Free.' },
        { text: 'MEANWHILE, ON FLOOR 33...' },
        { who: 'dad', text: '...What month is it?' },
      ],
    },

    // ── Chapter 2: the floors where things got weird ────────────────────────

    '4': {
      decor: 'legal',
      goalWriting: 'crayon_unite',
      mood: 'unhinged',
      intro: [
        { text: 'FLOOR 13 — LEGAL.\nABANDON HOPE. BILLED HOURLY.' },
      ],
      triggers: [
        {
          atTile: 7,
          lines: [
            { text: 'RED TAPE. SLOW, STICKY,\nAND VERY, VERY FLAMMABLE.' },
            { who: 'tero', text: 'Pff.' },
          ],
        },
        {
          atTile: 34,
          lines: [
            { text: '"PROJECT ORPHANAGE." DAD\'S COMPANY\nIS EVICTING KIDS WHO HAVE NO DADS AT ALL.' },
            { who: 'tero', text: 'NO.' },
          ],
        },
        {
          atTile: 50,
          lines: [
            { text: 'A SOUL TRANSFER AGREEMENT.\nSIGNED: #4471.' },
            { who: 'tero', text: 'Dada soul?!' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'banner_capitalism' },
        { atTile: 20, gag: 'room_review' },
        { atTile: 32, gag: 'orphan_plan' },
        { atTile: 48, gag: 'soul_contract' },
        { atTile: 60, gag: 'banner_family' },
        { atTile: 71, gag: 'vhs_archive' },
      ],
      outro: [
        { who: 'tero', text: 'Tear up. Tear UP.' },
      ],
    },

    '5': {
      decor: 'lab',
      goalWriting: 'crayon_go_home',
      mood: 'unhinged',
      // keep the clean room and the spill readable
      quiet: [[14, 28], [61, 75]],
      intro: [
        { text: 'FLOOR 21 — R&D.\n(RAGE & DEPRESSION)' },
        { who: 'it', text: 'Careful, kid. They just found out\nthe bonus pool is a kiddie pool.' },
      ],
      triggers: [
        {
          atTile: 7,
          lines: [
            { text: 'PROTOTYPE: HUMAN FAX. STAND AT A FAX,\nPRESS DOWN. SIDE EFFECTS: MILD.' },
            { who: 'tero', text: '...Beep boop?' },
          ],
        },
        {
          atTile: 20,
          lines: [
            { who: 'tero', text: 'Axe. Computer. Ouchie.' },
          ],
        },
        {
          atTile: 34,
          lines: [
            { text: 'A SLEEPING BAG UNDER A DESK.\nDAD\'S SLIPPERS. DAD\'S PILLOW.' },
            { who: 'tero', text: 'Dada sleep... HERE?' },
          ],
        },
        {
          atTile: 51,
          lines: [
            { who: 'tero', text: 'Wheel go round.\nNobody go anywhere.' },
          ],
        },
        {
          atTile: 58,
          lines: [
            { who: 'tero', text: 'Doggy!' },
            { who: 'it', text: 'That\'s the VP of Sales.\nBest quarter we ever had.' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'banner_fun_lasted' },
        { atTile: 23, gag: 'smashed_pc' },
        { atTile: 33, gag: 'dad_cot' },
        { atTile: 36, gag: 'poster_internet' },
        { atTile: 50, gag: 'intern_wheel' },
        { atTile: 56, gag: 'poodle_desk' },
        { atTile: 6,  gag: 'room_motivate' },
      ],
      outro: [
        { who: 'it', text: 'Security\'s next. Then the executives.\nThen your dad. Go get him, kid.' },
      ],
    },

    '7': {
      decor: 'security',
      mood: 'unhinged',
      goalWriting: 'crayon_whose',
      intro: [
        { text: 'FLOOR 27 — SECURITY.\nTHEY GUARD THE PROFITS. NOT THE PEOPLE.' },
        { who: 'guard', text: 'Badge, please.\n...Is that a pacifier?' },
      ],
      triggers: [
        {
          atTile: 6,
          lines: [
            { who: 'tero', text: 'Harder. Better. Stronger.\n...Sadder.' },
          ],
        },
        {
          atTile: 30,
          lines: [
            { who: 'tero', text: 'Sky. Net.' },
            { who: 'tero', text: '...Uh oh.' },
          ],
        },
        {
          atTile: 40,
          lines: [
            { text: '"WORK HARD FOR 30 YEARS AND YOU MIGHT\nPAY OFF YOUR STUDENT LOAN."' },
            { who: 'tero', text: 'Dada still paying?' },
          ],
        },
      ],
      scenery: [
        { atTile: 4,  gag: 'poster_harder' },
        { atTile: 19, gag: 'bonus_jars' },
        { atTile: 27, gag: 'poster_skynet' },
        { atTile: 38, gag: 'banner_loan' },
        { atTile: 60, gag: 'sign_hr' },
        { atTile: 11, gag: 'dead_plant' },
        { atTile: 28, gag: 'brick_phone' },
        { atTile: 46, gag: 'room_feedback' },
      ],
      outro: [
        { who: 'guard', text: 'He... got past us?\nWe need a meeting about this.' },
      ],
    },

    '8': {
      decor: 'executive',
      mood: 'unhinged',
      goalWriting: 'crayon_no_peace',
      intro: [
        { text: 'FLOOR 30 — THE EXECUTIVE WING.\nNO HUMANS ALLOWED. ONLY EXECUTIVES.' },
        { who: 'pig', text: 'Oink. I mean — leverage.\nWho let the toddler in?' },
      ],
      triggers: [
        {
          atTile: 6,
          lines: [
            { text: '"I WORKED 18 HOURS A DAY FOR 10 YEARS.\nNOW I\'M SENIOR JUNIOR LEVEL\nPRODUCT MANAGER ASSISTANT."' },
            { who: 'tero', text: 'Ten years.\n...For THAT?' },
          ],
        },
        {
          atTile: 60,
          lines: [
            { who: 'tero', text: 'Drip. ...Drip.\n...Nothing.' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'portrait_senior' },
        { atTile: 18, gag: 'golden_parachute' },
        { atTile: 26, gag: 'sign_results' },
        { atTile: 34, gag: 'copier_butt' },
        { atTile: 44, gag: 'banner_ceo' },
        { atTile: 51, gag: 'supply_closet' },
        { atTile: 58, gag: 'trickle_down' },
        { atTile: 66, gag: 'pension_grave' },
        { atTile: 10, gag: 'scandi_set' },
        { atTile: 25, gag: 'sofa_memphis' },
      ],
      outro: [
        { who: 'pig', text: 'The Board will not be pleased.' },
        { who: 'tero', text: 'Good.' },
      ],
    },

    '6': {
      decor: 'penthouse',
      goalWriting: 'crayon_power',
      mood: 'unhinged',
      intro: [
        { text: 'FLOOR 33 — THE SHAREHOLDERS\' SANCTUM.' },
        { who: 'board', text: 'A CHILD? HERE?\nWHAT IS ITS QUARTERLY OUTPUT?' },
      ],
      triggers: [
        {
          atTile: 9,
          lines: [
            { who: 'tero', text: 'Juice?' },
            { text: 'IT IS NOT JUICE.' },
          ],
        },
        {
          atTile: 48,
          lines: [
            { who: 'tero', text: 'Vroom vroom.\n...Inside?' },
          ],
        },
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
        { atTile: 8,  gag: 'hostess_blonde' },
        { atTile: 14, gag: 'fountain' },
        { atTile: 21, gag: 'hostess_brunette' },
        { atTile: 27, gag: 'money_throne' },
        { atTile: 34, gag: 'coffee_iv' },
        { atTile: 40, gag: 'sign_shareholders' },
        { atTile: 46, gag: 'ferrari' },
        { atTile: 55, gag: 'hostess_redhead' },
        { atTile: 61, gag: 'sofa_memphis' },
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
