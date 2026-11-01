// Shots 37-48: drifting with the high wind towards grandma's, the vent, the fast drop, touchdown and drag, the envelope
// collapsing over the washing line, grandma's verdict, and the plastic bag's return.
import * as THREE from 'three';
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, look, nod } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { RIG, ENV, poseEnvelope, cables, burn, poseBag } from './balloon.js';
import { cloud, poseGull } from './props.js';
import { hold, headPos, world, arr, move, mix } from './rig.js';
import { balloonAt, benAboard, rimCentre, crown, envCentre } from './crew.js';

export function shotsD(S, F, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => F.T.start(id) + k * F.T.dur(id);
  const ventK = t => ss((t - F.B.tVent) / 0.5);
  const yawOf = d => Math.atan2(-d[1], d[0]);

  // the vent: the cap is pulled down inside the crown, hot air shimmers out; Ben hangs on the red rope
  const vent = (t, k) => {
    const v = S.bal.vent; v.position.y = ENV.hc - 3.2 * k; v.scale.set(1 - 0.62 * k, 1, 1 - 0.62 * k);   // pulled down inside and bunched up
    if (k > 0.05) FX.heat.update(t, F.B.tVent, arr(crown(S)));
  };
  const ventRope = b => {
    const h = world(b.armR, [0, -0.55, 0]), m = world(S.bal.E, [0, 0.4, 0]);
    setRope(S.bal.ventRope, [arr(h), arr(m)]);
  };
  const benOnRope = (t, o = {}) => {
    const b = benAboard(S, t, o); b.setPose('stand'); b.arm('R', -170, -5); b.arm('L', -165, 10);
    ventRope(b); return b;
  };

  // after touchdown: the basket tips over downwind and is dragged; the envelope lies down and collapses
  const landPose = t => {
    const B = S.bal, u = t - F.B.tTouch, yaw = yawOf(F.dir), p = F.pos(t);
    const tip = ss((u - 0.12) / 0.45);
    B.R.visible = B.E.visible = true;
    B.R.position.set(p[0], p[1] + RIG.w / 2 * tip, p[2]); B.R.rotation.set(0, yaw, -Math.PI / 2 * tip);
    B.R.rotation.order = 'YXZ';
    B.R.updateMatrixWorld(true);
    const lay = ss((u - 0.05) / 1.3), fill = 1 - 0.7 * ss((u - 0.7) / 1.6), flat = 0.55 * ss((u - 0.9) / 1.5);
    const fr = poseEnvelope(B, { fill, lay, t, ripple: 0.4 * lay * (1 - flat), flat, yaw });
    const up = new THREE.Vector3(0, RIG.mouth, 0).applyMatrix4(B.R.matrixWorld);
    const axisH = Math.max(0.12, ENV.R * fr * (1 - flat));
    const lying = new THREE.Vector3(p[0] + F.dir[0] * (RIG.mouth + 0.4), axisH, p[2] + F.dir[1] * (RIG.mouth + 0.4));
    B.E.position.copy(up.lerp(lying, lay)); B.E.updateMatrixWorld(true);
    cables(B);
    return { u, p, tip };
  };
  const gran = t => {
    const g = S.granCh; g.root.visible = true; g.set(S.gran.pos, Math.atan2(-F.dir[0], -F.dir[1]));
    idle(g, t); return g;
  };
  const toward = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2]);

  return [
    { id: '37', dur: 1.2, frame: ({ u, d, t }) => {
      // up in the clouds, a gull lands on the crown (the balloon moves with the air: its flags hang limp)
      const p = balloonAt(S, F, t);
      const b = benAboard(S, t, { rotY: deg(-40) }); b.setPose('hip'); eyes(b, t, 'happy', false); b.face.set(null, 'smile'); b.head.rotation.x += deg(-30);
      const cr = crown(S), k = ss(clamp(u / (d * 0.75)));
      poseGull(S, [cr.x - 7 * (1 - k), cr.y + 0.18 + 3 * (1 - k) ** 2, cr.z + 4 * (1 - k)], deg(120), 1 - k * 0.9, t);
      [[-14, 6, -8, 1.3], [12, 4, -14, 1.1], [16, 10, 6, 1.4], [-20, 14, -20, 1.6], [4, 16, -26, 1.8]]
        .forEach(([x, y, z, s], i) => cloud(S, i, [p[0] + x, p[1] + 8 + y, p[2] + z], s, st.camera));
      move(st, u / d, [[p[0] - 16, p[1] + 12, p[2] + 20], [p[0], p[1] + 9, p[2]], 22], [[p[0] - 12, p[1] + 13, p[2] + 15], [p[0], p[1] + 11, p[2]], 22], { t, aper: 0.2 });
      S.clouds.forEach(c => c.visible && c.quaternion.copy(st.camera.quaternion));
      aimSun(sun, [p[0], p[1] + 6, p[2]], 40);
    } },

    { id: '38', dur: 0.9, frame: ({ u, d, t }) => {
      const p = balloonAt(S, F, t);
      const g = gran(t); g.setPose('stand'); g.arm('R', -125, -70); g.arm('L', -10, 15); eyes(g, t, 'raised'); g.face.set(null, 'o');
      g.head.rotation.x += deg(-18);
      const hp = headPos(g);
      shoot(st, [hp.x - F.dir[0] * 2.4 + F.dir[1] * 0.9, 1.0, hp.z - F.dir[1] * 2.4 - F.dir[0] * 0.9], [hp.x, hp.y + 0.3, hp.z], 24, { t, shake: 0.01, aper: 1.5, focus: arr(hp) });
      aimSun(sun, hp, 10);
    } },

    { id: '39', dur: 1.3, frame: ({ u, d, t }) => {
      // Ben pulls the red rope: the vent opens at the crown, hot air escapes, the gull bolts
      const p = balloonAt(S, F, t);
      const k = ventK(t); vent(t, k);
      const b = benOnRope(t); b.armR.rotation.x += deg(25 * k); eyes(b, t, k > 0.2 ? 'wide' : 'open', false); b.face.set(null, k > 0.2 ? 'o' : 'flat');
      const cr = crown(S), fly = Math.max(0, t - F.B.tVent - 0.15);
      poseGull(S, [cr.x + 2.5 * fly, cr.y + 0.18 + 3 * fly, cr.z - 1.5 * fly], deg(120), fly > 0 ? 1 : 0, t);
      move(st, u / d, [[cr.x + 6, cr.y + 4.5, cr.z + 9], [cr.x, cr.y - 1, cr.z], 24], [[cr.x + 5, cr.y + 3.5, cr.z + 8], [cr.x, cr.y - 0.5, cr.z], 24], { t, shake: 0.01, aper: 0.6 });
      aimSun(sun, cr, 24);
    } },

    { id: '40', dur: 1.0, frame: ({ u, d, t }) => {
      // inside, looking up: a disc of sky opens at the top
      balloonAt(S, F, t); vent(t, ventK(t));
      const m = S.bal.env.material; m.emissiveMap = S.bal.goreTex; m.emissive.set('#ffffff'); m.emissiveIntensity = 0.75; m.needsUpdate = true;
      const mo = world(S.bal.E, [0.6, 1.0, 0.3]), cr = crown(S);
      shoot(st, arr(mo), [cr.x, cr.y, cr.z], 13, { t, roll: deg(20) * u });
      aimSun(sun, cr, 24);
    } },

    { id: '41', dur: 1.4, frame: ({ u, d, t }) => {
      // dropping fast towards grandma's garden
      const p = balloonAt(S, F, t); vent(t, 1);
      const b = benOnRope(t); eyes(b, t, 'wide', false); b.face.set(null, 'scream');
      const g = gran(t); g.setPose('stand'); g.arm('R', -150, -40, 40); eyes(g, t, 'wide', false); g.face.set(null, 'o'); g.head.rotation.x += deg(-35);
      const sp = F.stop;
      shoot(st, [sp[0] - F.dir[0] * 4 + 9, 1.4, sp[1] - F.dir[1] * 4 + 11], [sp[0] - F.dir[0] * 6, lerp(10, 6, u / d), sp[1] - F.dir[1] * 6], 20, { t, shake: 0.012, aper: 0.4 });
      aimSun(sun, [sp[0], 3, sp[1]], 34);
    } },

    { id: '42', dur: 0.9, frame: ({ u, d, t }) => {
      balloonAt(S, F, t); vent(t, 1);
      const b = benOnRope(t, { rotY: deg(15) }); tremble(b, t, 1); eyes(b, t, 'wide', false); talk(b, t, 'ben', { shout: true, rest: 'scream' });
      b.hips.position.y += 0.15;     // hauling himself up on the rope
      const hp = headPos(b);
      shoot(st, [hp.x + 0.6, hp.y + 0.25, hp.z + 1.8], [hp.x, hp.y + 0.1, hp.z], 28, { t, shake: 0.035, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '43', dur: 1.3, frame: ({ u, d, t }) => {
      // touchdown at ~6 m/s: bounce, the basket tips over downwind and the envelope drags it across the lawn
      const before = t < F.B.tTouch;
      if (before) { balloonAt(S, F, t); vent(t, 1); } else landPose(t);
      const b = benAboard(S, t, { rotY: 0 }); b.setPose(before ? 'arms_up' : 'stand'); if (!before) flail(b, t, { amp: 30, legs: 25 });
      eyes(b, t, 'wide', false); b.face.set(null, 'scream');
      const p = F.pos(t);
      FX.bigdust.update(t, F.B.tTouch, [p[0], 0.05, p[2]]);
      FX.turf.update(t, F.B.tTouch + 0.1, [p[0], 0.05, p[2]]);
      const g = gran(t); g.setPose('stand'); g.arm('R', -90, -30); g.arm('L', -90, 30); eyes(g, t, 'wide', false); g.face.set(null, 'o');
      const L = F.landing, kick = before ? 0 : 0.25 * Math.exp(-(t - F.B.tTouch) * 7) * Math.sin((t - F.B.tTouch) * 45);
      shoot(st, [L[0] - F.dir[0] * 2 + F.dir[1] * 13, 1.0 + kick, L[1] - F.dir[1] * 2 - F.dir[0] * 13], [L[0] + F.dir[0] * 5, 3.5, L[1] + F.dir[1] * 5], 20, { t, aper: 0.4 });
      aimSun(sun, [L[0], 2, L[1]], 34);
    } },

    { id: '44', dur: 0.9, frame: ({ u, d, t }) => {
      // Ben, sideways in the tipped basket, face along the grass
      landPose(t);
      const b = benAboard(S, t, { rotY: 0 }); b.setPose('arms_up'); eyes(b, t, 'shut', false); b.face.set(null, 'flat');
      FX.turf.update(t, F.B.tTouch + 0.1, arr(rimCentre(S)));
      const hp = headPos(b), fw = world(b.head, [0, 0.25, 1]).sub(hp);
      shoot(st, [hp.x + fw.x * 1.3 + F.dir[0] * 0.9, Math.max(0.3, hp.y + 0.1), hp.z + fw.z * 1.3 + F.dir[1] * 0.9], [hp.x, hp.y, hp.z], 26, { t, shake: 0.03, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '45', dur: 1.3, frame: ({ u, d, t }) => {
      // the envelope settles over grandma's washing line; the basket stops at her feet
      landPose(t);
      const b = benAboard(S, t); b.setPose('slump'); eyes(b, t, 'dizzy', false); b.face.set(null, 'flat');
      const g = gran(t); g.setPose('hip'); eyes(g, t, 'raised'); g.face.set(null, 'flat'); g.head.rotation.x += deg(15);
      const sp = F.stop, mid = [sp[0] + F.dir[0] * 6, sp[1] + F.dir[1] * 6];
      move(st, u / d, [[mid[0] - F.dir[1] * 11 - F.dir[0] * 5, 3.5, mid[1] + F.dir[0] * 11 - F.dir[1] * 5], [mid[0] - F.dir[0] * 2, 1.0, mid[1] - F.dir[1] * 2], 22], [[mid[0] - F.dir[1] * 12 - F.dir[0] * 6, 4.5, mid[1] + F.dir[0] * 12 - F.dir[1] * 6], [mid[0] - F.dir[0] * 2, 1.2, mid[1] - F.dir[1] * 2], 22], { t, aper: 0.3 });
      aimSun(sun, [mid[0], 1, mid[1]], 36);
    } },

    { id: '46', dur: 1.4, frame: ({ u, d, t, T }) => {
      // "Congratulations, you've built a hot-air balloon!": Ben crawls out of the tipped basket, confetti
      landPose(t);
      const sp = F.stop, k = ss(u / d), b = S.ben; b.root.visible = true;
      const out = [sp[0] - F.dir[1] * (0.9 + 0.6 * k), 0, sp[1] + F.dir[0] * (0.9 + 0.6 * k)];
      b.set(out, toward(sp, [sp[0] - F.dir[1] * 3, 0, sp[1] + F.dir[0] * 3]));
      b.setPose('arms_up'); b.hips.position.y = 0.32; b.spine.rotation.x = deg(70); b.legL.rotation.x = b.legR.rotation.x = deg(-80);
      b.armL.rotation.x += deg(-25 * Math.sin(t * 8)); b.armR.rotation.x += deg(25 * Math.sin(t * 8));
      idle(b, t); eyes(b, t, 'dizzy', false); b.face.set(null, 'grin');
      const g = gran(t); g.setPose('hip'); eyes(g, t, 'raised'); g.face.set(null, 'flat');
      FX.confetti.update(t, at('46', 0.1), [sp[0] + F.dir[0] * 4, 2.5, sp[1] + F.dir[1] * 4]);
      const mid = [sp[0] + F.dir[0] * 2, sp[1] + F.dir[1] * 2];
      move(st, u / d, [[mid[0] - F.dir[1] * 6 - F.dir[0] * 4, 1.0, mid[1] + F.dir[0] * 6 - F.dir[1] * 4], [mid[0], 1.1, mid[1]], 22],
        [[mid[0] - F.dir[1] * 8 - F.dir[0] * 5, 2.2, mid[1] + F.dir[0] * 8 - F.dir[1] * 5], [mid[0], 1.5, mid[1]], 22], { t, aper: 0.4, ease: eo });
      aimSun(sun, [mid[0], 1, mid[1]], 30);
    } },

    { id: '47', dur: 1.4, frame: ({ u, d, t }) => {
      // grandma: "There's a bus, dear."
      landPose(t);
      const sp = F.stop, b = S.ben; b.root.visible = true;
      const gp = S.gran.pos, bp = [gp[0] - F.dir[1] * 1.3, 0, gp[2] + F.dir[0] * 1.3];
      b.set(bp, toward(bp, gp)); b.setPose('stand'); idle(b, t); eyes(b, t, 'lazy'); b.face.set(null, 'flat');
      const g = gran(t); g.root.rotation.y = toward(S.gran.pos, bp); g.setPose('point'); g.arm('R', -80, -20, -30);
      eyes(g, t, 'raised'); talk(g, t, 'grandma', { rest: 'smile' }); nod(g, t, at('47', 0.6));
      const hp = headPos(g), bh = headPos(b);
      const back = [bh.x + (bh.x - hp.x) * 0.6 + F.dir[0] * 1.1, bh.y + 0.2, bh.z + (bh.z - hp.z) * 0.6 + F.dir[1] * 1.1];
      shoot(st, back, [(hp.x * 2 + bh.x) / 3, hp.y - 0.2, (hp.z * 2 + bh.z) / 3], 26, { t, shake: 0.008, aper: 2.5, focus: arr(hp) });
      aimSun(sun, hp, 10);
    } },

    { id: '48', dur: 1.0, frame: ({ u, d, t }) => {
      // Ben's deadpan; the plastic bag from the start drifts down onto his head again
      landPose(t);
      const sp = F.stop, b = S.ben; b.root.visible = true;
      const gp = S.gran.pos, bp = [gp[0] - F.dir[1] * 1.3, 0, gp[2] + F.dir[0] * 1.3];
      b.set(bp, toward(bp, gp) + deg(150)); b.setPose('stand'); idle(b, t, { amp: 0.2 });
      const hp = headPos(b), k = clamp(u / (d * 0.7));
      eyes(b, t, k > 0.95 ? 'shut' : 'lazy', false); b.face.set(null, 'flat');
      const bag = S.bag; poseBag(bag, lerp(1, 0.8, ss((k - 0.9) / 0.1)), t); bag.scale.setScalar(1.45);
      bag.position.set(hp.x + 0.3 * (1 - k), hp.y - 0.54 + 2.2 * (1 - k), hp.z); bag.rotation.set(0, t * 0.4, deg(12 * (1 - k)));
      const f = [Math.sin(b.root.rotation.y), Math.cos(b.root.rotation.y)];
      shoot(st, [hp.x + f[0] * 2.0 + 0.3, hp.y + 0.1, hp.z + f[1] * 2.0], [hp.x, hp.y + 0.35, hp.z], 30, { t, aper: 3, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },
  ];
}
