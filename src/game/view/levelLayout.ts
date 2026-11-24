import { balance } from '../../data/balance';
import type { SafeArea } from '../../platform/safeArea';

export interface ButtonSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelLayout {
  portrait: boolean;
  fieldX: number;
  fieldY: number;
  fieldW: number;
  fieldH: number;
  meadow: Rect;
  well: { x: number; y: number; r: number };
  load: ButtonSlot;
  send: ButtonSlot;
  buy: ButtonSlot;
  pause: ButtonSlot;
  money: { x: number; y: number };
  timer: { x: number; y: number };
  goal: { x: number; y: number };
  warehouse: { x: number; y: number };
  chickens: { x: number; y: number };
  truck: { x: number; y: number };
  hint: { x: number; y: number };
}

export function layoutLevel(width: number, height: number, safe: SafeArea): LevelLayout {
  const portrait = height >= width;
  if (portrait) {
    return layoutPortrait(width, height, safe);
  }
  return layoutLandscape(width, height, safe);
}

function layoutPortrait(width: number, height: number, safe: SafeArea): LevelLayout {
  const top = safe.top + 8;
  const bottom = safe.bottom + 8;
  const barH = 78;
  const chromeH = 156;
  const fieldY = top + barH;
  const fieldH = Math.max(160, height - fieldY - chromeH - bottom);
  const fieldX = safe.left + 8;
  const fieldW = width - safe.left - safe.right - 16;
  const yard = placeYard(fieldX, fieldY, fieldW, fieldH);
  const gap = 8;
  const buttonW = (fieldW - gap) / 2;
  const buttonH = 52;
  const row1 = fieldY + fieldH + 36;
  const row2 = row1 + buttonH + gap;
  return {
    portrait: true,
    fieldX,
    fieldY,
    fieldW,
    fieldH,
    ...yard,
    load: { x: fieldX + buttonW / 2, y: row1 + buttonH / 2, w: buttonW, h: buttonH },
    send: {
      x: fieldX + buttonW + gap + buttonW / 2,
      y: row1 + buttonH / 2,
      w: buttonW,
      h: buttonH,
    },
    buy: { x: fieldX + buttonW / 2, y: row2 + buttonH / 2, w: buttonW, h: buttonH },
    pause: {
      x: fieldX + buttonW + gap + buttonW / 2,
      y: row2 + buttonH / 2,
      w: buttonW,
      h: buttonH,
    },
    money: { x: fieldX + 8, y: top + 8 },
    timer: { x: width - safe.right - 8, y: top + 8 },
    goal: { x: fieldX + 8, y: top + 40 },
    warehouse: { x: fieldX, y: fieldY + fieldH + 4 },
    chickens: { x: fieldX + fieldW / 2, y: fieldY + fieldH + 4 },
    truck: { x: fieldX + fieldW, y: fieldY + fieldH + 4 },
    hint: { x: yard.meadow.x + yard.meadow.w / 2, y: yard.meadow.y + 10 },
  };
}

function layoutLandscape(width: number, height: number, safe: SafeArea): LevelLayout {
  const panelW = Math.min(230, Math.max(168, width * 0.32));
  const fieldX = safe.left + panelW + 8;
  const fieldY = safe.top + 8;
  const fieldW = width - fieldX - safe.right - 8;
  const fieldH = height - safe.top - safe.bottom - 16;
  const yard = placeYard(fieldX, fieldY, fieldW, fieldH);
  const buttonW = panelW - 16;
  const buttonH = 48;
  const gap = 6;
  const x = safe.left + 8 + buttonW / 2;
  const first = safe.top + 132;
  return {
    portrait: false,
    fieldX,
    fieldY,
    fieldW,
    fieldH,
    ...yard,
    load: { x, y: first + buttonH / 2, w: buttonW, h: buttonH },
    send: { x, y: first + buttonH + gap + buttonH / 2, w: buttonW, h: buttonH },
    buy: { x, y: first + (buttonH + gap) * 2 + buttonH / 2, w: buttonW, h: buttonH },
    pause: { x, y: first + (buttonH + gap) * 3 + buttonH / 2, w: buttonW, h: buttonH },
    money: { x: safe.left + 12, y: safe.top + 8 },
    timer: { x: safe.left + panelW - 8, y: safe.top + 8 },
    goal: { x: safe.left + 12, y: safe.top + 36 },
    warehouse: { x: safe.left + 12, y: safe.top + 62 },
    chickens: { x: safe.left + 12, y: safe.top + 84 },
    truck: { x: safe.left + 12, y: safe.top + 106 },
    hint: { x: yard.meadow.x + yard.meadow.w / 2, y: yard.meadow.y + 10 },
  };
}

function placeYard(
  fieldX: number,
  fieldY: number,
  fieldW: number,
  fieldH: number,
): Pick<LevelLayout, 'meadow' | 'well'> {
  const gap = 8;
  const wellR = Math.max(40, Math.min(54, Math.min(fieldW * 0.16, fieldH * 0.16)));
  const meadowH = Math.max(72, fieldH - gap * 2 - wellR * 2 - 22);
  return {
    meadow: {
      x: fieldX + gap,
      y: fieldY + gap,
      w: Math.max(72, fieldW - gap * 2),
      h: meadowH,
    },
    well: {
      x: fieldX + wellR + gap,
      y: fieldY + fieldH - wellR - 4,
      r: wellR,
    },
  };
}

export function meadowScale(layout: LevelLayout): number {
  return Math.min(layout.meadow.w / balance.yardWidth, layout.meadow.h / balance.yardHeight);
}

export function meadowToScreen(
  layout: LevelLayout,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: layout.meadow.x + (x / balance.yardWidth) * layout.meadow.w,
    y: layout.meadow.y + (y / balance.yardHeight) * layout.meadow.h,
  };
}

export function screenToMeadow(
  layout: LevelLayout,
  x: number,
  y: number,
): { x: number; y: number } | null {
  const nx = (x - layout.meadow.x) / layout.meadow.w;
  const ny = (y - layout.meadow.y) / layout.meadow.h;
  if (nx < 0 || ny < 0 || nx > 1 || ny > 1) {
    return null;
  }
  return { x: nx * balance.yardWidth, y: ny * balance.yardHeight };
}

export function hitWell(layout: LevelLayout, x: number, y: number): boolean {
  const reach = layout.well.r + 12;
  const dx = x - layout.well.x;
  const dy = y - layout.well.y;
  return dx * dx + dy * dy <= reach * reach;
}

/** Logical tap radius that stays between minPx and maxPx on the current meadow. */
export function pointerRadius(
  layout: LevelLayout,
  minPx: number,
  maxPx: number,
  base: number,
): number {
  const scale = Math.max(0.0001, meadowScale(layout));
  return Math.min(maxPx / scale, Math.max(base, minPx / scale));
}
