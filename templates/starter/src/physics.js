// Physical motion as closed-form functions of global time t, solved once against the timeline.
// The ball: dropped from rest at height h0, it bounces with restitution e (each bounce keeps e of its speed).
export const G = 9.81;

export function makePhysics(T) {
  const at = (id, k) => T.start(id) + k * T.dur(id);
  const P = { T };
  const tDrop = at('02', 0.15), h0 = 1.05, e = 0.7, r = 0.12;
  const v1 = Math.sqrt(2 * G * (h0 - r)), t1 = v1 / G;                // first fall
  const hops = [];                                                     // [start, launch speed] of each bounce
  for (let n = 1, t = tDrop + t1, v = v1 * e; n < 12; n++, t += 2 * v / G, v *= e) hops.push([t, v]);
  P.ball = { tDrop, h0, e, hops, tLand: tDrop + t1 };
  P.ballY = t => {
    if (t < tDrop) return h0;
    if (t < tDrop + t1) { const u = t - tDrop; return h0 - 0.5 * G * u * u; }
    for (const [t0, v] of hops) if (t < t0 + 2 * v / G) { const u = t - t0; return r + v * u - 0.5 * G * u * u; }
    return r;
  };
  return P;
}
