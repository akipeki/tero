import { Action } from './types';

type UiAction = 'enter' | 'retry';
export type UiActionListener = (a: UiAction) => void;

export class InputHandler {
  bits = 0;                    // current frame: held actions (read by Game)
  private prevBits = 0;        // previous frame
  private keyboardBits = 0;
  private mobileBits = 0;
  private justPressed = 0;     // set only for one frame

  /** True for exactly one tick after a mute keybind is pressed. */
  muteJustPressed = false;
  private muteKeyDown = false;

  private uiListeners = new Set<UiActionListener>();

  constructor() {
    this.onKeyDown    = this.onKeyDown.bind(this);
    this.onKeyUp      = this.onKeyUp.bind(this);
    this.onBlur       = this.onBlur.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
    window.addEventListener('blur',    this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Call once per game tick, after reading bits */
  tick(): void {
    this.prevBits   = this.bits;
    this.bits       = this.keyboardBits | this.mobileBits;
    this.justPressed = this.bits & ~this.prevBits;
    // mute one-shot is consumed by Game each frame
    if (!this.muteKeyDown) this.muteJustPressed = false;
  }

  held(action: Action):         boolean { return (this.bits        & action) !== 0; }
  justPressedAction(a: Action): boolean { return (this.justPressed & a)      !== 0; }

  // Convenience
  get left():        boolean { return this.held(Action.LEFT); }
  get right():       boolean { return this.held(Action.RIGHT); }
  get down():        boolean { return this.held(Action.DOWN); }
  get jump():        boolean { return this.held(Action.JUMP); }
  get jumpPressed(): boolean { return this.justPressedAction(Action.JUMP); }
  get pause():       boolean { return this.justPressedAction(Action.PAUSE); }

  /** Mobile: called by React overlay buttons */
  setMobile(action: Action, down: boolean): void {
    if (down) this.mobileBits |=  action;
    else      this.mobileBits &= ~action;
  }

  /** React layer subscribes to "enter"/"retry" edges produced by keyboard. */
  onUiAction(listener: UiActionListener): () => void {
    this.uiListeners.add(listener);
    return () => this.uiListeners.delete(listener);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    window.removeEventListener('blur',    this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.uiListeners.clear();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private fireUi(a: UiAction): void {
    for (const fn of this.uiListeners) fn(a);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    // UI-level edges that don't map to gameplay actions
    if (e.key === 'Enter') { this.fireUi('enter'); return; }
    if (e.key === 'r' || e.key === 'R') { this.fireUi('retry'); return; }
    if (e.key === 'm' || e.key === 'M') {
      this.muteKeyDown = true;
      this.muteJustPressed = true;
      return;
    }
    this.keyboardBits |= keyToAction(e.key);
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'm' || e.key === 'M') { this.muteKeyDown = false; return; }
    this.keyboardBits &= ~keyToAction(e.key);
  }

  /** When the window loses focus, the OS keeps sending keyup events to whoever
   *  has focus instead — we'd be stuck "holding" keys forever. Flush. */
  private onBlur(): void {
    this.keyboardBits = 0;
    this.muteKeyDown = false;
  }

  private onVisibility(): void {
    if (document.hidden) this.keyboardBits = 0;
  }
}

function keyToAction(key: string): Action {
  switch (key) {
    case 'ArrowLeft':  case 'a': case 'A': return Action.LEFT;
    case 'ArrowRight': case 'd': case 'D': return Action.RIGHT;
    case 'ArrowDown':  case 's': case 'S': return Action.DOWN;
    case 'ArrowUp':    case 'w': case 'W':
    case ' ':                              return Action.JUMP;
    case 'Escape':     case 'p': case 'P': return Action.PAUSE;
    default: return 0 as Action;
  }
}
