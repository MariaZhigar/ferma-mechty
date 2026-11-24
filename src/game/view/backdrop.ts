import Phaser from 'phaser';
import { lerpColor, theme } from './theme';

export function paintBackdrop(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  graphics.clear();
  paintSky(graphics, width, height);
  paintSun(graphics, width);
  paintCloud(graphics, width * 0.18, height * 0.16, Math.max(0.8, width / 900));
  paintCloud(graphics, width * 0.42, height * 0.1, Math.max(0.7, width / 1100));
  paintHills(graphics, width, height);
  paintBarn(graphics, width * 0.78, height * 0.7, Math.max(0.7, Math.min(1.3, width / 1000)));
}

function paintSky(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  const bands = 40;
  for (let index = 0; index < bands; index += 1) {
    const y = Math.floor((height * index) / bands);
    const next = Math.floor((height * (index + 1)) / bands);
    graphics.fillStyle(lerpColor(theme.skyTop, theme.skyBottom, index / (bands - 1)), 1);
    graphics.fillRect(0, y, width, next - y + 1);
  }
}

function paintSun(graphics: Phaser.GameObjects.Graphics, width: number): void {
  const x = width * 0.82;
  const y = Math.max(72, width * 0.06);
  graphics.fillStyle(theme.sunGlow, 0.9);
  graphics.fillCircle(x, y, 78);
  graphics.fillStyle(theme.sunCore, 1);
  graphics.fillCircle(x, y, 46);
}

function paintCloud(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  graphics.fillStyle(theme.cloud, 0.92);
  graphics.fillCircle(x, y, 18 * scale);
  graphics.fillCircle(x + 24 * scale, y - 10 * scale, 24 * scale);
  graphics.fillCircle(x + 50 * scale, y, 16 * scale);
}

function paintHills(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  graphics.fillStyle(theme.hillFar, 1);
  graphics.fillPoints(
    [
      { x: 0, y: height * 0.78 },
      { x: width * 0.22, y: height * 0.68 },
      { x: width * 0.48, y: height * 0.76 },
      { x: width * 0.72, y: height * 0.64 },
      { x: width, y: height * 0.74 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    true,
    true,
  );
  graphics.fillStyle(theme.hillNear, 1);
  graphics.fillPoints(
    [
      { x: 0, y: height * 0.86 },
      { x: width * 0.3, y: height * 0.78 },
      { x: width * 0.62, y: height * 0.88 },
      { x: width, y: height * 0.8 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    true,
    true,
  );
  graphics.fillStyle(theme.hillShadow, 1);
  graphics.fillEllipse(width * 0.22, height * 0.93, width * 0.55, height * 0.12);
}

function paintBarn(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  graphics.fillStyle(theme.barnRoof, 1);
  graphics.fillTriangle(
    x,
    y + 18 * scale,
    x + 46 * scale,
    y - 28 * scale,
    x + 92 * scale,
    y + 18 * scale,
  );
  graphics.fillStyle(theme.barnWall, 1);
  graphics.fillRect(x + 8 * scale, y + 16 * scale, 76 * scale, 52 * scale);
  graphics.fillStyle(theme.barnDoor, 1);
  graphics.fillRoundedRect(x + 32 * scale, y + 36 * scale, 24 * scale, 32 * scale, 4);
}
