// file: game/Mode.ts
//
// Fun modes unlocked by finishing the game. Read by the renderers and the
// audio, set by Game when a level loads.

let casualFriday = false;

/** CASUAL FRIDAY: every suit becomes a loud Hawaiian shirt; the muzak
 *  goes ukulele. */
export function setCasualFriday(on: boolean): void { casualFriday = on; }
export function isCasualFriday(): boolean { return casualFriday; }
