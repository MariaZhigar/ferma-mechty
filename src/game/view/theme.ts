export const theme = {
  fontFamily: 'Nunito, "Segoe UI", sans-serif',
  skyTop: 0x7ec8ea,
  skyBottom: 0xf6e3b2,
  sunCore: 0xffd15c,
  sunGlow: 0xfff3c4,
  cloud: 0xffffff,
  hillFar: 0x9ccc65,
  hillNear: 0x7cb342,
  hillShadow: 0x689f38,
  barnWall: 0xe15b4a,
  barnRoof: 0x8d3b32,
  barnDoor: 0xfff3d6,
  panelFill: 0xfff8e8,
  panelBorder: 0xc47a3a,
  ink: '#5d3a1a',
  inkMuted: '#8a6240',
  buttonFill: 0xfff8e8,
  buttonBorder: 0xc47a3a,
  buttonSelected: 0xe29a3a,
  buttonSelectedBorder: 0xb56d12,
  buttonSelectedText: '#fffaf2',
} as const;

export function lerpColor(from: number, to: number, t: number): number {
  const amount = Math.min(1, Math.max(0, t));
  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;
  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;
  const r = Math.round(fr + (tr - fr) * amount);
  const g = Math.round(fg + (tg - fg) * amount);
  const b = Math.round(fb + (tb - fb) * amount);
  return (r << 16) | (g << 8) | b;
}
