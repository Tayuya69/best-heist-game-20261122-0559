// Sapphire Heist v2 — small geometry helpers. Pure functions, no game state:
// circle-vs-rectangle movement, segment-vs-rectangle line of sight, angles.
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Shortest signed difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does a circle (cx, cy, radius) overlap a rectangle?
export function circleHitsRect(cx, cy, radius, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}

// Move a circle by (dx, dy) with axis separation so it slides along walls
// instead of sticking: try x first, then y, skipping any axis that collides.
export function moveCircle(pos, radius, dx, dy, solids) {
  let nx = pos.x + dx;
  for (const s of solids) {
    if (circleHitsRect(nx, pos.y, radius, s)) { nx = pos.x; break; }
  }
  let ny = pos.y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, ny, radius, s)) { ny = pos.y; break; }
  }
  pos.x = nx;
  pos.y = ny;
}

// True when the segment (ax, ay)-(bx, by) crosses a rectangle's interior.
function segmentHitsRect(ax, ay, bx, by, r) {
  if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    if (segmentsCross(ax, ay, bx, by, x1, y1, x2, y2)) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Line of sight: true when nothing solid sits between the two points.
export function hasLineOfSight(ax, ay, bx, by, solids) {
  for (const s of solids) {
    if (segmentHitsRect(ax, ay, bx, by, s)) return false;
  }
  return true;
}

// Is the target inside a vision cone (range + half-angle + line of sight)?
export function inCone(ox, oy, facing, range, halfAngle, tx, ty, solids) {
  const d = dist(ox, oy, tx, ty);
  if (d > range) return false;
  const ang = Math.atan2(ty - oy, tx - ox);
  if (Math.abs(angleDiff(ang, facing)) > halfAngle) return false;
  return hasLineOfSight(ox, oy, tx, ty, solids);
}
