import type { Particle } from './types';
import { PARTICLE_GRAVITY } from './constants';
import { P } from './palette';

export class ParticleSystem {
  private pool: Particle[] = [];

  burst(
    wx: number, wy: number,
    count: number,
    color1: string,
    color2: string,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = 1.5 + Math.random() * 3;
      this.pool.push({
        x: wx, y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color: Math.random() > 0.5 ? color1 : color2,
        size: 2 + Math.floor(Math.random() * 3),
      });
    }
  }

  confetti(wx: number, wy: number): void {
    const colors = [P.MUSHROOM, P.SUN_GOLD, P.HILL_MID, P.PLAYER_BLUE, P.ENEMY_RED, P.STAR_WHITE];
    for (let i = 0; i < 40; i++) {
      this.pool.push({
        x: wx + (Math.random() - 0.5) * 60,
        y: wy,
        vx: (Math.random() - 0.5) * 5,
        vy: -3 - Math.random() * 5,
        life: 60 + Math.random() * 60,
        maxLife: 120,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.floor(Math.random() * 4),
      });
    }
  }

  update(): void {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += PARTICLE_GRAVITY;
      p.vx *= 0.96;
      p.life--;
      if (p.life <= 0) this.pool.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const p of this.pool) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, alpha * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x - camX), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.pool.length = 0;
  }
}
