// Performance layer (port of blender_lib/acting.py), evaluated per frame from absolute time t (seconds).
// Stack it after ch.reset() and the shot's pose: idle -> gestures -> face (eyes with blinks, mouth from voice).
import { deg, noise1, hash, clamp, ss } from './util.js';

const BLINKABLE = new Set(['open', 'wide', 'raised', 'sad', 'look_l', 'look_r', 'angry', 'lazy']);
const TALK = ['closed', 'talk1', 'talk2', 'talk3'];
const SHOUT = ['talk2', 'talk3', 'scream'];

// voice data shared by every shot: { lines: [{id, who, start, dur}], env: {id: [per-frame 0..1 at 30 fps]} }
export const VOICE = { lines: [], env: {} };

// one blink every ~1.5-3.5 s, 0.1 s long, deterministic per character
export function blinking(t, seed) {
  const P = 2.6, c = Math.floor(t / P), at = c * P + 0.3 + hash(c * 7.31 + seed) * 1.9;
  return t >= at && t < at + 0.1;
}

// breathing, neck sway, blinks. amp scales the sway (0 for a still beat)
export function idle(ch, t, o = {}) {
  const s = ch.seed, a = o.amp ?? 1;
  ch.spine.scale.y = 1 + 0.018 * Math.sin((t + s) * Math.PI * 2 / 2.4);
  ch.neck.rotation.x += deg(4 * a * noise1(t * 1.1, s));
  ch.neck.rotation.y += deg(6 * a * noise1(t * 0.9, s + 3));
  ch.neck.rotation.z += deg(5 * a * noise1(t * 1.0, s + 7));
  ch.hips.position.x += 0.012 * a * noise1(t * 0.5, s + 11);
}

export function eyes(ch, t, state = 'open', blink = true) {
  ch.face.set(blink && BLINKABLE.has(state) && blinking(t, ch.seed) ? 'blink' : state);
}

// the line `who` is speaking at t, if any, and its loudness 0..1
export function voiceAt(who, t) {
  for (const l of VOICE.lines) {
    if (l.who !== who || t < l.start || t > l.start + l.dur + 0.05) continue;
    const e = VOICE.env[l.id] || [], i = Math.floor((t - l.start) * 30);
    return { line: l, v: clamp(e[i] ?? 0), prev: clamp(e[i - 3] ?? 0) };
  }
  return null;
}

// lip sync from the voice envelope; small head accents on loud syllables. Returns loudness (0 when silent)
export function talk(ch, t, who = ch.who, o = {}) {
  const r = voiceAt(who, t);
  if (!r) { if (o.rest) ch.face.set(null, o.rest); return 0; }
  const v = clamp(r.v * (o.wide ?? 1.1));
  if (o.shout) ch.face.set(null, SHOUT[Math.min(2, Math.floor(v * 3))]);
  else ch.face.set(null, TALK[Math.min(3, Math.floor(v * 4 + 0.15))]);
  if (o.nod !== false) {
    ch.head.rotation.x += deg(-6 * Math.max(0, v - r.prev));
    ch.head.rotation.z += deg(2.5 * noise1(t * 3, ch.seed + 5) * v);
  }
  return v;
}

// procedural mouth flapping for screams and chatter without a line
export function jabber(ch, t, o = {}) {
  const rate = o.rate ?? 7, k = (o.intensity ?? 1) * (0.45 + 0.55 * Math.abs(Math.sin(t * rate + noise1(t * 4, ch.seed) * 0.6)));
  ch.face.set(null, o.scream === false ? TALK[Math.min(3, Math.floor(k * 4))] : SHOUT[Math.min(2, Math.floor(k * 3))]);
}

// arms (and optionally legs) thrash around a base pose
export function flail(ch, t, o = {}) {
  const amp = o.amp ?? 40, per = o.period ?? 0.3, ph = hash(ch.seed) * 6, w = t / per * Math.PI * 2 + ph;
  ch.armL.rotation.x += deg(amp * 0.5 * Math.sin(w * 1.3)); ch.armL.rotation.z += deg(amp * Math.sin(w));
  ch.armR.rotation.x += deg(amp * 0.5 * Math.cos(w * 1.1)); ch.armR.rotation.z -= deg(amp * Math.sin(w + 1.7));
  if (o.legs) { ch.legL.rotation.x += deg(o.legs * Math.sin(w * 1.4)); ch.legR.rotation.x -= deg(o.legs * Math.sin(w * 1.4)); }
  if (o.head !== false) ch.head.rotation.z += deg(10 * Math.sin(w * 0.7));
}

export function nod(ch, t, t0, o = {}) {
  const per = o.period ?? 0.27, times = o.times ?? 2, u = (t - t0) / per;
  if (u < 0 || u > times) return;
  ch.head.rotation.x += deg((o.amp ?? 10) * Math.sin(u * Math.PI) ** 2);
}

export function shake(ch, t, t0, t1, o = {}) {
  if (t < t0 || t > t1) return;
  const fade = Math.min(1, (t1 - t) / 0.15, (t - t0) / 0.1);
  ch.head.rotation.y += deg((o.amp ?? 14) * fade * Math.sin((t - t0) / (o.period ?? 0.2) * Math.PI * 2));
}

// eased head turn: yaw/pitch in degrees reached over dur from t0
export function look(ch, t, t0, yaw = 0, pitch = 0, dur = 0.2) {
  const k = ss((t - t0) / dur);
  ch.head.rotation.y += deg(yaw * k); ch.head.rotation.x += deg(pitch * k);
}

export function tremble(ch, t, amp = 1) {
  ch.armL.rotation.x += deg(3 * amp * Math.sin(t * 61)); ch.armR.rotation.x += deg(3 * amp * Math.sin(t * 57 + 1));
  ch.spine.rotation.z += deg(1.2 * amp * Math.sin(t * 47));
}

export function bounce(ch, t, o = {}) {
  ch.hips.position.y += Math.abs(Math.sin(t / (o.period ?? 0.33) * Math.PI)) * (o.height ?? 0.06);
}

// arm pump (fist shake, sipping) on one side
export function pump(ch, t, side = 'R', o = {}) {
  (side === 'L' ? ch.armL : ch.armR).rotation.x += deg((o.amp ?? 35) * Math.sin(t / (o.period ?? 0.27) * Math.PI * 2));
}
