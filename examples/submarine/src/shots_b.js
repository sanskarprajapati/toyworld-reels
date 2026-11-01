// Shots 12-24: building the sub, Ben boards, the crane launch, flooding the tanks, too heavy (the bottom), trimming to
// neutral, the underwater hero, propeller on.
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, nod, look, bounce } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { LAKE } from './set.js';
import { SUB, poseSub } from './sub.js';
import { underwater, fishSchool } from './props.js';
import { hold, headPos, world, arr, move, mix } from './rig.js';

const W = LAKE.water;
export const BUILD = [4.6, 0.85, 16.2];       // where the sub is assembled on the lawn

// the sub from the physics at t; Ben in his seat behind the bow dome
export function subAt(S, P, t, o = {}) {
  const p = o.pos ?? P.subPos(t), U = S.sub;
  poseSub(U, p, { yaw: o.yaw ?? P.subYaw(t), pitch: o.pitch ?? P.subPitch(t), roll: o.roll ?? 0.03 * Math.sin(t * 1.3),
    spin: o.spin ?? (t > P.S.tGo ? (t - P.S.tGo) * 18 : 0), fill: o.fill ?? P.fill(t), peri: o.peri ?? 0, hatch: o.hatch ?? 0, rudder: o.rudder ?? 0 });
  if (o.ben !== false) {
    const b = S.ben; b.root.visible = true; U.add(b.root);
    b.root.position.set(0, -0.62, 0.55); b.root.rotation.set(0, 0, 0); b.setPose('sit'); idle(b, t);
  }
  return p;
}
// world positions of the tanks' top vents and bottom ports
export const vents = S => S.sub.userData.tanks.map(tk => [world(tk.g, [0, SUB.tankR + 0.1, 1.1]), world(tk.g, [0, -SUB.tankR - 0.1, -1.1])]);

export function shotsB(S, P, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => P.T.start(id) + k * P.T.dur(id);
  const uw = (t, o = {}) => underwater(S, t, st.camera, o);

  return [
    { id: '12', dur: 1.4, frame: ({ u, d, t }) => {
      // the sub assembles on the lawn: hull, then tanks, then the periscope; sparks fly
      const k1 = back(clamp(u / (d * 0.35)), 1.6), k2 = back(clamp((u - d * 0.35) / (d * 0.3)), 1.8);
      subAt(S, P, t, { pos: BUILD, yaw: deg(90), pitch: 0, roll: 0, fill: 0, peri: clamp((u - d * 0.7) / (d * 0.25)), ben: false, spin: t * 6 });
      S.sub.scale.setScalar(Math.max(0.001, k1));
      S.sub.userData.tanks.forEach(tk => tk.g.scale.setScalar(Math.max(0.001, k2)));
      FX.sparks.update(t, at('12', 0.05), [BUILD[0] - 0.6, BUILD[1] + 0.9, BUILD[2] + 0.4]);
      const n = S.narr; n.root.visible = true; n.set([BUILD[0] - 1.0, 0, BUILD[2] + 1.5], deg(150)); idle(n, t); n.setPose('stand');
      n.arm('R', -110 + 40 * Math.abs(Math.sin(t * 12)), -15); n.arm('L', -60, 20); eyes(n, t, 'happy', false); n.face.set(null, 'grin');
      const b = S.ben; b.root.visible = true; b.set([BUILD[0] + 1.8, 0, BUILD[2] + 1.6], deg(210)); idle(b, t); b.setPose('cheer'); bounce(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      move(st, u / d, [[BUILD[0] - 6, 4.5, BUILD[2] + 6.5], [BUILD[0], 0.8, BUILD[2]], 22], [[BUILD[0] - 3.5, 3.2, BUILD[2] + 7.5], [BUILD[0], 1.0, BUILD[2]], 22], { t, shake: 0.01, aper: 1 });
      aimSun(sun, BUILD, 14);
    } },

    { id: '13', dur: 1.3, frame: ({ u, d, t }) => {
      subAt(S, P, t, { pos: BUILD, yaw: deg(90), pitch: 0, roll: 0, fill: 0, peri: 1, ben: false });
      const c = world(S.sub.userData.tanks[0].g, [0, 0, 0]);
      move(st, u / d, [[c.x + 1.2, c.y + 1.2, c.z + 5.2], [c.x, c.y + 0.2, c.z], 24], [[c.x - 0.8, c.y + 0.9, c.z + 4.6], [c.x, c.y + 0.2, c.z], 24], { t, shake: 0.006, aper: 2 });
      aimSun(sun, c, 8);
    } },

    { id: '14', dur: 1.0, frame: ({ u, d, t }) => {
      // Ben climbs down the hatch with his fishing net
      subAt(S, P, t, { pos: BUILD, yaw: deg(90), pitch: 0, roll: 0, fill: 0, peri: 1, ben: false, hatch: 1 });
      const hatch = world(S.sub, [0, 1.42, -0.55]), k = ss(clamp((u - 0.2) / (d * 0.7)));
      const b = S.ben; b.root.visible = true; b.set([hatch.x, hatch.y - 1.1 * k, hatch.z], deg(200)); idle(b, t);
      b.setPose('cheer'); b.arm('L', -170, 15); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const n = S.narr; n.root.visible = true; n.set([BUILD[0] + 1.6, 0, BUILD[2] + 1.8], deg(220)); idle(n, t); n.setPose('thumbs'); eyes(n, t, 'happy', false); n.face.set(null, 'grin');
      shoot(st, [hatch.x - 2.4, hatch.y + 1.0, hatch.z + 3.2], [hatch.x, hatch.y + 0.1, hatch.z], 26, { t, shake: 0.01, aper: 2 });
      aimSun(sun, hatch, 8);
    } },

    { id: '15', dur: 1.2, frame: ({ u, d, t }) => {
      // the crane lowers it in; it floats high (tanks empty: 87 % under)
      const p = subAt(S, P, t, { fill: 0 });
      const tip = world(S.boom, [0, 0, -6]), top = world(S.sub, [0, 1.4, -0.2]);
      if (t < P.S.tSplash + 0.2) setRope(S.hookLine, [arr(tip), arr(top)]);
      FX.splash3.update(t, P.S.tSplash, [p[0], W, p[2]]); FX.foam.update(t, P.S.tSplash, [p[0], W, p[2]]);
      const n = S.narr; n.root.visible = true; n.set([3.0, 0, 14.4], deg(200)); idle(n, t); n.setPose('point'); n.arm('R', -120, -20); eyes(n, t, 'open'); n.face.set(null, 'smile');
      move(st, u / d, [[p[0] - 8, 2.2, p[2] + 5], [p[0], 1.4, p[2]], 22], [[p[0] - 7.4, 1.8, p[2] + 4.4], [p[0], 0.8, p[2]], 22], { t, shake: 0.012, aper: 0.8 });
      aimSun(sun, [p[0], 0, p[2]], 18);
    } },

    { id: '16', dur: 1.3, frame: ({ u, d, t }) => {
      // vents open: water floods in at the bottom ports, air bubbles out of the top vents
      const p = subAt(S, P, t);
      const v = vents(S), on = t > P.S.tVent - 0.6;
      if (on) { S.bub.ventA.update(t, P.S.tVent - 0.6, arr(v[0][0])); S.bub.ventB.update(t, P.S.tVent - 0.6, arr(v[1][0])); FX.foam.update(t, P.S.tVent - 0.4, [p[0], W, p[2]]); }
      const b = S.ben; eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const c = world(S.sub.userData.tanks[0].g, [0, 0, 0]);
      shoot(st, [c.x + 3.6, W + 0.7, c.z + 4.6], [c.x - 0.3, c.y + 0.3, c.z], 22, { t, shake: 0.01, aper: 1.2 });
      aimSun(sun, c, 10);
    } },

    { id: '17', dur: 1.4, frame: ({ u, d, t }) => {
      // at the waterline: it slips under
      const p = subAt(S, P, t);
      const v = vents(S);
      if (p[1] > W - 1.5) { S.bub.ventA.update(t, P.S.tVent, arr(v[0][0])); S.bub.ventB.update(t, P.S.tVent, arr(v[1][0])); }
      FX.foam.update(t, at('17', 0.3), [p[0], W, p[2]]);
      S.waterAlpha = 0.45;
      shoot(st, [p[0] + 4.5, W + 0.22, p[2] + 4.5], [p[0], W - 0.25, p[2]], 24, { t, aper: 0.8 });
      aimSun(sun, [p[0], 0, p[2]], 14);
    } },

    { id: '18', dur: 1.2, frame: ({ u, d, t }) => {
      // too heavy: down to the bottom, thump, sand
      const p = subAt(S, P, t);
      const b = S.ben; eyes(b, t, t > P.S.tBottom ? 'dizzy' : 'wide', false); b.face.set(null, 'o');
      FX.sand.update(t, P.S.tBottom, [p[0], LAKE.bed + 0.1, p[2]]);
      uw(t, { centre: p, fish: [p[0] - 3, -4.5, p[2] - 3], away: [p] });
      const kick = t > P.S.tBottom ? 0.1 * Math.exp(-(t - P.S.tBottom) * 7) * Math.sin((t - P.S.tBottom) * 45) : 0;
      shoot(st, [p[0] - 5.5, LAKE.bed + 1.0 + kick, p[2] - 4.5], [p[0], lerp(-4.5, LAKE.bed + 1.0, ss(u / d)), p[2]], 20, { t, aper: 0.6 });
      aimSun(sun, p, 14);
    } },

    { id: '19', dur: 0.9, frame: ({ u, d, t }) => {
      const p = subAt(S, P, t), b = S.ben;
      b.spine.rotation.z += deg(10 * Math.sin(t * 9)); b.head.rotation.z += deg(14 * Math.sin(t * 9 + 1));
      eyes(b, t, 'dizzy', false); b.face.set(null, 'flat');
      const hp = headPos(b), fw = world(S.sub, [0, 0, 6]);
      uw(t, { centre: p });
      shoot(st, [hp.x + (fw.x - p[0]) * 0.3, hp.y + 0.1, hp.z + (fw.z - p[2]) * 0.3], [hp.x, hp.y - 0.05, hp.z], 30, { t, shake: 0.01, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },

    { id: '20', dur: 1.3, frame: ({ u, d, t }) => {
      // the pump pushes half the water back out: as heavy as the water it displaces, it lifts off and hangs still
      const p = subAt(S, P, t), v = vents(S);
      if (t > P.S.tPump) { S.bub.blowA.update(t, P.S.tPump, arr(v[0][1])); S.bub.blowB.update(t, P.S.tPump, arr(v[1][1])); }
      FX.sand.update(t, P.S.tLift, [p[0], LAKE.bed + 0.1, p[2]]);
      const b = S.ben; eyes(b, t, 'happy', false); b.face.set(null, 'grin'); b.arm('R', -60, -10);
      uw(t, { centre: p, fish: [p[0] + 3, -4.5, p[2] - 2], away: [] });
      const c = world(S.sub.userData.tanks[0].g, [0, 0, 0]);
      shoot(st, [c.x + 5.0, c.y + 0.8, c.z + 2.4], [c.x - 0.6, c.y + 0.3, c.z], 22, { t, aper: 0.8 });
      aimSun(sun, c, 10);
    } },

    { id: '21', dur: 1.4, frame: ({ u, d, t }) => {
      // the underwater hero: hovering, fish all around, light shafts
      const p = subAt(S, P, t);
      const b = S.ben; b.setPose('sit'); b.arm('L', -100, 30); b.arm('R', -100, -30); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      uw(t, { centre: p, fish: [p[0], p[1] + 0.3, p[2]], away: [] });
      const a = deg(lerp(200, 250, eio(u / d)));
      shoot(st, [p[0] + 7.5 * Math.sin(a), p[1] - 0.8, p[2] + 7.5 * Math.cos(a)], [p[0], p[1] + 0.4, p[2]], 20, { t, aper: 0.5 });
      aimSun(sun, p, 16);
    } },

    { id: '22', dur: 0.9, frame: ({ u, d, t }) => {
      const p = subAt(S, P, t), b = S.ben; eyes(b, t, 'happy', false); b.face.set(null, 'grin'); b.arm('R', -120, -20, 40);
      const dome = world(S.sub, [0, 0.1, SUB.body / 2 + 1.05]), fw = world(S.sub, [0, 0, 6]);
      S.fish.visible = true; fishSchool(S, t, [dome.x + 1.5, dome.y, dome.z], []);
      uw(t, { centre: p });
      shoot(st, [dome.x + (fw.x - p[0]) * 0.32 + 0.5, dome.y + 0.15, dome.z + (fw.z - p[2]) * 0.32], [dome.x, dome.y - 0.15, dome.z], 28, { t, aper: 2.5 });
      aimSun(sun, dome, 6);
    } },

    { id: '23', dur: 1.2, frame: ({ u, d, t }) => {
      // propeller on: it moves off, rudder over
      const p = subAt(S, P, t, { rudder: deg(15) * Math.sin(u * 3) });
      S.bub.wake.update(t, P.S.tGo, arr(world(S.sub, [0, 0, -SUB.body / 2 - 1.1])));
      uw(t, { centre: p, fish: [p[0] - 3, p[1] + 1, p[2] + 2], away: [p] });
      const st0 = world(S.sub, [2.2, 0.6, -5.2]);
      shoot(st, arr(st0), arr(world(S.sub, [0, 0, -1.2])), 22, { t, aper: 1 });
      aimSun(sun, p, 12);
    } },

    { id: '24', dur: 1.3, frame: ({ u, d, t }) => {
      // gliding past the kelp forest and a sunken bicycle; the weeds sway in its wake
      const p = subAt(S, P, t);
      S.bub.wake.update(t, P.S.tGo, arr(world(S.sub, [0, 0, -SUB.body / 2 - 1.1])));
      uw(t, { centre: p, wake: p, fish: [p[0] + 3, p[1] - 1, p[2] - 3], away: [p] });
      S.bike.position.set(4.3, LAKE.bed + 0.05, 3.2);
      const side = world(S.sub, [-6, -0.8, 1.5]);
      shoot(st, [side.x, Math.max(LAKE.bed + 0.8, side.y), side.z], [p[0], p[1] - 0.6, p[2]], 20, { t, aper: 0.6 });
      aimSun(sun, p, 14);
    } },
  ];
}
