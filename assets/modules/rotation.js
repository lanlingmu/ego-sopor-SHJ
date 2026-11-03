// Unit quaternions, in screen coordinates: x right, y down, z toward viewer.
export function normalize(q) {
  const length = Math.hypot(...q) || 1;
  return q.map(value => value / length);
}

export function multiply(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return normalize([
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ]);
}

export function axisAngle(x, y, z, angle) {
  const sine = Math.sin(angle / 2);
  return [x * sine, y * sine, z * sine, Math.cos(angle / 2)];
}

export function slerp(from, to, amount) {
  let end = to;
  let dot = from.reduce((sum, value, i) => sum + value * end[i], 0);
  if (dot < 0) { end = to.map(value => -value); dot = -dot; }
  dot = Math.min(1, dot);
  if (dot > .9995) return normalize(from.map((value, i) => value + (end[i] - value) * amount));
  const angle = Math.acos(dot), sine = Math.sin(angle);
  const startWeight = Math.sin((1 - amount) * angle) / sine;
  const endWeight = Math.sin(amount * angle) / sine;
  return from.map((value, i) => value * startWeight + end[i] * endWeight);
}

export function rotationBetween(from, to) {
  const dot = from.reduce((sum, value, i) => sum + value * to[i], 0);
  if (dot < -.999999) {
    const axis = Math.abs(from[0]) < .9 ? [0, -from[2], from[1], 0] : [-from[1], from[0], 0, 0];
    return normalize(axis);
  }
  return normalize([
    from[1] * to[2] - from[2] * to[1],
    from[2] * to[0] - from[0] * to[2],
    from[0] * to[1] - from[1] * to[0],
    1 + dot,
  ]);
}

export function matrix(q) {
  const [x, y, z, w] = q;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ];
}

export function distance(a, b) {
  return 1 - Math.abs(a.reduce((sum, value, i) => sum + value * b[i], 0));
}

// Intersect a pointer ray with the front of the grab sphere, using the same
// perspective as the renderer. This anchors a surface point, not a yaw sign.
export function spherePoint(x, y, radius, focal = 680) {
  const outline = focal * radius / Math.sqrt(focal * focal - radius * radius);
  const length = Math.hypot(x, y);
  if (length > outline * .999999) {
    const scale = outline * .999999 / length; x *= scale; y *= scale;
  }
  const a = x * x + y * y + focal * focal;
  const discriminant = Math.max(0, focal ** 4 - a * (focal * focal - radius * radius));
  const t = (focal * focal - Math.sqrt(discriminant)) / a;
  const point = [t * x, t * y, focal * (1 - t)];
  const norm = Math.hypot(...point);
  return point.map(value => value / norm);
}
