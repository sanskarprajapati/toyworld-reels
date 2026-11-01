// Staging the balloon in flight with Ben aboard: rig placement from the flight, burner flame, Ben's acting in the basket.
import * as THREE from 'three';
import { deg, clamp, lerp, ss, noise1 } from '../lib/util.js';
import { idle, eyes } from '../lib/acting.js';
import { RIG, ENV, flyRig, burn, poseEnvelope, cables } from './balloon.js';
import { world } from './rig.js';

// the whole balloon at time t: gentle sway (the basket swings under the envelope as a pendulum, driven by speed changes)
export function balloonAt(S, F, t, o = {}) {
  const p = F.pos(t), a = F.acc(t);
  const sway = deg(2.2) * Math.sin(t * 2.2) * (o.sway ?? 1) - a * deg(1.5);
  flyRig(S.bal, p, { t, tiltX: deg(1.2) * Math.sin(t * 1.7), tiltZ: sway, yaw: o.yaw ?? 0, ripple: o.ripple ?? 0.15 });
  burn(S.bal, t, o.burn ?? (F.burning(t) ? 1 : 0));
  return p;
}

// Ben standing in the basket (rig-local), facing +z by default; returns Ben
export function benAboard(S, t, o = {}) {
  const b = S.ben; b.root.visible = true;
  S.bal.R.add(b.root);
  b.root.position.set(o.x ?? 0.05, 0.06, o.z ?? -0.1); b.root.rotation.set(0, o.rotY ?? 0, 0);
  idle(b, t, { amp: o.amp ?? 1 });
  return b;
}

// Ben's hand on the burner valve (overhead, right hand)
export function onValve(b, k = 1) { b.arm('R', lerp(-20, -165, k), lerp(-12, -8, k), 15 * k); }

// world point of the basket centre at rim height
export const rimCentre = S => world(S.bal.R, [0, RIG.rim, 0]);
export const crown = S => world(S.bal.E, [0, ENV.top, 0]);
export const envCentre = S => world(S.bal.E, [0, ENV.hc, 0]);

// lying on the lawn along +x, basket tipped on its side with the burner pointing at the mouth.
// stand: 0 lying .. 1 upright (the hot air lifts the envelope; the basket swings up last)
export function launchPose(S, t, fill, stand, o = {}) {
  const B = S.bal; B.R.visible = true; B.E.visible = true;
  const e = ss(stand), eb = ss((stand - 0.55) / 0.45);
  B.R.position.set(0, lerp(RIG.w / 2, 0, eb), 0); B.R.rotation.set(0, 0, lerp(-Math.PI / 2, 0, eb));
  B.R.updateMatrixWorld(true);
  const fr = poseEnvelope(B, { fill, lay: 1 - e, t, ripple: o.ripple ?? 0, flat: o.flat ?? 0 });
  const axisH = ENV.R * fr * (1 - (o.flat ?? 0));
  const lying = new THREE.Vector3(RIG.mouth + 0.3, Math.max(axisH, 0.1), 0);
  const upright = new THREE.Vector3(0, RIG.mouth, 0).applyMatrix4(B.R.matrixWorld);
  B.E.position.copy(lying.lerp(upright, e));
  B.E.updateMatrixWorld(true);
  cables(B);
  return axisH;
}
