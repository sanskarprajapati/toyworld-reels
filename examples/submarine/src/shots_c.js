// Shots 25-35: periscope up, the neighbour dozing in his rowboat, the hook snags the sub, the tow, deeper, pressure,
// the catfish.
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, nod, look, jabber } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { LAKE } from './set.js';
import { SUB } from './sub.js';
import { underwater, fishSchool } from './props.js';
import { subAt, vents } from './shots_b.js';
import { hold, headPos, world, arr, move } from './rig.js';
import * as THREE from 'three';

const W = LAKE.water;
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

// the rowboat from the physics (towed, flipped), the neighbour in it with his rod; bend 0..1
export function boatAt(S, P, t, o = {}) {
  const xz = P.boatXZ(t), f = P.boatFlip(t), yaw = P.boatYaw(t), B = S.boat;
  B.visible = true; B.rotation.order = 'YXZ';
  B.position.set(xz[0] + f.off, W + 0.28 + f.dy, xz[1]); B.rotation.set(0.04 * Math.sin(t * 1.9), yaw, f.roll);
  B.updateMatrixWorld(true);
  if (o.neigh !== false) {
    const n = S.neigh; n.root.visible = true; B.add(n.root); n.root.position.set(0, -0.6, -0.45); n.root.rotation.set(0, 0, 0);
    n.setPose('sit'); n.arm('L', -70, 12); n.arm('R', -70, -12); idle(n, t, { amp: 0.5 });
    // rod in both hands, tip out over the water; it bends towards the line's pull
    const R = S.rod; R.visible = true; B.add(R);
    R.position.set(0, 0.35, 0.05); R.rotation.set(deg(55 + 30 * (o.bend ?? 0)), 0, 0);
  }
  return B;
}
export const rodTip = S => world(S.rod, [0, 2.4, 0]);
const towerTop = S => world(S.sub, [0, 1.38, -0.2]);

export function shotsC(S, P, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => P.T.start(id) + k * P.T.dur(id);
  const uw = (t, o = {}) => underwater(S, t, st.camera, o);
  // the fishing line: hook hanging 2 m under the rod tip, drifting down to the sub's tower, snagged until the breach
  const line = (t, o = {}) => {
    const tSnag = at('28', 0.65), tip = rodTip(S), tt = towerTop(S);
    let end = [tip.x + 0.3, W - 2 - 1.2 * ss((t - at('28', 0)) / (tSnag - at('28', 0))), tip.z];
    if (t > at('28', 0)) end = arr(new THREE.Vector3(...end).lerp(tt, ss((t - at('28', 0.2)) / (tSnag - at('28', 0.2)))));
    if (t >= tSnag) end = arr(tt);
    const taut = t > P.S.tTow;
    setRope(S.line, taut ? [arr(tip), end] : [arr(tip), [(tip.x + end[0]) / 2 + 0.2, W - 0.2, (tip.z + end[2]) / 2], end]);
    return end;
  };

  return [
    { id: '25', dur: 1.2, frame: ({ u, d, t }) => {
      // periscope up: the head breaks the surface
      const k = ss(u / (d * 0.8)), p = subAt(S, P, t, { peri: k });
      boatAt(S, P, t); line(t);
      const head = world(S.sub.userData.peri, [0, 0.25, 0]);
      S.waterAlpha = 0.5;
      shoot(st, [head.x + 2.2, W + 0.35, head.z + 2.6], [head.x, W - 0.6, head.z], 22, { t, aper: 1 });
      aimSun(sun, [head.x, 0, head.z], 14);
    } },

    { id: '26', dur: 1.0, frame: ({ u, d, t }) => {
      // through the periscope (round mask in post): the neighbour, dozing in his boat
      subAt(S, P, t, { peri: 1 });
      const B = boatAt(S, P, t), n = S.neigh; eyes(n, t, 'shut', false); n.face.set(null, 'o'); n.head.rotation.x += deg(-20 + 4 * Math.sin(t * 2));
      line(t);
      const head = world(S.sub.userData.peri, [0, 0.25, 0.2]), bp = B.position;
      shoot(st, [head.x, head.y + 0.05, head.z], [bp.x + 0.2 * Math.sin(t * 2), bp.y + 0.5, bp.z], 30, { t, aper: 0.4 });
      aimSun(sun, bp, 12);
    } },

    { id: '27', dur: 1.2, frame: ({ u, d, t }) => {
      subAt(S, P, t, { peri: 1 });
      const B = boatAt(S, P, t), n = S.neigh; eyes(n, t, 'shut', false); n.face.set(null, 'o'); n.head.rotation.x += deg(-20);
      line(t);
      const bp = B.position;
      move(st, u / d, [[bp.x + 7, 2.0, bp.z + 6], [bp.x, 0.2, bp.z], 22], [[bp.x + 6, 1.6, bp.z + 5], [bp.x, 0.3, bp.z], 22], { t, shake: 0.008, aper: 0.6 });
      aimSun(sun, bp, 16);
    } },

    { id: '28', dur: 1.2, frame: ({ u, d, t }) => {
      // underwater: the hook drifts down and snags the tower rail
      const p = subAt(S, P, t, { peri: 1 - ss((t - at('28', 0.7)) / 0.3) });
      boatAt(S, P, t, { neigh: true }); const end = line(t);
      uw(t, { centre: p, fish: [p[0] + 2, p[1] + 1.5, p[2] + 1], away: [] });
      shoot(st, [end[0] + 2.2, end[1] - 0.3, end[2] + 2.6], [end[0], end[1] - 0.2, end[2]], 26, { t, aper: 1.5 });
      aimSun(sun, end, 10);
    } },

    { id: '29', dur: 0.9, frame: ({ u, d, t }) => {
      // the rod bends double; he wakes up: "Big one!"
      subAt(S, P, t);
      boatAt(S, P, t, { bend: ss(u / 0.3) }); line(t);
      const n = S.neigh; n.arm('L', -100, 12); n.arm('R', -100, -12); n.spine.rotation.x += deg(-15);
      eyes(n, t, 'wide', false); talk(n, t, 'neighbour', { shout: true, rest: 'o' });
      const hp = headPos(n);
      const fw = world(n.head, [0, 0.25, 1]).sub(hp);
      shoot(st, [hp.x + fw.x * 2.2 + 0.6, hp.y + 0.35, hp.z + fw.z * 2.2], [hp.x, hp.y - 0.3, hp.z], 28, { t, shake: 0.02, aper: 2.5, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '30', dur: 1.3, frame: ({ u, d, t }) => {
      // the sub tows the boat across the lake
      subAt(S, P, t);
      const B = boatAt(S, P, t, { bend: 1 }); line(t);
      const n = S.neigh; n.arm('L', -110, 12); n.arm('R', -110, -12); n.spine.rotation.x += deg(-25); eyes(n, t, 'happy', false); n.face.set(null, 'grin');
      FX.foam.update(t, Math.floor(t / 0.5) * 0.5, [B.position.x, W, B.position.z]);
      const bp = B.position;
      shoot(st, [bp.x - 5, 2.4, bp.z + 7], [bp.x, 0.3, bp.z - 1], 20, { t, shake: 0.01, aper: 0.5 });
      aimSun(sun, bp, 18);
    } },

    { id: '31', dur: 1.0, frame: ({ u, d, t }) => {
      subAt(S, P, t);
      boatAt(S, P, t, { bend: 1 }); line(t);
      const n = S.neigh; n.arm('L', -110, 12); n.arm('R', -110, -12); n.spine.rotation.x += deg(-25);
      eyes(n, t, 'happy', false); talk(n, t, 'neighbour', { rest: 'grin' });
      const hp = headPos(n);
      const fw = world(n.head, [0, 0.25, 1]).sub(hp);
      shoot(st, [hp.x + fw.x * 1.8 - 0.5, hp.y + 0.2, hp.z + fw.z * 1.8], [hp.x, hp.y - 0.15, hp.z], 30, { t, shake: 0.015, aper: 3, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '32', dur: 1.2, frame: ({ u, d, t }) => {
      // deeper: the line goes taut down through the water
      const p = subAt(S, P, t);
      boatAt(S, P, t, { bend: 1 }); line(t);
      uw(t, { centre: p, fish: [p[0] - 3, p[1] + 1, p[2] - 2], away: [p] });
      shoot(st, [p[0] + 6, p[1] - 0.5, p[2] + 5], [p[0], p[1] + 0.8, p[2]], 20, { t, aper: 0.5 });
      aimSun(sun, p, 16);
    } },

    { id: '33', dur: 1.4, frame: ({ u, d, t }) => {
      // pressure: one more atmosphere for every 10 m; arrows squeeze in on the hull from all round
      const p = subAt(S, P, t);
      const depth = W - p[1], g = back(clamp(u / 0.4), 1.6);
      S.squeeze.visible = true;
      for (let i = 0; i < 14; i++) {
        const a = (i % 7) / 7 * Math.PI * 2, z = i < 7 ? 0.7 : -0.7, r = 1.9 + 0.12 * Math.sin(t * 6 + i);
        const loc = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z), wp = loc.clone().applyMatrix4(S.sub.matrixWorld);
        const dir = new THREE.Vector3(-Math.cos(a), -Math.sin(a), 0).transformDirection(S.sub.matrixWorld);
        Q.setFromUnitVectors(UP, dir); M4.compose(wp, Q, S1.setScalar(g * (0.5 + depth / 12))); S.squeeze.setMatrixAt(i, M4);
      }
      S.squeeze.instanceMatrix.needsUpdate = true;
      uw(t, { centre: p });
      shoot(st, arr(world(S.sub, [5.2, 0.6, 0.4])), [p[0], p[1] + 0.2, p[2]], 24, { t, aper: 0.8 });
      aimSun(sun, p, 10);
    } },

    { id: '34', dur: 0.9, frame: ({ u, d, t }) => {
      const p = subAt(S, P, t), b = S.ben; tremble(b, t, 1); eyes(b, t, 'wide', false); b.face.set(null, 'frown');
      FX.drips.update(t, at('34', 0.1), arr(headPos(b)));
      const hp = headPos(b), fw = world(S.sub, [0, 0, 6]);
      uw(t, { centre: p });
      const creak = 0.02 * Math.sin(t * 40) * (u > 0.4 ? 1 : 0);
      shoot(st, [hp.x + (fw.x - p[0]) * 0.3 + creak, hp.y + 0.1, hp.z + (fw.z - p[2]) * 0.3], [hp.x, hp.y - 0.05, hp.z], 30, { t, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },

    { id: '35', dur: 1.0, frame: ({ u, d, t }) => {
      // a giant catfish eye fills the window
      const p = subAt(S, P, t), b = S.ben; eyes(b, t, 'wide', false); b.face.set(null, 'scream'); b.setPose('arms_up'); flail(b, t, { amp: 15 });
      const C = S.catfish; C.visible = true;
      const k = ss(u / 0.5), dome = world(S.sub, [0, 0.1, SUB.body / 2 + 0.9]), out = world(S.sub, [0, 0.1, SUB.body / 2 + 6.2 - 1.2 * k]);
      C.position.copy(out); C.rotation.set(0, P.subYaw(t) + Math.PI, 0); C.scale.setScalar(1.1);
      uw(t, { centre: p });
      const cam = world(S.sub, [0.15, 0.2, SUB.body / 2 - 0.4]);
      shoot(st, arr(cam), arr(world(S.sub, [0, 0.4, SUB.body / 2 + 3.5])), 24, { t, shake: 0.02, aper: 1.5 });
      aimSun(sun, p, 8);
    } },
  ];
}
