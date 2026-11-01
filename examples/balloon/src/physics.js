// The balloon's flight as functions of global time t.
// Vertical: the burner and the vent set the net force, so the vertical speed changes smoothly between "phases"
// (burner on → accelerate up, off → the air cools and it sinks, burner on again → it brakes, stops, climbs).
// The balloon answers late: after Ben fires the burner it keeps sinking until the speed crosses zero (the scrape).
// Each phase's speed is solved so the beats land in their shots: the roof ridge, the high layer, touchdown.
// The inside temperature shown on the gauge is what that motion needs: lift = m(g + a) + drag, Ti = Ta / (1 − lift / (ρa V g)).
// Horizontal: the velocity relaxes towards the wind at the balloon's height (integrated once, fixed step).
import { clamp } from '../lib/util.js';

export const G = 9.81;
export const AIR = { Ta: 293, rho: 1.2 };
export const BAL = { V: 600, m: 100, Cd: 0.5, A: Math.PI * 4.5 ** 2 };
export const WIND = { lo: [2.4, 0], hi: [0.6, -3.0], y0: 21, y1: 26, tau: 2.0 };
export const ROOF_RIDGE = 7.9;
const H = 1 / 240;
const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };

export function wind(y) {
  const e = smooth((y - WIND.y0) / (WIND.y1 - WIND.y0));
  return [WIND.lo[0] + (WIND.hi[0] - WIND.lo[0]) * e, WIND.lo[1] + (WIND.hi[1] - WIND.lo[1]) * e];
}

// vertical speed keyed as [t, v] with smoothstep blends; string values name a solved phase speed
function vAt(keys, vals, t) {
  const val = x => (typeof x === 'string' ? vals[x] : x);
  if (t <= keys[0][0]) return val(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) return val(a) + (val(b) - val(a)) * smooth((t - t0) / (t1 - t0));
  }
  return val(keys[keys.length - 1][1]);
}

export function makeFlight(T) {
  const s = id => T.start(id), at = (id, k) => s(id) + k * T.dur(id);
  const B = {
    tBurn: at('17', 0.1),          // first burn: the envelope stands up (the basket is tethered)
    tRelease: at('20', 0.12),      // the narrator pulls the quick-release knot
    tOff: at('23', 0.3),           // burner off high over the island
    tOn: at('30', 0.35),           // Ben yanks the burner on again ...
    tScrape: at('31', 0.5),        // ... but it keeps sinking until here: the roof ridge
    tOff2: at('35', 0.8),
    tVent: at('39', 0.15),
    tTouch: at('43', 0.25),
  };
  const keys = [
    [B.tRelease, 0], [B.tRelease + 1.4, 'up'], [B.tOff, 'up'], [B.tOff + 3.0, 'sink'], [B.tOn, 'sink'], [B.tScrape, 0],
    [B.tScrape + 1.8, 'climb'], [B.tOff2, 'climb'], [B.tOff2 + 2.0, 0], [B.tOff2 + 3.2, -1.8], [B.tVent, -1.8], [B.tVent + 1.6, 'drop'], [B.tTouch + 1, 'drop'],
  ];
  const vals = { up: 4.2, sink: -2, climb: 4, drop: -3 };   // a cold envelope falls like a parachute: ~7 m/s at most
  const y = (t, v = vals) => { let acc = 0; for (let u = B.tRelease; u < t; u += H) acc += vAt(keys, v, u + H / 2) * H; return acc; };
  // height is linear in each phase speed, so one secant step per phase is exact
  const lin = (name, f) => { const fa = f({ ...vals, [name]: 0 }), fb = f({ ...vals, [name]: 1 }); vals[name] = -fa / (fb - fa); };
  lin('sink', v => y(B.tScrape, v) - (ROOF_RIDGE - 0.12));
  lin('climb', v => y(B.tOff2 + 2.0, v) - 29);
  lin('drop', v => y(B.tTouch, v));

  // tabulate height, vertical speed, horizontal position and velocity
  const N = Math.ceil((T.total + 2) / H), tab = new Float32Array(N * 6);
  let Y = 0, X = 0, Z = 0, vx = 0, vz = 0;
  for (let i = 0; i < N; i++) {
    const t = i * H, flying = t >= B.tRelease && t < B.tTouch;
    const vy = flying ? vAt(keys, vals, t) : 0;
    tab.set([Y, vy, X, Z, vx, vz], i * 6);
    if (!flying) continue;
    Y = Math.max(0, Y + vy * H);
    const w = wind(Y);
    vx += (w[0] - vx) / WIND.tau * H; vz += (w[1] - vz) / WIND.tau * H;
    X += vx * H; Z += vz * H;
  }
  const row = t => { const i = clamp(Math.round(t / H), 0, N - 1) * 6; return tab.subarray(i, i + 6); };
  const F = { B, vals, keys };
  const L = row(B.tTouch - H);
  F.landing = [L[2], L[3]];
  const sp = Math.hypot(L[4], L[5]);
  F.dir = [L[4] / sp, L[5] / sp];
  // after touchdown: one bounce, then the envelope (still catching the wind) drags the basket along until friction stops it
  const v0 = sp * 1.4, mu = 0.45 * G * 0.35, vb = -vals.drop * 0.3, tb = 2 * vb / G;
  F.slideEnd = v0 / mu; F.tb = tb;
  F.slide = u => { u = clamp(u, 0, F.slideEnd); return v0 * u - 0.5 * mu * u * u; };
  F.stop = [F.landing[0] + F.dir[0] * F.slide(1e9), F.landing[1] + F.dir[1] * F.slide(1e9)];

  // basket floor [x, y, z] at t
  F.pos = t => {
    if (t < B.tTouch) { const r = row(t); return [r[2], r[0], r[3]]; }
    const u = t - B.tTouch, sl = F.slide(u), hop = u < tb ? vb * u - 0.5 * G * u * u : 0;
    return [F.landing[0] + F.dir[0] * sl, Math.max(0, hop), F.landing[1] + F.dir[1] * sl];
  };
  F.vy = t => (t < B.tTouch ? row(t)[1] : 0);
  F.vel = t => { const r = row(Math.min(t, B.tTouch - H)); return [r[4], r[1], r[5]]; };
  F.acc = t => (F.vy(t + 0.05) - F.vy(t - 0.05)) / 0.1;
  // inside air temperature (°C) the motion needs; outside air before the first burn
  const { Ta, rho } = AIR, { V, m, Cd, A } = BAL;
  F.tempRaw = t => {
    const v = F.vy(t), lift = m * (G + F.acc(t)) + 0.5 * rho * Cd * A * v * Math.abs(v);
    return Ta / (1 - lift / (rho * V * G)) - 273.15;
  };
  F.temp = t => {
    if (t < B.tBurn) return Ta - 273.15;
    if (t < B.tRelease) return Ta - 273.15 + (F.tempRaw(B.tRelease + 0.3) - (Ta - 273.15)) * smooth((t - B.tBurn) / (B.tRelease - B.tBurn));
    return F.tempRaw(t);
  };
  // Ben's sandwich: dropped over the side in shot 28, free fall (light drag ignored) onto the neighbour's face
  {
    const tDrop = at('28', 0.3), p = F.pos(tDrop), v = F.vel(tDrop), p0 = [p[0] + 0.5, p[1] + 1.15, p[2] + 0.55], yFace = 0.78;
    const tf = (v[1] + Math.sqrt(v[1] * v[1] + 2 * G * (p0[1] - yFace))) / G;
    F.sandwich = { tDrop, tLand: tDrop + tf, p0, v0: v, land: [p0[0] + v[0] * tf, yFace, p0[2] + v[2] * tf] };
  }
  // a roof tile knocked loose at the scrape slides down the upwind slope (frictionless glaze: a = g sin θ), leaves the eave
  // and falls into the pool; the pool is built where it lands
  {
    const th = Math.atan2(2.4, 3.35), L = Math.hypot(2.4, 3.35), a = G * Math.sin(th), v0 = 0.6;
    const tSlide = (-v0 + Math.sqrt(v0 * v0 + 2 * a * L)) / a, v = v0 + a * tSlide;
    const ve = [-v * Math.cos(th), -v * Math.sin(th)], y0 = 5.5 + 0.06, yw = 0.22;
    const tFall = (ve[1] + Math.sqrt(ve[1] * ve[1] + 2 * G * (y0 - yw))) / G;
    const r = F.pos(B.tScrape), z = r[2] + 3.2;
    F.tile = { t0: B.tScrape, tSlide, tFall, tLand: B.tScrape + tSlide + tFall, th, a, v0, z, ridge: r[0],
      land: [r[0] - 3.35 + ve[0] * tFall, yw, z], ve,
      pos: t => {
        const u = t - B.tScrape;
        if (u < 0) return { p: [r[0] - 0.15, ROOF_RIDGE + 0.05, z], rot: th };
        if (u < tSlide) { const sd = v0 * u + 0.5 * a * u * u; return { p: [r[0] - 0.15 - sd * Math.cos(th), ROOF_RIDGE + 0.05 - sd * Math.sin(th), z], rot: th }; }
        const w = Math.min(u - tSlide, tFall);
        return { p: [r[0] - 3.35 + ve[0] * w, y0 + ve[1] * w - 0.5 * G * w * w, z], rot: th + 6 * w };
      } };
  }
  F.burning = t => (t >= B.tBurn && t < B.tOff) || (t >= B.tOn && t < B.tOff2);
  F.venting = t => t >= B.tVent;
  return F;
}

// The thin plastic bag of the opening: held mouth-down over the fire, let go, rises at its terminal speed
// (≈1.5 m/s: 15 g of net lift against air drag), cools, and sinks back onto Ben's head. Drifts slowly in the light ground wind.
export const BAG = { mouth0: 1.25, onHead: 1.38, drift: 0.32 };
export function makeBag(T, fire) {
  const at = (id, k) => T.start(id) + k * T.dur(id);
  const tRel = at('02', 0.7), tLand = at('09', 0.35);
  // a light bag sinks slowly once cool (≈1.6 m/s, its terminal speed); the rise speed is solved so it lands on Ben's head
  const keys = [[tRel, 0], [tRel + 0.6, 'up'], [at('06', 0), 'up'], [at('07', 0.2), 0], [at('08', 0), -1.6], [tLand, -1.6]];
  const vals = { up: 1 };
  const y = (t, v = vals) => { let acc = BAG.mouth0; for (let u = tRel; u < Math.min(t, tLand); u += H) acc += vAt(keys, v, u + H / 2) * H; return acc; };
  const fa = y(tLand, { up: 0 }) - BAG.onHead, fb = y(tLand, { up: 1 }) - BAG.onHead;
  vals.up = -fa / (fb - fa);
  vals.sink = -1.6;
  const N = Math.ceil((tLand - tRel) / H) + 1, ys = new Float32Array(N);
  let acc = BAG.mouth0;
  for (let i = 0; i < N; i++) { ys[i] = acc; acc += vAt(keys, vals, tRel + (i + 0.5) * H) * H; }
  const x0 = fire[0] + 0.3, xAt = t => x0 + BAG.drift * clamp(t - tRel, 0, tLand - tRel);
  const land = [xAt(tLand), BAG.onHead, fire[2]];
  return {
    tRel, tLand, land, vals,
    pos: t => (t <= tRel ? [x0, BAG.mouth0, fire[2]] : t >= tLand ? land : [xAt(t), ys[clamp(Math.round((t - tRel) / H), 0, N - 1)], fire[2]]),
    vy: t => (t <= tRel || t >= tLand ? 0 : vAt(keys, vals, t)),
  };
}
