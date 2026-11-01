// Shots 13-24: the neighbour's bedsheets become an envelope, the fan, the burner stands it up, Ben boards, lift-off,
// and the first climb over the island.
import * as THREE from 'three';
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, nod, tremble, bounce, flail, look } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { YARD } from './set.js';
import { RIG, ENV, burn } from './balloon.js';
import { walk, hold, eat, hop, headPos, local, world, arr, move, mix } from './rig.js';
import { balloonAt, benAboard, onValve, launchPose, rimCentre, crown, envCentre } from './crew.js';

const STAKE = [-3.4, 0, -2.2];   // the tether's ground stake

export function shotsB(S, F, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => F.T.start(id) + k * F.T.dur(id);
  const B = () => S.bal;
  // envelope fill over the cold inflation (15-16) and the burn (17)
  const fillAt = t => clamp(0.05 + 0.75 * ss((t - at('15', 0.1)) / (at('16', 1) - at('15', 0.1))) + 0.2 * ss((t - at('17', 0)) / (F.T.dur('17') * 0.5)), 0, 1);
  const standAt = t => clamp((t - at('17', 0.2)) / (F.T.dur('17') * 0.8 + F.T.dur('18') * 0.6));
  const tether = (on = true) => {
    const r = world(B().R, [-RIG.w / 2, 0.35, 0]);
    setRope(B().tether, on ? [arr(r), [(r.x + STAKE[0]) / 2, Math.min(r.y, 0.4) * 0.6, (r.z + STAKE[2]) / 2], [STAKE[0], 0.3, STAKE[2]]] : [[STAKE[0], 0.05, STAKE[2]], [STAKE[0] + 0.8, 0.03, STAKE[2] + 0.3], [STAKE[0] + 1.6, 0.05, STAKE[2] + 0.2]]);
    S.stake.visible = true;
  };

  return [
    { id: '13', dur: 1.4, frame: ({ u, d, t }) => {
      // narrator and Ben unroll the envelope across the lawn (it lies flat; a striped roll travels to +x)
      const k = eio(clamp(u / (d * 0.9)));
      launchPose(S, t, 1, 0, { flat: 0.985 });
      const E = B().E; E.scale.set(0.015, Math.max(0.02, k), 1.25); E.position.y = 0.06;
      const end = RIG.mouth + 0.3 + ENV.top * k;
      const roll = B().roll; roll.visible = true; roll.position.set(end, 0.35 * (1 - k) + 0.12, 0); roll.scale.set(0.35 + 0.65 * (1 - k), 1, 0.35 + 0.65 * (1 - k)); roll.rotation.set(Math.PI / 2, 0, -k * 22);
      const n = S.narr; n.root.visible = true; n.set([end + 0.6, 0, -1.6], -Math.PI / 2 - deg(20)); n.setPose('push'); walk(n, t * 10, 0.6); idle(n, t); eyes(n, t, 'open'); n.face.set(null, 'grin');
      const b = S.ben; b.root.visible = true; b.set([end + 0.6, 0, 1.6], -Math.PI / 2 + deg(20)); b.setPose('push'); walk(b, t * 10 + 1.5, 0.6); idle(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      move(st, u / d, [[-4, 9, 12], [6, 0, 0], 22], [[-2, 11, 13], [9, 0, -0.5], 22], { t, shake: 0.01, aper: 0.5 });
      aimSun(sun, [7, 0, 0], 30);
    } },

    { id: '14', dur: 1.0, frame: ({ u, d, t }) => {
      launchPose(S, t, 0.05, 0, { flat: 0.6 });
      const n = S.neigh; n.root.visible = true; n.set([YARD.fenceX + 0.45, 0, 1.2], -Math.PI / 2); idle(n, t);
      n.setPose('point'); n.arm('L', -70, 15); n.spine.rotation.x += deg(-10);
      eyes(n, t, 'angry'); talk(n, t, 'neighbour', { rest: 'frown' });
      n.head.rotation.x += deg(10);
      const hp = headPos(n);
      move(st, u / d, [[hp.x - 3.4, 1.4, hp.z + 1.6], [hp.x, hp.y - 0.3, hp.z], 30], [[hp.x - 3.0, 1.45, hp.z + 1.4], [hp.x, hp.y - 0.25, hp.z], 32], { t, shake: 0.01, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '15', dur: 1.3, frame: ({ u, d, t }) => {
      const f = fillAt(t);
      launchPose(S, t, f, 0, { ripple: 1 - f * 0.6, flat: 0.45 * (1 - f) });
      const fan = S.fan; fan.visible = true; fan.position.set(1.4, 0, 1.6); fan.rotation.y = Math.atan2(RIG.mouth - 1.4, -1.6) - Math.PI;
      fan.userData.hub.rotation.z = t * 40;
      FX.wind.update(t, Math.floor(t / 0.6) * 0.6, [1.6, 0.9, 1.3]);
      const n = S.narr; n.root.visible = true; n.set([4.5, 0, 6.2], deg(200)); n.setPose('hip'); idle(n, t); eyes(n, t, 'open'); n.face.set(null, 'smile');
      const b = S.ben; b.root.visible = true; b.set([-0.6, 0, 1.4], deg(80)); idle(b, t); b.setPose('cheer'); bounce(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      move(st, u / d, [[-3.6, 1.0, 6.5], [7, 2.2, -0.5], 20], [[-2.6, 1.1, 5.4], [8, 2.6, -0.5], 20], { t, shake: 0.015, aper: 0.6 });
      aimSun(sun, [6, 1, 0], 26);
    } },

    { id: '16', dur: 1.0, frame: ({ u, d, t }) => {
      // inside the envelope: the sun glows through the striped fabric
      const f = fillAt(t);
      const h = launchPose(S, t, f, 0, { ripple: 0.5 });
      const m = B().env.material; m.emissiveMap = B().goreTex; m.emissive.set('#ffffff'); m.emissiveIntensity = 0.75; m.needsUpdate = true;
      const E = B().E.position;
      shoot(st, [E.x + 0.6, h + 0.2, 0.3], [E.x + 12, h + 0.9 + 0.6 * u, 0.6 * Math.sin(u * 2)], 12, { t, roll: deg(10) * u });
      aimSun(sun, [6, 1, 0], 26);
    } },

    { id: '17', dur: 1.4, frame: ({ u, d, t }) => {
      const s = standAt(t);
      launchPose(S, t, fillAt(t), s, { ripple: 0.3 * (1 - s) });
      burn(B(), t, F.burning(t) ? 1 : 0);
      tether();
      const b = S.ben; b.root.visible = true; b.set([-0.4, 0, 1.1], deg(60)); idle(b, t); b.setPose('stand');
      b.arm('R', -110, -10, 30); b.arm('L', -40, 30); eyes(b, t, 'wide', false); b.face.set(null, 'grin');
      FX.heat.update(t, at('17', 0), arr(world(B().E, [0, 0.5, 0])));
      const n = S.narr; n.root.visible = true; n.set([STAKE[0] + 0.5, 0, STAKE[2] + 0.5], deg(80)); n.setPose('haul_lo'); idle(n, t); eyes(n, t, 'open'); n.face.set(null, 'o'); n.head.rotation.x += deg(-25 * s);
      move(st, u / d, [[-11, 2.0, 15], [3.5, 3.5, 0], 22], [[-12, 2.6, 17], [2, 7, 0], 22], { t, shake: 0.012, aper: 0.4 });
      aimSun(sun, [2, 4, 0], 32);
    } },

    { id: '18', dur: 0.9, frame: ({ u, d, t }) => {
      launchPose(S, t, 1, standAt(t), { ripple: 0.1 });
      burn(B(), t, 1);
      const b = S.ben; b.root.visible = true; b.set([-0.4, 0, 1.1], deg(60)); idle(b, t); b.setPose('stand');
      b.arm('R', -55, -70); b.arm('L', -150, 35, 60);      // valve at his side, the other hand shading his eyes
      eyes(b, t, 'lazy', false); b.face.set(null, 'grin');
      b.mSkin.color.set('#ffb070');
      const hp = headPos(b);
      shoot(st, [hp.x + 1.25, hp.y - 0.05, hp.z + 0.75], [hp.x + 0.05, hp.y - 0.05, hp.z], 32, { t, shake: 0.02, aper: 6, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },

    { id: '19', dur: 1.2, frame: ({ u, d, t }) => {
      // Ben hops into the basket; the narrator hands him a fresh sandwich
      launchPose(S, t, 1, 1, { ripple: 0.05 });
      burn(B(), t, 0.6 + 0.4 * Math.sin(t * 3) ** 2);
      tether();
      const k = ss(clamp((u - 0.05) / 0.45)), b = S.ben; b.root.visible = true;
      const from = [0.95, 0, 0.95], to = [0.05, 0.06, -0.1];
      b.set([lerp(from[0], to[0], k), lerp(from[1], to[1], k) + 1.15 * Math.sin(k * Math.PI), lerp(from[2], to[2], k)], deg(lerp(220, 360, k)));
      b.setPose('stand'); if (k < 1) { b.legL.rotation.x = deg(-70 * Math.sin(k * Math.PI)); b.arm('L', -120, 20); b.arm('R', -120, -20); }
      idle(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const n = S.narr; n.root.visible = true; n.set([1.35, 0, 1.15], deg(225)); idle(n, t); eyes(n, t, 'open'); n.face.set(null, 'smile');
      const hand = u > 0.55;
      n.arm('R', hand ? -85 : -30, -10, 15);
      if (u > 0.55 && u < 0.8) hold(n, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]);
      if (u >= 0.8) { hold(b, S.sandwich, 'L', [0, -0.6, 0.08], [deg(90), 0, 0]); b.arm('L', -70, 20); }
      const c = rimCentre(S);
      move(st, u / d, [[c.x - 3.6, 1.6, c.z + 4.2], [c.x, 1.3, c.z], 24], [[c.x - 3.2, 1.7, c.z + 3.7], [c.x, 1.45, c.z], 24], { t, shake: 0.012, aper: 2 });
      aimSun(sun, c, 10);
    } },

    { id: '20', dur: 1.3, frame: ({ u, d, t }) => {
      // the narrator pulls the quick-release; the basket leaves the lawn
      const p = balloonAt(S, F, t, { sway: 0.3 });
      tether(t < F.B.tRelease);
      const b = benAboard(S, t); b.setPose('stand'); onValve(b, F.burning(t) ? 1 : 0); b.arm('L', -60, 25); hold(b, S.sandwich, 'L', [0, -0.6, 0.08], [deg(90), 0, 0]);
      eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const n = S.narr; n.root.visible = true; n.set([STAKE[0] + 0.5, 0, STAKE[2] + 0.5], deg(80)); idle(n, t);
      const pulled = t > F.B.tRelease; n.setPose(pulled ? 'cheer' : 'haul_lo'); eyes(n, t, pulled ? 'happy' : 'open', !pulled); n.face.set(null, pulled ? 'grin' : 'flat');
      FX.dust.update(t, F.B.tRelease, [p[0], 0.05, p[2]]);
      move(st, u / d, [[-6.5, 0.4, 9.5], [0, 2.4, 0], 20], [[-6.2, 0.35, 9.0], [0, 3.6, 0], 20], { t, shake: 0.012, aper: 0.6 });
      aimSun(sun, [0, 3, 0], 26);
    } },

    { id: '21', dur: 1.2, frame: ({ u, d, t }) => {
      const p = balloonAt(S, F, t);
      const b = benAboard(S, t); b.setPose('wave'); b.armR.rotation.z += deg(25 * Math.sin(t * 10)); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const n = S.narr; n.root.visible = true; n.set([-1.0, 0, 2.6], deg(160)); idle(n, t); n.setPose('wave'); n.armR.rotation.z += deg(25 * Math.sin(t * 9));
      eyes(n, t, 'happy', false); n.face.set(null, 'grin'); n.head.rotation.x += deg(-40);
      shoot(st, [-2.4, 0.3, 6.6], [p[0] * 0.5 - 0.6, 3.2 + p[1] * 0.55, p[2]], 18, { t, shake: 0.01, aper: 0.6 });
      aimSun(sun, [0, 4, 0], 30);
    } },

    { id: '22', dur: 1.6, frame: ({ u, d, t }) => {
      const p = balloonAt(S, F, t);
      const b = benAboard(S, t); b.setPose('cheer'); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const a = deg(lerp(-35, 5, eio(u / d))), R = 30;
      shoot(st, [p[0] + R * Math.sin(a), p[1] + 16, p[2] + R * Math.cos(a)], [p[0], p[1] + 4, p[2]], 24, { t, aper: 0.2 });
      aimSun(sun, [p[0], p[1] / 2, p[2]], 70);
    } },

    { id: '23', dur: 0.9, frame: ({ u, d, t }) => {
      balloonAt(S, F, t);
      const b = benAboard(S, t, { rotY: deg(20) }); b.setPose('stand');
      const off = t > F.B.tOff; onValve(b, off ? 0 : 1);
      if (off) eat(b, t, 'R', 0.9); else b.face.set(null, 'grin');
      hold(b, S.sandwich, off ? 'R' : 'L', [0, -0.6, 0.08], [deg(90), 0, 0]);
      eyes(b, t, 'happy', false);
      const hp = headPos(b);
      shoot(st, [hp.x + 0.6, hp.y + 0.1, hp.z + 1.7], [hp.x + 0.05, hp.y - 0.15, hp.z], 30, { t, shake: 0.015, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '24', dur: 1.2, frame: ({ u, d, t }) => {
      // Ben's view down over the rim: the yard, the narrator waving
      const p = balloonAt(S, F, t);
      const n = S.narr; n.root.visible = true; n.set([-1.0, 0, 2.6], deg(160)); idle(n, t); n.setPose('wave'); n.armR.rotation.z += deg(25 * Math.sin(t * 9));
      const b = benAboard(S, t); b.setPose('stand'); b.arm('L', -60, 25); hold(b, S.sandwich, 'L', [0, -0.6, 0.08], [deg(90), 0, 0]);
      const c = rimCentre(S);
      shoot(st, [c.x + 0.4, c.y + 0.5, c.z + 0.9], [c.x - 1.5 - 1.5 * u, 0, c.z + 2.2], 20, { t, shake: 0.01, aper: 0.3, roll: deg(4) * Math.sin(t) });
      aimSun(sun, [0, 0, 0], 40);
    } },
  ];
}
