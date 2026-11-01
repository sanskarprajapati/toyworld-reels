// Every physical motion as a function of global time t. Vertical motion is authored as smooth speed phases (the net force
// from tank fill vs buoyancy changes the speed gradually); the phase speeds are solved so contacts land on their beats.
// The tank fill the motion needs is derived back from it: (m0 + 800 f) g = ρ V g − M a − drag.
import { clamp, lerp } from '../lib/util.js';
import { LAKE, JETTY } from './set.js';

export const G = 9.81, RHO = 1000;
export const SUBP = { V: 6, m0: 5200, tank: 1600, Cd: 0.6, A: Math.PI * 0.8 ** 2 };   // f = 0.5 hovers; terminal speed with f = 0 or 1 ≈ 3.6 m/s
const H = 1 / 240;
const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const vAt = (keys, vals, t) => {
  const val = x => (typeof x === 'string' ? vals[x] : x);
  if (t <= keys[0][0]) return val(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) return val(a) + (val(b) - val(a)) * smooth((t - t0) / (t1 - t0));
  }
  return val(keys[keys.length - 1][1]);
};
const integ = (keys, vals, y0, t0, t) => { let y = y0; for (let u = t0; u < t; u += H) y += vAt(keys, vals, u + H / 2) * Math.min(H, t - u); return y; };
const lin = (vals, name, f) => { const fa = f({ ...vals, [name]: 0 }), fb = f({ ...vals, [name]: 1 }); vals[name] = -fa / (fb - fa); };
// damped spring around 0, starting from x0 with speed v0
export function bob(u, x0, v0, w = 3.2, z = 0.22) {
  const wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * u);
  return e * (x0 * Math.cos(wd * u) + (v0 + z * w * x0) / wd * Math.sin(wd * u));
}
const lerp3 = (a, b, k) => a.map((x, i) => lerp(x, b[i], k));

export function makePhysics(T) {
  const at = (id, k) => T.start(id) + k * T.dur(id);
  const P = { T, at };
  const W = LAKE.water;

  // ---------- 01-06: the barrel with the rock ----------
  {
    const tKick = at('02', 0.3), deck = [0.25, JETTY.y + 0.04, JETTY.z1 + 0.55];
    const v0 = [0, 1.2, -1.6], tEntry = tKick + (v0[1] + Math.sqrt(v0[1] ** 2 + 2 * G * (deck[1] + 0.45 - W))) / G;   // rock bottom hits the water
    const vt = 4.0, tau = 0.35, base = LAKE.bed + 0.75;   // rock under the base: barrel base rests 0.75 above the sand
    const entryY = W + 0.45, depth = entryY - base;
    // y(u) = entryY − vt (u − tau (1 − e^(−u/tau))) (speed relaxes to the terminal speed); solve the landing time
    let tLand = tEntry; { let u = 0; while (vt * (u - tau * (1 - Math.exp(-u / tau))) < depth) u += 0.001; tLand = tEntry + u; }
    const xEntry = [deck[0], deck[2] + v0[2] * (tEntry - tKick)];
    const tHaul = at('06', 0.1), tUp = at('06', 0.55);
    P.barrel = { tKick, tEntry, tLand, tHaul, tUp, deck, xEntry, vt };
    P.barrelAt = t => {
      if (t < tKick) return { p: deck, tilt: 0 };
      if (t < tEntry) { const u = t - tKick; return { p: [deck[0], deck[1] + v0[1] * u - 0.5 * G * u * u, deck[2] + v0[2] * u], tilt: -2.2 * u }; }
      if (t < tLand) { const u = t - tEntry; return { p: [xEntry[0], entryY - vt * (u - tau * (1 - Math.exp(-u / tau))) - 0.45, xEntry[1] - 0.6 * (1 - Math.exp(-u * 2))], tilt: -2.2 * (tEntry - tKick) * Math.exp(-u * 3) }; }
      const rest = [xEntry[0], base, xEntry[1] - 0.6];
      if (t < tHaul) return { p: rest, tilt: 0.05 * Math.exp(-(t - tLand) * 4) * Math.sin((t - tLand) * 20) };
      const k = smooth((t - tHaul) / (tUp - tHaul)), y = lerp(base, W - 0.35, k);   // hauled up the rope; floats once the rock is off the bottom
      return { p: [xEntry[0], t < tUp ? y : W - 0.35 + bob(t - tUp, 0.25, 0.8), lerp(xEntry[1] - 0.6, xEntry[1] + 0.4, k)], tilt: 0.1 * Math.sin(t * 3) * k };
    };
  }

  // ---------- 09-10: Ben jumps on the beach ball, pushes it under, it launches him ----------
  {
    const c = [-3.2, W + 0.82, 6.0], tJump = at('09', 0.15), tOn = at('09', 0.65), tUp = at('10', 0.08);
    const from = [-0.7, JETTY.y + 0.05, 9.2];
    const flight = tOn - tJump, top = c[1] + 0.9;
    const vy = (top - from[1] + 0.5 * G * flight * flight) / flight;
    const vLaunch = 4.5;
    P.ball = { c, tJump, tOn, tUp, from, vLaunch };
    // ball centre and Ben's feet
    P.ballAt = t => {
      if (t < tOn) return [c[0], c[1] + 0.04 * Math.sin(t * 3), c[2]];
      if (t < tUp) { const k = smooth((t - tOn) / (tUp - tOn)); return [c[0], c[1] - 0.95 * k, c[2]]; }
      return [c[0], c[1] + bob(t - tUp, -0.95, 4.5, 4.5, 0.3), c[2]];
    };
    P.benBall = t => {
      if (t < tJump) return { p: from, air: false };
      if (t < tOn) { const u = t - tJump, k = u / flight; return { p: [lerp(from[0], c[0], k), from[1] + vy * u - 0.5 * G * u * u, lerp(from[2], c[2], k)], air: true }; }
      if (t < tUp) { const b = P.ballAt(t); return { p: [b[0], b[1] + 0.86, b[2]], air: false }; }
      const u = t - tUp, p = [c[0] + 0.8 * u, c[1] - 0.95 + 0.86 + vLaunch * u - 0.5 * G * u * u, c[2] - 1.2 * u];
      return { p: [p[0], Math.max(W - 1.2, p[1]), p[2]], air: p[1] > W, splash: tUp + (vLaunch + Math.sqrt(vLaunch ** 2 + 2 * G * (c[1] - 0.09 - W))) / G };
    };
  }

  // ---------- 15-45: the submarine ----------
  const yFloat = W + 0.62, yBottom = LAKE.bed + 0.8 + 0.3, yHover = -4.0, yPeri = W - 2.9, yDeep = -6.3;
  const S = {
    tHook: at('15', 0.0), tSplash: at('15', 0.6), tVent: at('16', 0.35), tBottom: at('18', 0.8), tPump: at('20', 0.2), tLift: at('20', 0.4), tHover: at('21', 0.2),
    tGo: at('23', 0.15), tPeri: at('25', 0.0), tUnder: at('27', 0.5), tTow: at('29', 0.3), tDive: at('32', 0.0), tStop: at('33', 0.4),
    tBlow: at('36', 0.35), tBreach: at('38', 0.3), tSail: at('42', 0.2), tDock: at('43', 0.6),
  };
  P.S = S; P.yFloat = yFloat;
  const keys = [
    [S.tVent, 0], [S.tVent + 0.8, 'sink'], [S.tBottom - 0.05, 'sink'], [S.tBottom, 0],
    [S.tLift, 0], [S.tLift + 0.5, 'lift'], [S.tHover - 0.2, 'lift'], [S.tHover + 0.4, 0],
    [S.tPeri, 0], [S.tPeri + 0.5, 'peri'], [at('25', 0.9), 0],
    [S.tDive, 0], [S.tDive + 0.6, 'dive'], [S.tStop + 0.6, 0],
    [S.tBlow, 0], [S.tBlow + 0.8, 'blow'], [S.tBreach, 'blow'],
  ];
  const vals = { sink: -1, lift: 1, peri: 1, dive: -1, blow: 3 };
  lin(vals, 'sink', v => integ(keys, v, yFloat, S.tVent, S.tBottom) - yBottom);
  lin(vals, 'lift', v => integ(keys, v, yFloat, S.tVent, S.tHover + 0.4) - yHover);
  lin(vals, 'peri', v => integ(keys, v, yFloat, S.tVent, at('25', 0.9)) - yPeri);
  lin(vals, 'dive', v => integ(keys, v, yFloat, S.tVent, S.tStop + 0.6) - yDeep);
  lin(vals, 'blow', v => integ(keys, v, yFloat, S.tVent, S.tBreach) - yFloat);
  P.subVals = vals;
  const N = Math.ceil((S.tBreach - S.tVent) / H) + 2, ys = new Float32Array(N);
  { let y = yFloat; for (let i = 0; i < N; i++) { ys[i] = y; y += vAt(keys, vals, S.tVent + (i + 0.5) * H) * H; } }
  const vBreach = vAt(keys, vals, S.tBreach - 0.01);
  P.subY = t => {
    if (t < S.tSplash) return lerp(4.2, yFloat, smooth((t - S.tHook) / (S.tSplash - S.tHook)) ** 2);
    if (t < S.tVent) return yFloat + bob(t - S.tSplash, -0.5, -1.5);
    if (t < S.tBreach) return ys[clamp(Math.round((t - S.tVent) / H), 0, N - 1)];
    return yFloat + bob(t - S.tBreach, 0, vBreach, 3.0, 0.2);   // pops out, falls back, bobs to its floating line
  };
  P.subVy = t => (t > S.tVent && t < S.tBreach ? vAt(keys, vals, t) : 0);

  // horizontal path: keyframes [t, x, z] with smoothstep between (each leg starts and ends at rest)
  const launch = [2.2, 7.4], boatSpot = [9.5, -1.5], stop = [-5.5, -6.0], dock = [-10, -8.4];
  const hk = [
    [0, ...launch], [S.tGo, ...launch], [S.tUnder, ...boatSpot], [S.tTow, ...boatSpot], [S.tStop, ...stop], [S.tSail, ...stop], [S.tDock, ...dock],
  ];
  const xz = t => {
    if (t <= hk[0][0]) return [hk[0][1], hk[0][2]];
    for (let i = 0; i < hk.length - 1; i++) {
      const [t0, x0, z0] = hk[i], [t1, x1, z1] = hk[i + 1];
      if (t <= t1) { const k = smooth((t - t0) / (t1 - t0)); return [lerp(x0, x1, k), lerp(z0, z1, k)]; }
    }
    const l = hk[hk.length - 1]; return [l[1], l[2]];
  };
  P.subXZ = xz;
  const heading = t => { const a = xz(t - 0.25), b = xz(t + 0.25), dx = b[0] - a[0], dz = b[1] - a[1]; return Math.hypot(dx, dz) > 0.02 ? Math.atan2(dx, dz) : null; };
  // smoothed yaw: hold the last heading while stopped
  const yawTab = []; { let last = Math.atan2(boatSpot[0] - launch[0], boatSpot[1] - launch[1]); for (let t = 0; t <= T.total + 1; t += 0.05) { const h = heading(t); if (h !== null) last = h; yawTab.push(last); } }
  P.subYaw = t => yawTab[clamp(Math.round(t / 0.05), 0, yawTab.length - 1)];
  P.subSpeed = t => { const a = xz(t - 0.05), b = xz(t + 0.05); return Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1; };
  P.subPos = t => { const p = xz(t); return [p[0], P.subY(t), p[1]]; };
  // pitch: nose follows the vertical speed a little
  P.subPitch = t => -0.12 * clamp(P.subVy(t) / 2, -1, 1);
  // tank fill (the pilot's control): vents flood the tanks, the pump trims to half (neutral), the air blows them empty
  const fk = [[0, 0], [S.tVent - 0.6, 0], [S.tVent + 1.6, 1], [S.tPump, 1], [S.tLift + 0.2, 0.44], [S.tHover, 0.5], [S.tPeri, 0.5], [S.tPeri + 0.3, 0.45], [at('25', 0.9), 0.5],
    [S.tDive, 0.5], [S.tDive + 0.4, 0.62], [S.tStop + 0.6, 0.5], [S.tBlow, 0.5], [S.tBlow + 0.8, 0], [T.total + 1, 0]];
  P.fill = t => vAt(fk, {}, t);
  // ---------- the neighbour's rowboat: static, then towed along the sub's path, then glides to a stop over it ----------
  const lagTow = S.tTow - S.tUnder;
  const boatOff = [3.0, -2.2];     // the boat floats a little away from where the sub stops under it; the tow pulls it into line
  P.boatXZ = t => {
    if (t < S.tTow) return [boatSpot[0] + boatOff[0], boatSpot[1] + boatOff[1]];
    if (t > S.tBreach) return xz(S.tBreach);
    const L = t < S.tDive ? lagTow : lerp(lagTow, 0, smooth((t - S.tDive) / (S.tBreach - 0.25 - S.tDive)));
    const p = xz(t - L), k = 1 - smooth((t - S.tTow) / 1.6);
    return [p[0] + boatOff[0] * k, p[1] + boatOff[1] * k];
  };
  P.boatYaw = t => { const a = P.boatXZ(t - 0.2), b = P.boatXZ(t + 0.2); return Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.02 ? Math.atan2(b[0] - a[0], b[1] - a[1]) : -0.6; };
  // flipped by the breaching sub: thrown up and over (rigid body, ballistic), lands upside down and bobs
  P.boatFlip = t => {
    const u = t - S.tBreach + 0.05;
    if (u < 0) return { dy: 0.05 * Math.sin(t * 2.2), roll: 0.04 * Math.sin(t * 1.7), off: 0 };
    const tf = 2 * 3.2 / G;
    if (u < tf) return { dy: 3.2 * u - 0.5 * G * u * u, roll: Math.PI * smooth(u / tf), off: 2.2 * u / tf };
    return { dy: bob(u - tf, -0.15, -0.8), roll: Math.PI, off: 2.2 };
  };
  P.neighFly = t => {   // the neighbour thrown clear: ballistic from the boat
    const u = t - S.tBreach;
    const b = P.boatXZ(S.tBreach), vy = 5.5, dx = -2.4;
    const y = W + 0.5 + vy * u - 0.5 * G * u * u, tIn = (vy + Math.sqrt(vy * vy + 2 * G * 0.5)) / G;
    return { p: [b[0] + dx * Math.min(u, tIn), Math.max(W - 0.9, y), b[1] + 0.6 * Math.min(u, tIn)], tIn: S.tBreach + tIn, u };
  };
  return P;
}
