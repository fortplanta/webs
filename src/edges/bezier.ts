export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function getBezierMidpoint(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5;
  const cp1x = x1 + dx, cp1y = y1;
  const cp2x = x2 - dx, cp2y = y2;
  return {
    mx: 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2,
    my: 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2,
  };
}
