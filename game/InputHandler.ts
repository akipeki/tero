import { Action } from './types';

export class InputHandler {
  bits = 0;                    // current frame: held actions (read by Game)
  private prevBits = 0;       // previous frame
  private keyboardBits = 0;
  private mobileBits = 0;
  private justPressed = 0;    // set only for one frame

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp   = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
  }

  /** Call once per game tick, after reading bits */
  tick(): void {
    this.prevBits   = this.bits;
    this.bits       = this.keyboardBits | this.mobileBits;
    this.justPressed = this.bits & ~this.prevBits;
  }

  held(action: Action):         boolean { return (this.bits        & action) !== 0; }
  justPressedAction(a: Action): boolean { return (this.justPressed & a)      !== 0; }

  // Convenience
  get left():        boolean { return this.held(Action.LEFT); }
  get right():       boolean { return this.held(Action.RIGHT); }
  get jump():        boolean { return this.held(Action.JUMP); }
  get jumpPressed(): boolean { return this.justPressedAction(Action.JUMP); }
  get pause():       boolean { return this.justPressedAction(Action.PAUSE); }
  get restart():     boolean { return window.__retryPressed === true; }

  /** Mobile: called by React overlay buttons */
  setMobile(action: Action, down: boolean): void {
    if (down) this.mobileBits |=  action;
    else      this.mobileBits &= ~action;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    this.keyboardBits |= keyToAction(e.key);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keyboardBits &= ~keyToAction(e.key);
  }
}

function keyToAction(key: string): Action {
  switch (key) {
    case 'ArrowLeft':  case 'a': case 'A': return Action.LEFT;
    case 'ArrowRight': case 'd': case 'D': return Action.RIGHT;
    case 'ArrowUp': case 'w': case 'W':
    case ' ': return Action.JUMP;
    case 'Escape': return Action.PAUSE;
    default: return 0 as Action;
  }
}

// Tiny global so React retry button can poke the game
declare global {
  interface Window { __retryPressed?: boolean; __enterPressed?: boolean; }
}
