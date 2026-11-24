import type { SafeArea } from '../../platform/safeArea';

export const BOARD_PAD = 12;

export interface ButtonSlot {
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
  cell: number;
  originX: number;
  originY: number;
  cols: number;
  rows: number;
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

export function layoutLevel(
  width: number,
  height: number,
  safe: SafeArea,
  cols: number,
  rows: number,
): LevelLayout {
  const portrait = height >= width;
  if (portrait) {
    return layoutPortrait(width, height, safe, cols, rows);
  }
  return layoutLandscape(width, height, safe, cols, rows);
}

function layoutPortrait(
  width: number,
  height: number,
  safe: SafeArea,
  cols: number,
  rows: number,
): LevelLayout {
  const top = safe.top + 8;
  const bottom = safe.bottom + 8;
  const barH = 86;
  const chromeH = 156;
  const fieldY = top + barH;
  const fieldH = Math.max(120, height - fieldY - chromeH - bottom);
  const fieldX = safe.left + 8;
  const fieldW = width - safe.left - safe.right - 16;
  const grid = fitGrid(fieldX, fieldY, fieldW, fieldH, cols, rows);
  const gap = 8;
  const buttonW = (fieldW - gap) / 2;
  const buttonH = 52;
  const row1 = fieldY + fieldH + 36;
  const row2 = row1 + buttonH + gap;
  return {
    portrait: true,
    ...grid,
    fieldX,
    fieldY,
    fieldW,
    fieldH,
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
    hint: { x: fieldX + fieldW / 2, y: fieldY + 18 },
  };
}

function layoutLandscape(
  width: number,
  height: number,
  safe: SafeArea,
  cols: number,
  rows: number,
): LevelLayout {
  const panelW = Math.min(230, Math.max(168, width * 0.32));
  const fieldX = safe.left + panelW + 8;
  const fieldY = safe.top + 8;
  const fieldW = width - fieldX - safe.right - 8;
  const fieldH = height - safe.top - safe.bottom - 16;
  const grid = fitGrid(fieldX, fieldY, fieldW, fieldH, cols, rows);
  const buttonW = panelW - 16;
  const buttonH = 48;
  const gap = 6;
  const x = safe.left + 8 + buttonW / 2;
  const first = safe.top + 132;
  return {
    portrait: false,
    ...grid,
    fieldX,
    fieldY,
    fieldW,
    fieldH,
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
    hint: { x: fieldX + fieldW / 2, y: fieldY + fieldH - 16 },
  };
}

function fitGrid(
  fieldX: number,
  fieldY: number,
  fieldW: number,
  fieldH: number,
  cols: number,
  rows: number,
): Pick<LevelLayout, 'cell' | 'originX' | 'originY' | 'cols' | 'rows'> {
  const innerW = Math.max(0, fieldW - BOARD_PAD * 2);
  const innerH = Math.max(0, fieldH - BOARD_PAD * 2);
  const cell = Math.max(8, Math.floor(Math.min(innerW / cols, innerH / rows)));
  const gridW = cell * cols;
  const gridH = cell * rows;
  return {
    cell,
    cols,
    rows,
    originX: fieldX + (fieldW - gridW) / 2,
    originY: fieldY + (fieldH - gridH) / 2,
  };
}

export function cellAt(layout: LevelLayout, x: number, y: number): { x: number; y: number } | null {
  const col = Math.floor((x - layout.originX) / layout.cell);
  const row = Math.floor((y - layout.originY) / layout.cell);
  if (col < 0 || row < 0 || col >= layout.cols || row >= layout.rows) {
    return null;
  }
  return { x: col, y: row };
}
