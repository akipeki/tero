// file: game/render/sprites/QuestionBlockSprite.ts

import { TILE_SIZE } from '../../constants';
import { getTheme } from '../Theme';
import { QUESTION_MARK_GLYPH, drawGlyph } from './glyphs';

export type QuestionBlockVisualState = 'idle' | 'bump' | 'open';

export interface QuestionBlockSpriteProps {
  x: number;
  y: number;
  camX: number;
  bumpOffset: number;
  animFrame: number;
  state: QuestionBlockVisualState;
}

export function drawQuestionBlockSprite(
  ctx: CanvasRenderingContext2D,
  props: QuestionBlockSpriteProps,
): void {
  const theme = getTheme();

  const sx = Math.floor(props.x - props.camX);
  const sy = Math.floor(props.y + props.bumpOffset);
  const S = TILE_SIZE;

  if (props.state === 'open') {
    ctx.fillStyle = theme.block.usedBase;
    ctx.fillRect(sx, sy, S, S);

    ctx.fillStyle = theme.block.usedTop;
    ctx.fillRect(sx, sy, S, 3);
    return;
  }

  // Base
  ctx.fillStyle = theme.block.base;
  ctx.fillRect(sx, sy, S, S);

  // Border
  ctx.fillStyle = theme.block.border;
  ctx.fillRect(sx, sy, S, 3);
  ctx.fillRect(sx, sy + S - 3, S, 3);
  ctx.fillRect(sx, sy, 3, S);
  ctx.fillRect(sx + S - 3, sy, 3, S);

  // Glyph
  const blink = props.animFrame === 3;
  const glyphColor = blink ? theme.block.symbolBlink : theme.block.symbol;
  drawGlyph(ctx, QUESTION_MARK_GLYPH, sx + 11, sy + 7, 2, glyphColor);
}