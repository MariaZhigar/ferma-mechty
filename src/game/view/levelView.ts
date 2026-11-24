import Phaser from 'phaser';
import { balance } from '../../data/balance';
import type { LevelState, Well } from '../sim/state';
import { isCageBlinking, isEggBlinking } from '../sim/systems/items';
import { meadowScale, meadowToScreen, type LevelLayout } from './levelLayout';

export function paintLevel(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  state: LevelState,
): void {
  graphics.clear();
  paintBoard(graphics, layout);
  for (const patch of state.grass) {
    paintGrass(graphics, layout, patch.x, patch.y, patch.growthMs / balance.grassGrowMs);
  }
  for (const item of state.items) {
    if (item.kind === 'egg') {
      paintEgg(graphics, layout, item.x, item.y, item.ageMs);
    } else {
      paintCage(graphics, layout, item.x, item.y, item.ageMs);
    }
  }
  for (const chicken of state.chickens) {
    paintChicken(
      graphics,
      layout,
      chicken.x,
      chicken.y,
      chicken.heading,
      chicken.hungerMs / balance.hungerStarveMs,
    );
  }
  if (state.bear) {
    paintBear(graphics, layout, state.bear.x, state.bear.y, state.bear.heading, state.bear.taps);
  }
  paintWell(graphics, layout, state.well);
}

function paintBoard(graphics: Phaser.GameObjects.Graphics, layout: LevelLayout): void {
  graphics.fillStyle(0xc4a574, 1);
  graphics.fillRoundedRect(layout.fieldX, layout.fieldY, layout.fieldW, layout.fieldH, 18);
  const meadow = layout.meadow;
  graphics.fillStyle(0x7dba55, 1);
  graphics.fillRoundedRect(meadow.x, meadow.y, meadow.w, meadow.h, 16);
  graphics.fillStyle(0x98d36a, 0.55);
  graphics.fillEllipse(
    meadow.x + meadow.w * 0.38,
    meadow.y + meadow.h * 0.42,
    meadow.w * 0.42,
    meadow.h * 0.26,
  );
  graphics.fillStyle(0x6aaa48, 0.35);
  graphics.fillEllipse(
    meadow.x + meadow.w * 0.72,
    meadow.y + meadow.h * 0.68,
    meadow.w * 0.3,
    meadow.h * 0.18,
  );
  graphics.lineStyle(5, 0x8d6e63, 1);
  graphics.strokeRoundedRect(meadow.x + 3, meadow.y + 3, meadow.w - 6, meadow.h - 6, 14);
}

function paintGrass(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  grown: number,
): void {
  const spot = meadowToScreen(layout, x, y);
  const ready = grown >= 1;
  const blade = Math.max(18, 86 * unit(layout)) * (0.42 + 0.64 * Math.min(1, grown));
  const color = ready ? 0x2e7d32 : 0x9ccc65;
  graphics.fillStyle(color, 1);
  for (const lean of [-0.7, 0, 0.65]) {
    graphics.fillTriangle(
      spot.x + lean * blade * 0.35,
      spot.y - blade * (1.15 + Math.abs(lean) * 0.15),
      spot.x - blade * 0.28 + lean * blade * 0.2,
      spot.y + blade * 0.15,
      spot.x + blade * 0.28 + lean * blade * 0.2,
      spot.y + blade * 0.15,
    );
  }
  graphics.fillStyle(ready ? 0x43a047 : 0xc5e1a5, 0.9);
  graphics.fillEllipse(spot.x, spot.y + blade * 0.12, blade * 1.15, blade * 0.42);
}

function paintEgg(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  ageMs: number,
): void {
  const spot = meadowToScreen(layout, x, y);
  const blink = isEggBlinking(ageMs);
  const alpha = blink ? pulse(ageMs) : 1;
  const w = Math.max(16, 64 * unit(layout));
  const h = w * 1.35;
  graphics.fillStyle(0xfff8e8, alpha);
  graphics.fillEllipse(spot.x, spot.y, w, h);
  graphics.lineStyle(2, 0xc47a3a, alpha);
  graphics.strokeEllipse(spot.x, spot.y, w, h);
}

function paintCage(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  ageMs: number,
): void {
  const spot = meadowToScreen(layout, x, y);
  const blink = isCageBlinking(ageMs);
  const alpha = blink ? pulse(ageMs) : 1;
  const size = Math.max(32, 96 * unit(layout));
  graphics.fillStyle(0xb0bec5, alpha);
  graphics.fillRoundedRect(spot.x - size / 2, spot.y - size / 2, size, size, 5);
  graphics.fillStyle(0x8d6e63, alpha);
  graphics.fillCircle(spot.x, spot.y + size * 0.06, size * 0.22);
  graphics.lineStyle(2, 0x455a64, alpha);
  graphics.strokeRoundedRect(spot.x - size / 2, spot.y - size / 2, size, size, 5);
  for (const offset of [-0.22, 0, 0.22]) {
    graphics.lineBetween(
      spot.x + size * offset,
      spot.y - size * 0.38,
      spot.x + size * offset,
      spot.y + size * 0.38,
    );
  }
  graphics.lineBetween(spot.x - size * 0.38, spot.y, spot.x + size * 0.38, spot.y);
}

function paintChicken(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  heading: number,
  hunger: number,
): void {
  const spot = meadowToScreen(layout, x, y);
  const radius = Math.max(16, 64 * unit(layout));
  const fade = hunger >= 1 ? 0.55 : 1;
  const faceX = Math.cos(heading);
  const faceY = Math.sin(heading);
  const sideX = -faceY;
  const sideY = faceX;
  graphics.fillStyle(0x000000, 0.12 * fade);
  graphics.fillEllipse(spot.x, spot.y + radius * 0.72, radius * 1.3, radius * 0.45);
  graphics.fillStyle(0xf6c445, fade);
  graphics.fillCircle(spot.x, spot.y, radius);
  graphics.fillStyle(0xe15b4a, fade);
  graphics.fillTriangle(
    spot.x - faceX * radius * 0.15,
    spot.y - faceY * radius * 0.15 - radius * 0.85,
    spot.x - radius * 0.38,
    spot.y - radius * 0.2,
    spot.x + radius * 0.38,
    spot.y - radius * 0.2,
  );
  graphics.fillStyle(0xf28b30, fade);
  graphics.fillTriangle(
    spot.x + faceX * radius * 0.7,
    spot.y + faceY * radius * 0.7,
    spot.x + faceX * radius * 1.15 + sideX * radius * 0.18,
    spot.y + faceY * radius * 1.15 + sideY * radius * 0.18,
    spot.x + faceX * radius * 0.72 - sideX * radius * 0.16,
    spot.y + faceY * radius * 0.72 - sideY * radius * 0.16,
  );
  graphics.fillStyle(0x3e2723, fade);
  graphics.fillCircle(
    spot.x + faceX * radius * 0.28 + sideX * radius * 0.22,
    spot.y + faceY * radius * 0.28 + sideY * radius * 0.22 - radius * 0.08,
    Math.max(2, radius * 0.14),
  );
}

function paintBear(
  graphics: Phaser.GameObjects.Graphics,
  layout: LevelLayout,
  x: number,
  y: number,
  heading: number,
  taps: number,
): void {
  const spot = meadowToScreen(layout, x, y);
  const radius = Math.max(22, 88 * unit(layout));
  const faceX = Math.cos(heading);
  const faceY = Math.sin(heading);
  graphics.fillStyle(0x000000, 0.14);
  graphics.fillEllipse(spot.x, spot.y + radius * 0.7, radius * 1.5, radius * 0.4);
  graphics.fillStyle(0x8d6e63, 1);
  graphics.fillCircle(spot.x - radius * 0.62, spot.y - radius * 0.72, radius * 0.34);
  graphics.fillCircle(spot.x + radius * 0.62, spot.y - radius * 0.72, radius * 0.34);
  graphics.fillCircle(spot.x, spot.y, radius);
  graphics.fillStyle(0xfff3e0, 1);
  graphics.fillCircle(spot.x + faceX * radius * 0.12, spot.y + radius * 0.12, radius * 0.46);
  graphics.fillStyle(0x5d4037, 1);
  graphics.fillCircle(
    spot.x + faceX * radius * 0.45,
    spot.y + faceY * radius * 0.2,
    Math.max(2, radius * 0.1),
  );
  for (let index = 0; index < balance.bearTaps; index += 1) {
    graphics.fillStyle(index < taps ? 0xe29a3a : 0xffffff, 0.95);
    graphics.fillCircle(
      spot.x - radius + index * (radius * 0.5),
      spot.y - radius * 1.45,
      Math.max(3.5, radius * 0.16),
    );
  }
}

function paintWell(graphics: Phaser.GameObjects.Graphics, layout: LevelLayout, well: Well): void {
  const { x, y, r } = layout.well;
  graphics.fillStyle(0xd7b98a, 1);
  graphics.fillCircle(x, y, r + 7);
  graphics.fillStyle(0x9e9e9e, 1);
  graphics.fillCircle(x, y, r);
  graphics.fillStyle(0x607d8b, 1);
  graphics.fillCircle(x, y, r * 0.72);
  const reserve = well.water / balance.wellCapacity;
  const pouring = well.filling ? well.fillingMs / balance.wellFillMs : 0;
  const shown = Math.min(1, reserve + pouring / balance.wellCapacity);
  if (shown > 0.04) {
    graphics.fillStyle(well.filling ? 0x81d4fa : 0x29b6f6, 1);
    graphics.fillCircle(
      x,
      y + r * 0.08 * (1 - shown),
      Math.max(4, r * 0.58 * Math.max(shown, 0.18)),
    );
  }
  graphics.lineStyle(4, 0x6d5d54, 1);
  graphics.strokeCircle(x, y, r);
  graphics.fillStyle(0x8d6e63, 1);
  graphics.fillRect(x - r * 0.7, y - r * 0.15, r * 1.4, r * 0.16);
  graphics.fillTriangle(x - r * 0.85, y - r * 0.12, x + r * 0.85, y - r * 0.12, x, y - r * 0.85);
  graphics.lineStyle(3, 0x6d4c41, 1);
  graphics.lineBetween(x, y - r * 0.7, x, y + r * 0.05);
  if (well.filling) {
    graphics.fillStyle(0x8d6e63, 1);
    graphics.fillRoundedRect(x + r * 0.72, y - r * 0.05, r * 0.38, r * 0.46, 3);
    graphics.fillStyle(0x4fc3f7, 0.9);
    graphics.fillRect(x + r * 0.8, y + r * 0.05, r * 0.22, r * 0.22 * pouring);
  }
  for (let index = 0; index < balance.wellCapacity; index += 1) {
    const angle = -Math.PI / 2 + (index / balance.wellCapacity) * Math.PI * 2;
    graphics.fillStyle(index < well.water ? 0x0288d1 : 0xeceff1, 1);
    graphics.fillCircle(
      x + Math.cos(angle) * r * 0.86,
      y + Math.sin(angle) * r * 0.86,
      Math.max(3, r * 0.1),
    );
  }
}

function pulse(ageMs: number): number {
  return 0.35 + 0.65 * Math.abs(Math.sin(ageMs / 70));
}

function unit(layout: LevelLayout): number {
  return Math.min(0.42, meadowScale(layout));
}
