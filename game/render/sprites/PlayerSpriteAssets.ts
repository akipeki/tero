// file: game/render/sprites/PlayerSpriteAssets.ts

// WE ARE CURRENTLY NOT USING ANY PNG SPRITES. WILL IMPLEMENT THIS LATER.

export type PlayerFrameName =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'fall'
  | 'hurt'
  | 'lose'
  | 'win';

const framePaths: Record<PlayerFrameName, string> = {
  idle: '/images/tero/Tero_Idle.png',
  walk: '/images/tero/Tero_Walk.png',
  jump: '/images/tero/Tero_Jump.png',
  fall: '/images/tero/Tero_Fall.png',
  hurt: '/images/tero/Tero_Hurt.png',
  lose: '/images/tero/Tero_Lose.png',
  win: '/images/tero/Tero_Win.png',
};

const frames: Partial<Record<PlayerFrameName, HTMLImageElement>> = {};
let startedLoading = false;

export function loadPlayerSpriteAssets(): void {
  if (startedLoading || typeof window === 'undefined') return;
  startedLoading = true;

  for (const [name, src] of Object.entries(framePaths) as Array<[PlayerFrameName, string]>) {
    const img = new Image();
    img.src = src;
    frames[name] = img;
  }
}

export function getPlayerSpriteFrame(name: PlayerFrameName): HTMLImageElement | null {
  const img = frames[name];
  if (!img) return null;
  if (!img.complete) return null;
  return img;
}