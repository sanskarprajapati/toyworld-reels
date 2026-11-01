// Shots 36-45: blowing the ballast, the rise, the breach under the rowboat, the neighbour in the lake, to grandma's jetty,
// the hero and grandma's verdict.
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, nod, look } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { LAKE, GJETTY } from './set.js';
import { SUB } from './sub.js';
import { underwater } from './props.js';
import { subAt, vents } from './shots_b.js';
import { boatAt, rodTip } from './shots_c.js';
import { headPos, world, arr, move } from './rig.js';

const W = LAKE.water;

export function shotsD(S, P, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => P.T.start(id) + k * P.T.dur(id);
  const uw = (t, o = {}) => underwater(S, t, st.camera, o);
  const towerTop = () => world(S.sub, [0, 1.38, -0.2]);
  const line = () => { if (S.rod.visible) setRope(S.line, [arr(rodTip(S)), arr(towerTop())]); };
  // after the breach: the neighbour thrown clear, then treading water / clinging to the upturned boat
  const neighOut = t => {
    const n = S.neigh, f = P.neighFly(t); n.root.visible = true; S.scene.add(n.root);
    n.set(f.p, deg(160)); n.root.rotation.x = t < f.tIn ? -2.5 * (t - P.S.tBreach) : 0;
    n.setPose('arms_up'); flail(n, t, { amp: 30, legs: 25 }); eyes(n, t, 'wide', false); n.face.set(null, 'scream');
    return { n, f };
  };
  const grand = t => { const g = S.granCh; g.root.visible = true; g.set([GJETTY.x + 0.3, GJETTY.y + 0.04, GJETTY.z1 + 0.6], deg(20)); idle(g, t); S.snorkel.visible = true; return g; };

  return [
    { id: '36', dur: 1.3, frame: ({ u, d, t }) => {
      // compressed air blows the water out of the bottom ports: lighter than the water it displaces, it rises
      const p = subAt(S, P, t), v = vents(S), on = t > P.S.tBlow;
      if (on) { S.bub.blowA.update(t, P.S.tBlow, arr(v[0][1])); S.bub.blowB.update(t, P.S.tBlow, arr(v[1][1])); }
      const b = S.ben; b.arm('R', on ? -60 : -90, -10, 20); eyes(b, t, 'angry', false); b.face.set(null, 'talk3');
      boatAt(S, P, t, { bend: 1 }); line();
      uw(t, { centre: p });
      const c = world(S.sub.userData.tanks[0].g, [0, 0, 0]);
      shoot(st, [c.x + 4.6, c.y + 0.3, c.z + 2.2], [c.x, c.y + 0.2, c.z], 22, { t, aper: 0.8 });
      aimSun(sun, c, 10);
    } },

    { id: '37', dur: 1.4, frame: ({ u, d, t }) => {
      // rising faster and faster towards the boat's shadow on the surface
      const p = subAt(S, P, t, { pitch: -0.15 }), v = vents(S);
      S.bub.blowA.update(t, P.S.tBlow, arr(v[0][1])); S.bub.blowB.update(t, P.S.tBlow, arr(v[1][1]));
      boatAt(S, P, t, { bend: 1 }); line();
      uw(t, { centre: p });
      shoot(st, [p[0] + 3.5, LAKE.bed + 0.9, p[2] + 3.0], [p[0], p[1] + 1.5, p[2]], 20, { t, aper: 0.4 });
      aimSun(sun, p, 12);
    } },

    { id: '38', dur: 1.2, frame: ({ u, d, t }) => {
      // the breach: right under the rowboat, which flips; the neighbour flies
      const p = subAt(S, P, t);
      const B = boatAt(S, P, t, { neigh: t < P.S.tBreach });
      if (t >= P.S.tBreach) neighOut(t);
      FX.splash3.update(t, P.S.tBreach, [p[0], W, p[2]]); FX.foam.update(t, P.S.tBreach, [p[0], W, p[2]]);
      shoot(st, [p[0] + 8.5, 1.2, p[2] + 7.5], [p[0], 1.4, p[2]], 20, { t, shake: t > P.S.tBreach ? 0.03 : 0.01, aper: 0.4 });
      aimSun(sun, [p[0], 1, p[2]], 18);
    } },

    { id: '39', dur: 1.0, frame: ({ u, d, t }) => {
      const p = subAt(S, P, t);
      boatAt(S, P, t, { neigh: false });
      const { n, f } = neighOut(t);
      FX.splash.update(t, f.tIn, [f.p[0], W, f.p[2]]);
      shoot(st, [f.p[0] - 3.5, W + 0.6, f.p[2] + 3.2], [f.p[0], W + 1.0, f.p[2]], 24, { t, shake: 0.015, aper: 1 });
      aimSun(sun, f.p, 10);
    } },

    { id: '40', dur: 1.3, frame: ({ u, d, t }) => {
      // the sub bobs and settles to its floating line; the boat floats upside down beside it
      const p = subAt(S, P, t);
      boatAt(S, P, t, { neigh: false });
      const n = S.neigh, f = P.neighFly(t); n.root.visible = true; S.scene.add(n.root); n.set([f.p[0], W - 0.95 + 0.05 * Math.sin(t * 3), f.p[2]], deg(160)); n.setPose('arms_up');
      n.armL.rotation.z += deg(20 * Math.sin(t * 6)); n.armR.rotation.z -= deg(20 * Math.sin(t * 6)); eyes(n, t, 'angry'); n.face.set(null, 'frown');
      move(st, u / d, [[p[0] - 9, 2.2, p[2] + 8], [p[0], 0.4, p[2]], 20], [[p[0] - 8, 1.8, p[2] + 7], [p[0], 0.4, p[2]], 20], { t, aper: 0.4 });
      aimSun(sun, [p[0], 0, p[2]], 20);
    } },

    { id: '41', dur: 0.9, frame: ({ u, d, t }) => {
      // the neighbour climbs on the upturned boat, a fish flapping on his head
      subAt(S, P, t);
      const B = boatAt(S, P, t, { neigh: false }), n = S.neigh; n.root.visible = true; S.scene.add(n.root);
      n.set([B.position.x, W + 0.05, B.position.z], deg(150)); n.setPose('sit'); idle(n, t);
      eyes(n, t, 'angry'); talk(n, t, 'neighbour', { rest: 'frown' });
      const hp = headPos(n);
      const F1 = S.oneFish; F1.visible = true; F1.position.set(hp.x, hp.y + 0.32, hp.z); F1.rotation.set(0.6 * Math.sin(t * 18), 0.4, Math.PI / 2); F1.scale.setScalar(1.6);
      const fw = world(n.head, [0, 0.25, 1]).sub(hp);
      shoot(st, [hp.x + fw.x * 2.0 + 0.5, hp.y + 0.3, hp.z + fw.z * 2.0], [hp.x, hp.y - 0.05, hp.z], 28, { t, aper: 2.5, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '42', dur: 1.3, frame: ({ u, d, t }) => {
      // Ben pops the hatch and waves; the sub putters off to grandma's jetty
      const p = subAt(S, P, t, { hatch: 1, ben: false });
      const b = S.ben; b.root.visible = true; S.sub.add(b.root); b.root.position.set(0, 0.55, -0.55); b.root.rotation.set(0, 0, 0);
      b.setPose('wave'); b.armR.rotation.z += deg(25 * Math.sin(t * 10)); idle(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      FX.foam.update(t, Math.floor(t / 0.5) * 0.5, arr(world(S.sub, [0, 0, -SUB.body / 2 - 1.1])));
      boatAt(S, P, t, { neigh: false });
      move(st, u / d, [[p[0] + 6, 2.4, p[2] + 6], [p[0], 0.8, p[2]], 22], [[p[0] + 4, 2.0, p[2] + 6], [p[0] - 1, 0.8, p[2] - 1], 22], { t, aper: 0.5 });
      aimSun(sun, [p[0], 0, p[2]], 18);
    } },

    { id: '43', dur: 1.4, frame: ({ u, d, t }) => {
      // "Congratulations, you've built a submarine!": hero wide at grandma's jetty, confetti
      const p = subAt(S, P, t, { hatch: 1, ben: false });
      const b = S.ben; b.root.visible = true; S.sub.add(b.root); b.root.position.set(0, 0.55, -0.55); b.root.rotation.set(0, 0, 0);
      b.setPose('cheer'); idle(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const g = grand(t); g.setPose('hip'); eyes(g, t, 'raised'); g.face.set(null, 'flat');
      FX.confetti.update(t, at('43', 0.1), [p[0], 2.6, p[2]]);
      move(st, u / d, [[p[0] + 7, 0.6, p[2] + 7.5], [p[0] - 0.5, 1.2, p[2] - 1], 22], [[p[0] + 9, 3.2, p[2] + 9], [p[0] - 0.5, 1.0, p[2] - 1], 22], { t, aper: 0.4, ease: eo });
      aimSun(sun, [p[0], 0, p[2]], 20);
    } },

    { id: '44', dur: 1.4, frame: ({ u, d, t }) => {
      // grandma, snorkel and mask on: "They sell snorkels, dear."
      const p = subAt(S, P, t, { hatch: 1, ben: false });
      const b = S.ben; b.root.visible = true; S.sub.add(b.root); b.root.position.set(0, 0.55, -0.55); b.root.rotation.set(0, 0, 0); b.setPose('stand'); idle(b, t); eyes(b, t, 'lazy'); b.face.set(null, 'flat');
      const g = grand(t); g.setPose('point'); g.arm('R', -80, -15, -20); eyes(g, t, 'raised'); talk(g, t, 'grandma', { rest: 'smile' });
      const hp = headPos(g), bh = headPos(b);
      shoot(st, [bh.x + (bh.x - hp.x) * 0.5 + 1.8, bh.y + 0.5, bh.z + (bh.z - hp.z) * 0.5 - 0.6], [(hp.x * 2 + bh.x) / 3, hp.y - 0.2, (hp.z * 2 + bh.z) / 3], 24, { t, aper: 2, focus: arr(hp) });
      aimSun(sun, hp, 10);
    } },

    { id: '45', dur: 1.0, frame: ({ u, d, t }) => {
      // Ben's deadpan; the lake drains out of his ears
      subAt(S, P, t, { hatch: 1, ben: false });
      const b = S.ben; b.root.visible = true; S.sub.add(b.root); b.root.position.set(0, 0.55, -0.55); b.root.rotation.set(0, deg(-30), 0); b.setPose('stand'); idle(b, t, { amp: 0.2 });
      const hp = headPos(b); eyes(b, t, u > 0.6 ? 'shut' : 'lazy', false); b.face.set(null, 'flat');
      FX.drips.update(t, at('45', 0), [hp.x + 0.33, hp.y - 0.05, hp.z]);
      const f = world(b.head, [0, 0.25, 1]).sub(hp);
      shoot(st, [hp.x + f.x * 1.7 + 0.2, hp.y + 0.05, hp.z + f.z * 1.7], [hp.x, hp.y - 0.05, hp.z], 30, { t, aper: 3, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },
  ];
}
