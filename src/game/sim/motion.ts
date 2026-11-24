import { balance } from '../../data/balance';

export interface Vec {
  x: number;
  y: number;
}

export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clampToYard(x: number, y: number): Vec {
  const min = balance.yardMargin;
  return {
    x: Math.min(balance.yardWidth - min, Math.max(min, x)),
    y: Math.min(balance.yardHeight - min, Math.max(min, y)),
  };
}

export function inYard(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x <= balance.yardWidth && y <= balance.yardHeight;
}

export function inPlantable(x: number, y: number): boolean {
  const margin = balance.grassMargin;
  return (
    x >= margin &&
    y >= margin &&
    x <= balance.yardWidth - margin &&
    y <= balance.yardHeight - margin
  );
}

/** Walk toward a point. Speed is units per second. */
export function moveToward(from: Vec, to: Vec, speed: number, dt: number): Vec {
  const dist = distance(from, to);
  if (dist < 0.5) {
    return clampToYard(to.x, to.y);
  }
  const step = Math.min(dist, (speed * dt) / 1000);
  return clampToYard(
    from.x + ((to.x - from.x) / dist) * step,
    from.y + ((to.y - from.y) / dist) * step,
  );
}

/** Walk along a heading and bounce off the pen fence. */
export function moveHeading(
  from: Vec,
  heading: number,
  speed: number,
  dt: number,
): { x: number; y: number; heading: number } {
  const step = (speed * dt) / 1000;
  let x = from.x + Math.cos(heading) * step;
  let y = from.y + Math.sin(heading) * step;
  let next = heading;
  const min = balance.yardMargin;
  const maxX = balance.yardWidth - min;
  const maxY = balance.yardHeight - min;
  if (x < min) {
    x = min;
    next = Math.PI - next;
  } else if (x > maxX) {
    x = maxX;
    next = Math.PI - next;
  }
  if (y < min) {
    y = min;
    next = -next;
  } else if (y > maxY) {
    y = maxY;
    next = -next;
  }
  return { x, y, heading: normalizeAngle(next) };
}

export function headingToward(from: Vec, to: Vec): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function headingAway(from: Vec, threat: Vec): number {
  return Math.atan2(from.y - threat.y, from.x - threat.x);
}

export function nearest<T extends Vec>(origin: Vec, spots: readonly T[]): T | null {
  let best: T | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const spot of spots) {
    const away = distance(origin, spot);
    if (away < bestDistance) {
      best = spot;
      bestDistance = away;
    }
  }
  return best;
}

function normalizeAngle(angle: number): number {
  const tau = Math.PI * 2;
  const wrapped = angle % tau;
  return wrapped < 0 ? wrapped + tau : wrapped;
}
