// Shots 01-11: Ben in a barrel with a rock (sinks, stuck), Archimedes on the bench, the beach ball that won't go under,
// and the sink / float / hover tank.
import { deg, ss, eo, eio, back, clamp, lerp, noise1, setRope } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, nod, look, bounce, jabber } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { LAKE, JETTY } from './set.js';
import { underwater } from './props.js';
import { bob } from './physics.js';
import { walk, hold, hop, headPos, local, world, arr, move, mix } from './rig.js';

const W = LAKE.water;

export function shotsA(S, P, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => P.T.start(id) + k * P.T.dur(id);

  // the barrel from the physics, Ben standing in it; the rock rides beside it on the deck, then hangs below once it falls
  const barrel = (t, o = {}) => {
    const b = S.barrel, s = P.barrelAt(t); b.visible = true;
    b.position.set(...s.p); b.rotation.set(s.tilt, 0, 0);
    const k = ss((t - P.barrel.tKick) / 0.35), rock = b.userData.rock;
    rock.position.set(lerp(0.78, 0, k), lerp(0.25, -0.45, k), lerp(0.1, 0, k));
    const ben = S.ben; ben.root.visible = true; b.add(ben.root); ben.root.position.set(0, 0.05, 0); ben.root.rotation.set(0, o.rotY ?? 0, 0);
    idle(ben, t);
    const top = world(b, [0, 0.95, 0]), rk = world(rock, [0, 0.3, 0]);
    setRope(S.rope, [arr(top), [(top.x + rk.x) / 2 + 0.15, (top.y + rk.y) / 2, (top.z + rk.z) / 2], arr(rk)]);
    return ben;
  };
  const narr = (pos, rotY) => { const n = S.narr; n.root.visible = true; n.set(pos, rotY); return n; };
  const deck = (x, z) => [x, JETTY.y + 0.04, z];
  const uw = (t, o = {}) => underwater(S, t, st.camera, o);

  return [
    { id: '01', dur: 1.3, frame: ({ u, d, t }) => {
      const ben = barrel(t); ben.setPose('thumbs'); eyes(ben, t, 'happy', false); ben.face.set(null, 'grin');
      const n = narr(deck(1.05, 8.6), -deg(120)); n.setPose('peer'); n.arm('L', -70, 10); n.arm('R', -70, -10, 10 * Math.sin(t * 14)); idle(n, t);
      eyes(n, t, 'open'); n.face.set(null, 'smile');
      move(st, u / d, [[-5.0, 3.4, 12.8], [0.4, 0.6, 8.3], 22], [[-3.6, 2.3, 11.2], [0.4, 0.8, 8.3], 24], { t, shake: 0.015, aper: 1.2, ease: eo });
      aimSun(sun, [0, 0, 8], 14);
    } },

    { id: '02', dur: 1.0, frame: ({ u, d, t }) => {
      const ben = barrel(t), air = t > P.barrel.tKick;
      ben.setPose(air ? 'arms_up' : 'thumbs'); if (air) flail(ben, t, { amp: 25 }); eyes(ben, t, air ? 'wide' : 'happy', false); ben.face.set(null, air ? 'scream' : 'grin');
      const n = narr(deck(0.45, 8.9), Math.PI); n.setPose('stand'); idle(n, t);
      const kk = ss((t - P.barrel.tKick + 0.2) / 0.2) * (1 - ss((t - P.barrel.tKick - 0.2) / 0.3));
      n.legR.rotation.x = deg(-75 * kk); n.spine.rotation.x += deg(-10 * kk); n.arm('L', -30, 40); n.arm('R', -30, -40);
      eyes(n, t, 'happy', false); n.face.set(null, 'grin');
      const e = P.barrel.xEntry;
      FX.splash.update(t, P.barrel.tEntry, [e[0], W, e[1]]); FX.foam.update(t, P.barrel.tEntry, [e[0], W, e[1]]);
      shoot(st, [-4.6, 0.3, 7.9], [0.1, 0.35, 7.6], 24, { t, shake: t > P.barrel.tEntry ? 0.03 : 0.01, aper: 1.5 });
      aimSun(sun, [0, 0, 8], 12);
    } },

    { id: '03', dur: 1.3, frame: ({ u, d, t }) => {
      // underwater reveal: rock-first, a bubble trail; the fish scatter
      const ben = barrel(t); ben.setPose('arms_up'); flail(ben, t, { amp: 15, period: 0.4 }); eyes(ben, t, 'wide', false); ben.face.set(null, 'closed');
      const p = S.barrel.position;
      S.bub.trail.update(t, P.barrel.tEntry, [p.x, p.y + 1.0, p.z]);
      uw(t, { centre: [p.x, -3, p.z], fish: [p.x + 1.5, -4.5, p.z - 1.5], away: [[p.x, p.y, p.z]] });
      shoot(st, [p.x + 3.0, -2.4, p.z - 4.6], [p.x, p.y - 0.4, p.z], 20, { t, aper: 1 });
      aimSun(sun, [p.x, -3, p.z], 16);
    } },

    { id: '04', dur: 1.4, frame: ({ u, d, t }) => {
      // thump on the sand; a burst of bubbles goes up like confetti
      const ben = barrel(t), landed = t > P.barrel.tLand;
      ben.setPose(landed ? 'cheer' : 'arms_up'); eyes(ben, t, landed ? 'happy' : 'wide', false); ben.face.set(null, 'closed');
      const p = S.barrel.position;
      FX.sand.update(t, P.barrel.tLand, [p.x, LAKE.bed + 0.1, p.z]);
      S.bub.burst.update(t, P.barrel.tLand + 0.08, [p.x, p.y + 1.1, p.z]);
      S.bub.trail.update(t, P.barrel.tEntry, [p.x, p.y + 1.0, p.z]);
      uw(t, { centre: [p.x, -3, p.z], fish: [p.x - 2, -5.2, p.z + 1], away: [[p.x, p.y, p.z]] });
      const kick = landed ? 0.08 * Math.exp(-(t - P.barrel.tLand) * 8) * Math.sin((t - P.barrel.tLand) * 50) : 0;
      move(st, u / d, [[p.x - 3.2, LAKE.bed + 0.8 + kick, p.z - 3.6], [p.x, LAKE.bed + 1.6, p.z], 20], [[p.x - 3.6, LAKE.bed + 1.1 + kick, p.z - 4.2], [p.x, LAKE.bed + 2.2, p.z], 20], { t, aper: 0.8 });
      aimSun(sun, [p.x, -4, p.z], 16);
    } },

    { id: '05', dur: 0.9, frame: ({ u, d, t }) => {
      const ben = barrel(t); ben.setPose('hold'); ben.arm('L', -100, 20, 30); ben.arm('R', -100, -20, 30);
      eyes(ben, t, 'wide'); ben.face.set(null, 'closed'); tremble(ben, t, 0.4);
      ben.root.scale.set(1, 1, 1);
      const hp = headPos(ben);
      S.bub.mouth.update(t, at('05', 0), [hp.x, hp.y - 0.05, hp.z + 0.25]);
      uw(t, { centre: [hp.x, -3, hp.z], fish: [hp.x + 1.2, hp.y + 0.5, hp.z - 1], away: [] });
      shoot(st, [hp.x + 0.5, hp.y + 0.05, hp.z + 1.6], [hp.x, hp.y - 0.15, hp.z], 30, { t, shake: 0.01, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },

    { id: '06', dur: 1.2, frame: ({ u, d, t }) => {
      // the narrator hauls him up by the rope; he surfaces gasping
      const ben = barrel(t), up = t > P.barrel.tUp;
      ben.setPose(up ? 'arms_up' : 'hold'); eyes(ben, t, up ? 'wide' : 'shut', false); ben.face.set(null, up ? 'scream' : 'closed');
      const n = narr(deck(0.0, 7.9), Math.PI); idle(n, t);
      const h = Math.sin(t * 13) > 0; n.setPose(h ? 'haul_hi' : 'haul_lo'); n.spine.rotation.x += deg(15);
      eyes(n, t, 'angry'); n.face.set(null, 'talk3');
      const hand = world(n.armR, [0, -0.55, 0]), top = world(S.barrel, [0, 0.95, 0]);
      setRope(S.rope, [arr(hand), arr(top)]);
      const p = S.barrel.position;
      FX.splash2.update(t, P.barrel.tUp - 0.05, [p.x, W, p.z]);
      if (up) FX.drips.update(t, P.barrel.tUp, arr(headPos(ben)));
      shoot(st, [p.x + 3.6, 1.4, p.z - 1.6], [p.x - 0.2, 0.25, p.z + 0.4], 24, { t, shake: 0.015, aper: 1.5 });
      aimSun(sun, [p.x, 0, p.z], 12);
    } },

    { id: '07', dur: 1.6, frame: ({ u, d, t }) => {
      // Archimedes: the water pushes up with the weight of the water the block pushes aside (it spills into the cup)
      const A = S.archi, k = clamp((u - 0.1) / (d * 0.7)), top = 0.9; A.root.visible = true;
      const by = lerp(0.85, 0.2, eio(k));             // block centre height above the bench top
      A.block.position.set(-0.55, top + by, 0);
      const brim = 0.44, sub = clamp((brim + 0.01 - (by - 0.1)) / 0.2);   // fraction of the block under the brim level
      A.water.scale.y = brim; A.water.position.y = 0.01;
      const spilled = sub * 0.008;                      // m³: block 0.2³
      A.cupWater.scale.y = Math.max(0.001, spilled / (Math.PI * 0.1 ** 2)); A.cupWater.visible = spilled > 0;
      A.needle.rotation.z = -spilled / 0.008 * deg(120);
      const flowing = sub > 0.02 && sub < 0.99 && k < 0.99;
      A.stream.visible = flowing; if (flowing) { const sp = world(S.bench, [-0.2, top + 0.47, 0]), cp = world(S.bench, [0.35, top + 0.25, 0]); A.stream.position.copy(sp).add(cp).multiplyScalar(0.5); A.stream.scale.y = sp.distanceTo(cp); A.stream.lookAt(cp); A.stream.rotateX(Math.PI / 2); }
      const n = narr(arr(world(S.bench, [-1.15, 0, -0.55])), deg(60)); idle(n, t); n.setPose('stand'); n.arm('R', -150 + 40 * k, -10, 25); eyes(n, t, 'open'); n.face.set(null, 'smile'); n.head.rotation.x += deg(20);
      const hand = world(n.armR, [0, -0.55, 0]), bt = world(A.block, [0, 0.1, 0]); setRope(A.string, [arr(hand), arr(bt)]);
      const c = world(S.bench, [-0.1, top + 0.3, 0]);
      move(st, u / d, [[c.x + 0.5, c.y + 1.2, c.z + 2.3], [c.x, c.y - 0.1, c.z], 26], [[c.x + 0.35, c.y + 1.0, c.z + 1.95], [c.x, c.y - 0.15, c.z], 28], { t, shake: 0.008, aper: 3 });
      aimSun(sun, c, 6);
    } },

    { id: '08', dur: 1.2, frame: ({ u, d, t }) => {
      // underwater: weight (red, down) beats buoyancy (blue, up) for the barrel and its rock
      const ben = barrel(Math.min(t, P.barrel.tHaul - 0.01)); ben.setPose('hold'); eyes(ben, t, 'sad'); ben.face.set(null, 'flat');
      const p = S.barrel.position, g = back(clamp(u / 0.35), 1.6);
      S.arrowDown.visible = S.arrowUp.visible = true;
      S.arrowDown.position.set(p.x + 0.9, p.y + 1.6, p.z); S.arrowDown.rotation.set(0, 0, Math.PI); S.arrowDown.scale.set(1.3, 1.8 * g, 1.3);
      S.arrowUp.position.set(p.x - 0.9, p.y - 0.2, p.z); S.arrowUp.rotation.set(0, 0, 0); S.arrowUp.scale.set(1.3, 0.75 * back(clamp((u - 0.15) / 0.35), 1.6), 1.3);
      uw(t, { centre: [p.x, -3, p.z], fish: [p.x + 2.5, -4, p.z + 3], away: [] });
      shoot(st, [p.x - 2.2, LAKE.bed + 2.2, p.z - 4.0], [p.x, LAKE.bed + 1.3, p.z], 22, { t, aper: 0.8 });
      aimSun(sun, p, 10);
    } },

    { id: '09', dur: 1.3, frame: ({ u, d, t }) => {
      // Ben jumps off the jetty onto the beach ball to push it under
      const bp = P.ballAt(t); S.beach.visible = true; S.beach.position.set(...bp); S.beach.rotation.set(0, t * 0.3, 0.1 * Math.sin(t * 2));
      const b = P.benBall(t), ben = S.ben; ben.root.visible = true; ben.set(b.p, Math.PI + deg(20));
      ben.setPose(b.air ? 'cheer' : 'push'); if (!b.air && t < P.ball.tJump) { ben.setPose('fists'); }
      idle(ben, t); eyes(ben, t, b.air ? 'happy' : 'angry', false); ben.face.set(null, b.air ? 'grin' : 'talk3');
      if (t > P.ball.tOn) { ben.legL.rotation.x = deg(-40); ben.legR.rotation.x = deg(-40); }
      const n = narr(deck(-0.3, 9.6), deg(220)); n.setPose('hip'); idle(n, t); eyes(n, t, 'lazy'); n.face.set(null, 'flat');
      if (t > P.ball.tOn) FX.splash2.update(t, P.ball.tOn, [bp[0], W, bp[2]]);
      move(st, u / d, [[-9.5, 1.4, 10.5], [-2.2, 0.8, 7.2], 22], [[-9.0, 1.3, 9.6], [-2.6, 0.6, 6.8], 22], { t, shake: 0.012, aper: 1 });
      aimSun(sun, [-2, 0, 7], 16);
    } },

    { id: '10', dur: 1.3, frame: ({ u, d, t }) => {
      // the ball shoots back up (the water pushes up with ~500 kg) and launches him
      const bp = P.ballAt(t); S.beach.visible = true; S.beach.position.set(...bp); S.beach.rotation.set(0, t * 0.3, 0);
      const b = P.benBall(t), ben = S.ben, inWater = !b.air && t > P.ball.tUp;
      ben.root.visible = !inWater || t < b.splash + 0.15; ben.set(b.p, Math.PI + deg(20) + (t - P.ball.tUp) * 5);
      ben.setPose('arms_up'); flail(ben, t, { amp: 35, legs: 30 }); eyes(ben, t, 'wide', false); ben.face.set(null, 'scream'); talk(ben, t, 'ben', { shout: true, rest: 'scream' });
      FX.splash2.update(t, P.ball.tUp, [bp[0], W, bp[2]]);
      if (b.splash) { const sp = P.benBall(b.splash).p; FX.splash.update(t, b.splash, [sp[0], W, sp[2]]); FX.foam.update(t, b.splash, [sp[0], W, sp[2]]); }
      shoot(st, [bp[0] - 6.5, W + 0.3, bp[2] + 2.5], [bp[0] + 0.6, W + 1.6, bp[2] - 0.6], 20, { t, shake: 0.015, aper: 0.8 });
      aimSun(sun, bp, 14);
    } },

    { id: '11', dur: 1.5, frame: ({ u, d, t }) => {
      // heavier than the water it pushes aside sinks, lighter floats, the same hovers
      const D = S.sfh, k = u - 0.15; D.root.visible = true;
      const drop = (x, y) => [x, y, 0];
      const surf = 0.81, floor = 0.08, mid = 0.45;
      const rockY = k < 0 ? 1.05 : Math.max(floor, 1.05 - 0.5 * 9.8 * Math.min(k, 0.18) ** 2 - 1.2 * Math.max(0, k - 0.18));
      D.rock.position.set(...drop(-0.2, rockY));
      const ballY = k < 0 ? 1.05 : k < 0.12 ? 1.05 - 4.9 * k * k * 8 : surf + 0.035 + bob(k - 0.12, -0.12, 0, 9, 0.25);
      D.ball.position.set(...drop(0, ballY));
      const jarY = k < 0 ? 1.05 : mid + bob(Math.max(0, k - 0.05), 1.05 - mid, -1.5, 4.5, 0.55);
      D.jar.position.set(...drop(0.2, jarY));
      const n = narr(arr(world(S.bench, [0.85, 0, -0.75])), deg(-25)); idle(n, t); n.setPose('point'); n.arm('R', -60, -10, 30); eyes(n, t, 'open'); n.face.set(null, 'smile');
      const c = world(S.bench, [0, 0.9 + 0.45, 0]);
      move(st, u / d, [[c.x + 0.25, c.y + 0.35, c.z + 1.9], [c.x, c.y + 0.3, c.z], 28], [[c.x + 0.2, c.y + 0.3, c.z + 1.65], [c.x, c.y + 0.3, c.z], 30], { t, shake: 0.008, aper: 3 });
      aimSun(sun, c, 6);
    } },
  ];
}
