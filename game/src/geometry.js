// geometry.js — small pure helpers: lines of sight, cones, circle-vs-rect.
// No DOM, no canvas: node can import this file to unit-test the heist logic.

// Does segment (x1,y1)-(x2,y2) cross the axis-aligned rect?
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // Slab test on x, then on y.
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.width) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.width - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.height) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.height - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// True when any rect blocks the segment (a wall, case or desk in the way).
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (const rect of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
  }
  return false;
}

// Smallest absolute angle between two headings, 0..PI.
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

// Is point (px,py) inside the cone from (ox,oy), heading, fov, range?
export function pointInCone(px, py, ox, oy, heading, fov, range) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const angle = Math.atan2(dy, dx);
  return angleDifference(angle, heading) <= fov / 2;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function pointInRect(px, py, rect) {
  return (
    px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height
  );
}

// Push a circle out of every rect it overlaps; returns true when it moved.
export function resolveCircleVsRects(circle, rects) {
  let moved = false;
  for (const rect of rects) {
    const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= circle.radius * circle.radius) continue;
    moved = true;
    if (distSq === 0) {
      // Centre inside the rect: shove out along the smallest penetration.
      const left = circle.x - rect.x;
      const right = rect.x + rect.width - circle.x;
      const top = circle.y - rect.y;
      const bottom = rect.y + rect.height - circle.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) circle.x = rect.x - circle.radius;
      else if (min === right) circle.x = rect.x + rect.width + circle.radius;
      else if (min === top) circle.y = rect.y - circle.radius;
      else circle.y = rect.y + rect.height + circle.radius;
      continue;
    }
    const dist = Math.sqrt(distSq);
    circle.x = nearestX + (dx / dist) * circle.radius;
    circle.y = nearestY + (dy / dist) * circle.radius;
  }
  return moved;
}

// Clamp a circle inside the hall bounds (the outer walls).
export function clampCircleToHall(circle, hall) {
  circle.x = Math.max(hall.x + circle.radius, Math.min(hall.x + hall.width - circle.radius, circle.x));
  circle.y = Math.max(hall.y + circle.radius, Math.min(hall.y + hall.height - circle.radius, circle.y));
}
