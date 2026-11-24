import Phaser from 'phaser';
import { balance } from '../../data/balance';
import type { LevelState } from '../sim/state';
import { BOARD_PAD, type LevelLayout } from './levelLayout';

export function paintLevel(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  state: LevelState,
): void {
  graphics.clear();
  const pad = BOARD_PAD;
  const boardW = layout.cell * layout.cols;
  const boardH = layout.cell * layout.rows;
  graphics.fillStyle(0xc8a56a, 1);
  graphics.fillRoundedRect(
    layout.originX - pad,
    layout.originY - pad,
    boardW + pad * 2,
    boardH + pad * 2,
    18,
  );
  graphics.fillStyle(0x8fbf63, 1);
  graphics.fillRect(layout.originX, layout.originY, boardW, boardH);
  graphics.lineStyle(1, 0x6fa34a, 0.35);
  for (let col = 0; col <= layout.cols; col += 1) {
    const x = layout.originX + col * layout.cell;
    graphics.lineBetween(x, layout.originY, x, layout.originY + layout.rows * layout.cell);
  }
  for (let row = 0; row <= layout.rows; row += 1) {
    const y = layout.originY + row * layout.cell;
    graphics.lineBetween(layout.originX, y, layout.originX + layout.cols * layout.cell, y);
  }
  for (const patch of state.grass) {
    paintGrass(graphics, layout, patch.x, patch.y, patch.growthMs / balance.grassGrowMs);
  }
  for (const item of state.items) {
    if (item.kind === 'egg') {
      paintEgg(graphics, layout, item.x, item.y);
    } else {
      paintCage(graphics, layout, item.x, item.y);
    }
  }
  for (const chicken of state.chickens) {
    paintChicken(graphics, layout, chicken.x, chicken.y, chicken.hungerMs / balance.hungerStarveMs);
  }
  if (state.bear) {
    paintBear(graphics, layout, state.bear.x, state.bear.y, state.bear.taps);
  }
}

function center(layout: LevelLayout, x: number, y: number): { x: number; y: number } {
  return {
    x: layout.originX + (x + 0.5) * layout.cell,
    y: layout.originY + (y + 0.5) * layout.cell,
  };
}

function paintGrass(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  grown: number,
): void {
  const spot = center(layout, x, y);
  const ready = grown >= 1;
  const radius = layout.cell * (ready ? 0.28 : 0.12 + grown * 0.1);
  graphics.fillStyle(ready ? 0x2e7d32 : 0x9ccc65, 1);
  graphics.fillCircle(spot.x, spot.y - radius * 0.2, radius);
  graphics.fillTriangle(
    spot.x,
    spot.y - radius * 1.7,
    spot.x - radius * 0.7,
    spot.y,
    spot.x + radius * 0.7,
    spot.y,
  );
}

function paintEgg(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
): void {
  const spot = center(layout, x, y);
  graphics.fillStyle(0xfff8e8, 1);
  graphics.fillEllipse(spot.x, spot.y, layout.cell * 0.34, layout.cell * 0.46);
  graphics.lineStyle(2, 0xc47a3a, 1);
  graphics.strokeEllipse(spot.x, spot.y, layout.cell * 0.34, layout.cell * 0.46);
}

function paintCage(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
): void {
  const spot = center(layout, x, y);
  const size = layout.cell * 0.46;
  graphics.fillStyle(0xb0bec5, 1);
  graphics.fillRoundedRect(spot.x - size / 2, spot.y - size / 2, size, size, 4);
  graphics.lineStyle(2, 0x546e7a, 1);
  graphics.strokeRoundedRect(spot.x - size / 2, spot.y - size / 2, size, size, 4);
}

function paintChicken(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  hunger: number,
): void {
  const spot = center(layout, x, y);
  const fade = hunger >= 1 ? 0.55 : 1;
  graphics.fillStyle(0xf6c445, fade);
  graphics.fillCircle(spot.x, spot.y, layout.cell * 0.28);
  graphics.fillStyle(0xe15b4a, fade);
  graphics.fillTriangle(
    spot.x,
    spot.y - layout.cell * 0.42,
    spot.x - layout.cell * 0.12,
    spot.y - layout.cell * 0.18,
    spot.x + layout.cell * 0.12,
    spot.y - layout.cell * 0.18,
  );
  graphics.fillStyle(0xf28b30, fade);
  graphics.fillTriangle(
    spot.x + layout.cell * 0.18,
    spot.y - layout.cell * 0.02,
    spot.x + layout.cell * 0.34,
    spot.y + layout.cell * 0.04,
    spot.x + layout.cell * 0.16,
    spot.y + layout.cell * 0.08,
  );
  graphics.fillStyle(0x3e2723, fade);
  graphics.fillCircle(
    spot.x + layout.cell * 0.08,
    spot.y - layout.cell * 0.04,
    Math.max(2, layout.cell * 0.05),
  );
}

function paintBear(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  taps: number,
): void {
  const spot = center(layout, x, y);
  const radius = layout.cell * 0.34;
  graphics.fillStyle(0x8d6e63, 1);
  graphics.fillCircle(spot.x - radius * 0.7, spot.y - radius * 0.75, radius * 0.38);
  graphics.fillCircle(spot.x + radius * 0.7, spot.y - radius * 0.75, radius * 0.38);
  graphics.fillCircle(spot.x, spot.y, radius);
  graphics.fillStyle(0xfff3e0, 1);
  graphics.fillCircle(spot.x, spot.y + radius * 0.15, radius * 0.45);
  for (let index = 0; index < balance.bearTaps; index += 1) {
    graphics.fillStyle(index < taps ? 0xe29a3a : 0xffffff, 0.9);
    graphics.fillCircle(
      spot.x - radius + index * (radius * 0.5),
      spot.y - radius * 1.35,
      Math.max(3, layout.cell * 0.06),
    );
  }
}
