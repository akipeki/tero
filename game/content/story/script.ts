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
//                           cubicles, boardroom, legal, lab, security, executive,
//                           penthouse, stairwell
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
    chad:  { name: 'CHAD, TALENT ACQUISITION' },
    elvis: { name: 'ELVIS' },
    marja: { name: 'MARJA, THE RESISTANCE' },
  },

  chapters: [
    {
      id: 'monday',
      name: 'Getting in',
      levels: ['1', '11', '2', '10', '3'],
      // Cold open: no card before play. The memo comes a few steps in (a
      // trigger in level 1), the rest of the backstory is on the walls.
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
    {
      id: 'friday',
      name: 'The way home',
      levels: ['9'],
      intro: [
        { text: 'FRIDAY, 4:47 PM.' },
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
          // The cold open: a few steps of play first, then why.
          atTile: 7,
          lines: [
            { text: 'DAD WENT TO WORK SIX MONTHS AGO.\nHE NEVER CAME HOME.' },
          ],
        },
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
            { who: 'it', text: 'A baby in a dragon suit? In the mailroom?\nOh. You\'re #4471\'s kid.' },
            { who: 'it', text: 'You sent Brenda HOME? She\'s been\nhere since 1987. Your dad\'s on 6.' },
          ],
        },
        {
          // MANDATORY ONBOARDING (game/interludes/onboarding.ts)
          atTile: 46,
          lines: [
            { who: 'it', text: 'Wait! Nobody goes upstairs\nwithout ONBOARDING.' },
            { who: 'it', text: 'It\'s a short video.\n(It is not a short video.)' },
          ],
          effect: 'interlude:onboarding',
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

    '11': {
      decor: 'compliance',
      density: 'sparse',
      goalWriting: 'crayon_whose',
      intro: [
        { text: 'FLOOR 3 — COMPLIANCE.\n312 CAMERAS. 0 WINDOWS.' },
        { who: 'guard', text: 'We are watching you.\nFor your own safety.' },
      ],
      triggers: [
        {
          atTile: 4,
          lines: [
            { text: 'ONLY THE CAMERAS WITH A LIGHT CONE ARE REAL.\nTHE OTHER 309 ARE FOR MORALE.' },
            { text: 'TIP: GET SEEN AND GUARDS DROP IN.\nHIDE BEHIND A PILLAR, OR DUCK AND STAND\nSTILL. NOBODY SUSPECTS A BOX.' },
          ],
        },
        {
          atTile: 15,
          lines: [
            { who: 'tero', text: 'Camera... on trash?' },
            { text: 'BIN 4 HAS BEEN UNDER REVIEW SINCE 1984.\nNOTHING HAS BEEN FOUND. THEY KEEP LOOKING.' },
          ],
        },
        {
          atTile: 41,
          lines: [
            { text: 'A SWIMSUIT CALENDAR FROM 1993.\nA STICKY NOTE ON IT: "#4471". DAD\'S NUMBER.' },
            { who: 'tero', text: 'Dada... beach?' },
            { text: 'DAD HASN\'T SEEN A BEACH SINCE MARCH.' },
          ],
        },
        {
          atTile: 50,
          lines: [
            { text: 'THE TOILETS.\n"CCTV IN OPERATION INSIDE. FOR YOUR SAFETY."' },
            { who: 'tero', text: '...Tero hold it.' },
          ],
        },
        {
          atTile: 70,
          lines: [
            { who: 'tero', text: 'Camera watch camera.\nWho watch... that camera?' },
          ],
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'sign_watching' },
        { atTile: 6,  gag: 'cam_cluster' },
        { atTile: 15, gag: 'cam_trash' },
        { atTile: 18, gag: 'sign_always' },
        { atTile: 36, gag: 'calendar_beach' },
        { atTile: 27, gag: 'cam_fern' },
        { atTile: 30, gag: 'sign_blink' },
        { atTile: 46, gag: 'cam_cluster' },
        { atTile: 49, gag: 'toilet_doors' },
        { atTile: 63, gag: 'cam_coffee' },
        { atTile: 67, gag: 'sign_trust' },
        { atTile: 70, gag: 'cam_cam' },
      ],
      outro: [
        { who: 'guard', text: 'He got past 312 cameras.\nWe saw everything. We did nothing.' },
        { who: 'guard', text: 'That\'s compliance.' },
      ],
    },

    '2': {
      decor: 'cubicles',
      // a long, empty corridor after the opening: just the SYNERGY poster
      quiet: [[19, 34], [73, 91]],
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
          // THE CAPTCHA (game/interludes/captcha.ts)
          atTile: 40,
          lines: [
            { text: 'A SECURITY DOOR. A SCREEN:\n"PLEASE CONFIRM YOU ARE NOT A BABY."' },
            { who: 'tero', text: '...Hmm.' },
          ],
          effect: 'interlude:captcha',
        },
        {
          atTile: 66,
          lines: [
            { who: 'doris', text: 'Your father? Boardroom, sweetie.\nHave a bottle of coffee. Grow up fast.' },
          ],
        },
        {
          atTile: 71,
          lines: [
            { who: 'tero', text: 'Das Kapital for Toddlers:\nWho owns our dadas?' },
          ],
        },
        {
          // MINI-BOSS, part 1: the pitch, then the application form
          atTile: 77,
          lines: [
            { who: 'chad', text: 'Heyyy, little buddy! Love the energy.\nHow old are you?' },
            { who: 'tero', text: 'Two.' },
            { who: 'chad', text: 'TWO! Perfect. You\'re JUST old enough\nfor our Junior Trainee Program.' },
            { who: 'chad', text: 'Only 10-hour days! Unpaid, but you get\npaid in EXPOSURE. Quick form first:' },
          ],
          effect: 'quiz',
        },
        {
          // part 2: after the form. The door shuts once the lines are done.
          atTile: 77,
          lines: [
            { who: 'tero', text: 'F*** OFF, YOU CAPITALIST PIG.' },
            { who: 'chad', text: '...Wow. I\'m putting you down as\n"not a culture fit".' },
            { who: 'chad', text: 'SECURITY! ...Fine. I\'ll do it myself.' },
          ],
          effect: 'boss',
        },
      ],
      scenery: [
        { atTile: 4,  gag: 'dead_xmas_tree' },
        { atTile: 11, gag: 'fridge_notes' },
        { atTile: 14, gag: 'dad_mug' },
        { atTile: 25, gag: 'poster_synergy' },
        { atTile: 35, gag: 'water_dispenser' },
        { atTile: 69, gag: 'money_shrine' },
      ],
      outro: [
        { text: 'THE ELEVATOR IS OUT OF ORDER.\nOF COURSE IT IS.' },
        { who: 'tero', text: 'Pipe.' },
        { who: 'tero', text: '...WHEEEE!' },
      ],
    },

    '3': {
      decor: 'boardroom',
      density: 'sparse',
      goalWriting: 'crayon_resource',
      // The arena stays clean: just the projector screen and the elevator.
      quiet: [[60, 79]],
      intro: [
        { text: 'A VENT GRATE CLATTERS TO THE FLOOR.\nFLOOR 12 — THE BOARDROOM.' },
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
          // "YOU'RE ON MUTE" (game/interludes/mute.ts)
          atTile: 28,
          lines: [
            { text: 'A LAPTOP ON THE TABLE CHIMES.\n"YOU HAVE BEEN ADDED TO: ALL-HANDS SYNC."' },
            { who: 'tero', text: 'Dada in there?' },
          ],
          effect: 'interlude:mute',
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
          // ELEVATOR MUZAK (game/interludes/muzak.ts)
          atTile: 1,
          lines: [
            { who: 'tero', text: '...How did Tero get here?' },
            { text: 'TEN MINUTES EARLIER.\nTHE ELEVATOR BETWEEN 12 AND 13.' },
          ],
          effect: 'interlude:muzak',
        },
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
          // TERMS & CONDITIONS (game/interludes/terms.ts)
          atTile: 42,
          lines: [
            { text: 'A LEGAL NOTICE BLOCKS THE CORRIDOR:\n"PLEASE ACCEPT THE UPDATED TERMS."' },
            { who: 'tero', text: 'Terms?' },
          ],
          effect: 'interlude:terms',
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
          atTile: 4,
          lines: [
            { text: 'CAMERAS. DON\'T GET SEEN.\nNOBODY SUSPECTS A CARDBOARD BOX.' },
          ],
        },
        {
          atTile: 7,
          lines: [
            { who: 'tero', text: 'Harder. Better. Stronger.\n...Sadder.' },
          ],
        },
        {
          // CUBICLE 3D (game/interludes/cubicle3d.ts)
          atTile: 20,
          lines: [
            { who: 'guard', text: 'Camera four lost the toddler.\nSwitch to... FIRST PERSON.' },
            { who: 'guard', text: 'We have FIRST PERSON?' },
            { who: 'guard', text: 'Since 1992. Budget never\nupgraded it.' },
          ],
          effect: 'interlude:cubicle3d',
        },
        {
          atTile: 32,
          lines: [
            { who: 'tero', text: 'Sky. Net.' },
            { who: 'tero', text: '...Uh oh.' },
          ],
        },
        {
          atTile: 43,
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
          atTile: 4,
          lines: [
            { text: 'A GOLDEN PARACHUTE. EXECUTIVES\nNEVER HIT THE GROUND. HOLD JUMP.' },
          ],
        },
        {
          atTile: 9,
          lines: [
            { text: '"I WORKED 18 HOURS A DAY FOR 10 YEARS.\nNOW I\'M SENIOR JUNIOR LEVEL\nPRODUCT MANAGER ASSISTANT."' },
            { who: 'tero', text: 'Ten years.\n...For THAT?' },
          ],
        },
        {
          // THE ACQUISITION: the game itself gets bought (game/interludes/acquisition.ts)
          atTile: 26,
          lines: [
            { who: 'pig', text: 'Q3 numbers are in.\nThis GAME is underperforming.' },
            { who: 'pig', text: 'Too much joy. Not enough\nmonetisation. Call the lawyers.' },
            { who: 'tero', text: '...Uh oh.' },
          ],
          effect: 'interlude:acquisition',
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
        { atTile: 0,  gag: 'scandi_set' },
        { atTile: 21, gag: 'golden_parachute' },
        { atTile: 26, gag: 'sign_results' },
        { atTile: 39, gag: 'copier_butt' },
        { atTile: 44, gag: 'banner_ceo' },
        { atTile: 57, gag: 'supply_closet' },
        { atTile: 61, gag: 'trickle_down' },
        { atTile: 70, gag: 'pension_grave' },
        { atTile: 74, gag: 'sofa_memphis' },
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
      quiet: [[57, 79]],
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
          atTile: 29,
          lines: [
            { who: 'tero', text: 'Chair. Money. ...Yucky.' },
          ],
        },
        {
          atTile: 45,
          lines: [
            { who: 'tero', text: 'Vroom vroom.\n...Inside?' },
          ],
        },
        {
          // BLUE SCREEN → THE DESKTOP (game/interludes/desktop.ts)
          atTile: 50,
          lines: [
            { who: 'board', text: 'THE TODDLER IS TOO CLOSE.\nCRASH THE GAME.' },
            { who: 'board', text: 'WE CAN DO THAT?' },
            { who: 'board', text: 'WE OWN IT.' },
          ],
          effect: 'interlude:desktop',
        },
        {
          atTile: 58,
          lines: [
            { who: 'tero', text: 'DADA!!' },
            { who: 'dad', text: '...Tero? Is it the weekend?' },
            { who: 'board', text: 'HE HAS A DELIVERABLE DUE.' },
          ],
        },
        {
          // The final boss. The door shuts behind Tero once the lines are done.
          atTile: 65,
          lines: [
            { who: 'board', text: 'WE ARE THE BOARD.\nWE ARE FIVE. WE ARE ONE. WE ARE UP 3%.' },
            { who: 'tero', text: 'Many heads.' },
            { who: 'tero', text: '...ONE DRAGON.' },
          ],
          effect: 'boss',
        },
      ],
      scenery: [
        { atTile: 3,  gag: 'banner_growth' },
        { atTile: 5,  gag: 'hostess_blonde' },
        { atTile: 20, gag: 'money_throne' },
        { atTile: 28, gag: 'hostess_brunette' },
        { atTile: 40, gag: 'ferrari' },
        { atTile: 51, gag: 'coffee_iv' },
        { atTile: 54, gag: 'sign_shareholders' },
        { atTile: 58, gag: 'dad_desk' },
      ],
      outro: [
        { text: 'TERO ZIPS UP DAD\'S OLD DRAGON SUIT.\nSIX MONTHS OF FLOOR DUST ON IT.' },
        { who: 'dad', text: 'I... I came in for "a few extra hours."' },
        { who: 'tero', text: 'Dada. Home.' },
        { who: 'dad', text: 'The elevator\'s been cut. Thirty-three\nfloors of stairs. Before Monday.' },
        { who: 'tero', text: 'RUN.' },
      ],
    },

    '9': {
      decor: 'stairwell',
      density: 'sparse',
      goalWriting: 'crayon_go_home',
      intro: [
        { who: 'dad', text: 'I can\'t feel my legs.\nI\'ve been sitting since March.' },
        { who: 'tero', text: 'Dada. RUN.' },
      ],
      triggers: [
        {
          atTile: 66,
          lines: [
            { who: 'dad', text: 'Floor 17. I had a desk here once.\nIn 1989. They never told me it moved.' },
          ],
        },
        {
          // NAP TIME (game/interludes/nap.ts): halfway down, he's two.
          atTile: 74,
          lines: [
            { who: 'dad', text: 'Halfway. Can we sit for one second?' },
            { who: 'tero', text: 'One. Second.' },
          ],
          effect: 'interlude:nap',
        },
        {
          // THE OFFICE CHAIR GP (game/interludes/kart.ts)
          atTile: 112,
          lines: [
            { who: 'dad', text: 'Wait. An office chair.\nWith wheels.' },
            { who: 'tero', text: 'VROOM VROOM!' },
            { who: 'dad', text: 'Hold on, buddy.' },
          ],
          effect: 'interlude:kart',
        },
      ],
      outro: [
        { text: 'THE LOBBY DOORS. DAYLIGHT.\nDAD HASN\'T SEEN IT SINCE MARCH.' },
        { who: 'dad', text: 'Let\'s go home, buddy.' },
        { who: 'tero', text: 'Home.' },
        { text: 'DAD TOOK THE REST OF THE YEAR OFF.\nTHE QUARTERLY REPORT WAS LATE.\nNOBODY DIED.' },
      ],
    },

    // ── Between floors: Elvis's happy place ─────────────────────────────────
    '10': {
      decor: 'vents',
      density: 'sparse',
      goalWriting: 'crayon_elvis',
      intro: [
        { text: 'INSIDE THE VENTILATION DUCTS.\nIT IS WARM. IT SMELLS LIKE DOG.' },
      ],
      triggers: [
        {
          // Meeting Elvis. Then Tero rides him for the rest of the floor.
          atTile: 6,
          lines: [
            { who: 'elvis', text: 'Hi! Who are you, little one?' },
            { who: 'tero', text: 'Tero.' },
            { who: 'elvis', text: 'My name is Elvis. I live here.' },
            { who: 'tero', text: 'Have you seen my Dada?' },
            { who: 'elvis', text: 'I haven\'t seen anyone.\nNobody comes in here.' },
            { who: 'elvis', text: 'They got me because it was trendy.\n"Office dog." "Culture." "Vibes."' },
            { who: 'elvis', text: 'Then they wanted to cut some costs.\nThey stopped feeding me.' },
            { who: 'elvis', text: 'Since then I eat from the garbage cans\nand live in these ventilation pipes.' },
            { who: 'tero', text: '...Ride doggy?' },
            { who: 'elvis', text: 'Hop on, little one.' },
          ],
          effect: 'ride',
        },
        {
          // The resistance camp
          atTile: 40,
          lines: [
            { who: 'marja', text: 'HALT! Who goes— oh.\nIt\'s a baby in a dragon suit. On Elvis.' },
            { who: 'marja', text: 'We are the Resistance.\nWe resist... leaving.' },
            { who: 'marja', text: 'Thirty years in these pipes.\nThey forgot to fire us. We forgot to go.' },
            { who: 'tero', text: 'Dada?' },
            { who: 'marja', text: 'Everybody ends up on Floor 33.\nTake this. You might need it.' },
            { text: 'TERO GOT A HAND GRENADE.\nIT\'S FULL OF RESIGNATION LETTERS. (G)' },
            { who: 'marja', text: 'Don\'t tell anyone we\'re here.\nThey\'d schedule a meeting about it.' },
          ],
          effect: 'grenade',
        },
        {
          // Elvis remembers Dad
          atTile: 61,
          lines: [
            { who: 'elvis', text: 'Wait. A tired man in a dragon suit came\nthrough once. Grey. Smelled like coffee.' },
            { who: 'elvis', text: 'He gave me half his sandwich.\nSaid he\'d be home by Friday.' },
            { who: 'tero', text: '...Which Friday?' },
            { who: 'elvis', text: 'He didn\'t say.' },
          ],
        },
      ],
      scenery: [
        { atTile: 11, gag: 'graffiti_rainbow' },
        { atTile: 18, gag: 'graffiti_people' },
        { atTile: 27, gag: 'graffiti_smiley' },
        { atTile: 32, gag: 'graffiti_nap' },
        { atTile: 41, gag: 'sign_resistance' },
        { atTile: 51, gag: 'graffiti_equal' },
        { atTile: 57, gag: 'graffiti_heart' },
        { atTile: 64, gag: 'graffiti_unite' },
        { atTile: 73, gag: 'graffiti_nobosses' },
        { atTile: 79, gag: 'graffiti_share' },
        { atTile: 85, gag: 'graffiti_love' },
        { atTile: 90, gag: 'graffiti_rainbow' },
      ],
      outro: [
        { who: 'elvis', text: 'This pipe comes out on Floor 12.\nI can\'t go up there.' },
        { who: 'elvis', text: 'They\'d make me a mascot again.' },
        { who: 'tero', text: 'Bye, Elvis.' },
        { who: 'elvis', text: 'Come back for walks, little one.\nGo get your Dada.' },
      ],
    },
  },
});
