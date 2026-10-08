// file: game/Secrets.ts
//
// Stupid secrets: little jokes the game only tells you if you do something
// odd. Each fires once per session, as a callout. Game feeds in what's
// happening; `check()` returns a line to show, or null.

export interface SecretSignals {
  /** Ticks standing still with no input. */
  idle: number;
  /** DADA shouts on this floor. */
  calls: number;
  /** Ticks walking left near the start of a floor. */
  backwards: number;
  /** Paperwork tiles burnt this session. */
  burnt: number;
  /** Deaths on this floor. */
  deaths: number;
  /** Ticks spent hiding in the box this session. */
  boxed: number;
}

const SECRETS: { id: string; test: (s: SecretSignals) => boolean; line: string }[] = [
  { id: 'idle', test: (s) => s.idle >= 20 * 60, line: 'TERO HAS BEEN IDLE FOR 20 SECONDS. HR HAS BEEN NOTIFIED.' },
  { id: 'calls', test: (s) => s.calls >= 10, line: 'DADA HAS BEEN ADDED TO THE CALL. (HE IS ON MUTE.)' },
  { id: 'backwards', test: (s) => s.backwards >= 8 * 60, line: 'THE EXIT IS THE OTHER WAY. (WE CHECKED.)' },
  { id: 'burnt', test: (s) => s.burnt >= 30, line: 'TERO HAS BURNT MORE PAPERWORK THAN LEGAL HAS EVER READ.' },
  { id: 'deaths', test: (s) => s.deaths >= 5, line: 'HR SUGGESTS A WELLNESS WEBINAR. (MANDATORY. UNPAID.)' },
  { id: 'boxed', test: (s) => s.boxed >= 60 * 60, line: 'THE BOX HAS BEEN PROMOTED TO SENIOR BOX.' },
];

export class Secrets {
  readonly found = new Set<string>();

  check(s: SecretSignals): string | null {
    for (const sec of SECRETS) {
      if (this.found.has(sec.id) || !sec.test(s)) continue;
      this.found.add(sec.id);
      return sec.line;
    }
    return null;
  }

  static get total(): number { return SECRETS.length; }
}
