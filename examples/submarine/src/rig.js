// Shared staging helpers: world lookups, walking, holding props, eating, the bag's flight, quick camera moves.
import * as THREE from 'three';
import { deg, clamp, lerp, eio, eo } from '../lib/util.js';
import { shoot } from '../lib/stage.js';

export const world = (o, p = [0, 0, 0]) => { o.updateWorldMatrix(true, false); return new THREE.Vector3(...p).applyMatrix4(o.matrixWorld); };
export const local = (ch, p) => world(ch.root, p);
export const headPos = ch => world(ch.head, [0, 0.25, 0]);
export const arr = v => [v.x, v.y, v.z];
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const mix = (a, b, k) => a.map((x, i) => lerp(x, b[i], k));

// walk cycle on top of the current pose; ph advances by pi per step
export function walk(ch, ph, amp = 1) {
  const sw = Math.sin(ph);
  ch.legL.rotation.x += deg(28 * amp * sw); ch.legR.rotation.x -= deg(28 * amp * sw);
  ch.armL.rotation.x -= deg(20 * amp * sw); ch.armR.rotation.x += deg(20 * amp * sw);
  ch.hips.position.y += 0.035 * amp * Math.abs(Math.cos(ph));
  ch.spine.rotation.y += deg(4 * amp * sw);
}

// attach obj to a hand (arm-local offset)
export function hold(ch, obj, side = 'R', off = [0, -0.58, 0.04], rot = [0, 0, 0]) {
  (side === 'L' ? ch.armL : ch.armR).add(obj);
  obj.visible = true; obj.position.set(...off); obj.rotation.set(...rot);
  return obj;
}

// sandwich to the mouth and back every `per` seconds, with chewing
export function eat(ch, t, side = 'R', per = 1.1) {
  const ph = (t % per) / per, up = Math.sin(Math.min(1, ph * 2) * Math.PI);
  ch.arm(side, -40 - 95 * up, side === 'L' ? 20 + 20 * up : -20 - 20 * up, 35 * up);
  const chew = ph > 0.5 ? Math.abs(Math.sin(t * 18)) : 0;
  ch.face.set(null, up > 0.8 ? 'o' : chew > 0.5 ? 'flat' : 'closed');
}

// jumping on the spot: hop height h every period, knees bend on landing
export function hop(ch, t, t0, per = 0.5, h = 0.35, n = 2) {
  const u = t - t0;
  if (u < 0 || u > per * n) return 0;
  const k = (u % per) / per, y = 4 * h * k * (1 - k);
  ch.root.position.y += y;
  ch.legL.rotation.x += deg(-25 * (1 - Math.sin(k * Math.PI))); ch.legR.rotation.x += deg(-25 * (1 - Math.sin(k * Math.PI)));
  return y;
}

// camera from keyframed position/target over the shot (eased), with a little handheld energy
export function move(st, k, from, to, o = {}) {
  const e = (o.ease ?? eio)(clamp(k));
  shoot(st, mix(from[0], to[0], e), mix(from[1], to[1], e), lerp(from[2] ?? 24, to[2] ?? from[2] ?? 24, e), o);
}
export { eo };
