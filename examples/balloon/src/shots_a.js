// Shots 01-12: the plastic bag over the campfire flies, why hot air is lighter, the bag lifts a cookie but not Ben,
// and how many cubic metres Ben needs.
import { deg, ss, eo, eio, back, clamp, lerp, noise1 } from '../lib/util.js';
import { idle, eyes, look, tremble, nod, talk, bounce, shake, flail } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { setRope } from '../lib/util.js';
import { YARD } from './set.js';
import { RIG, ENV, poseBag } from './balloon.js';
import { showCubes, moveMolecules } from './props.js';
import { walk, hold, eat, hop, headPos, local, world, arr, move, mix } from './rig.js';

const FIRE = YARD.fire;
const NARR_FIRE = [FIRE[0] + 1.0, 0, FIRE[2]];           // holding the bag over the fire, facing -x, leaning in
const BEN_FIRE = [FIRE[0] - 0.9, 0, FIRE[2] - 1.3];      // across the fire, facing it (+z)

export function shotsA(S, F, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => F.T.start(id) + k * F.T.dur(id);

  // the narrator holding the bag mouth over the fire; let go at F.bag.tRel
  const narrFire = (t, o = {}) => {
    const n = S.narr; n.root.visible = true; n.set(o.pos ?? NARR_FIRE, -Math.PI / 2);
    const rel = clamp((t - F.bag.tRel) / 0.18);
    n.arm('L', lerp(-96, -55, rel), lerp(14, 60, rel)); n.arm('R', lerp(-96, -55, rel), lerp(-14, -60, rel));
    n.spine.rotation.x += deg(-16 * (1 - rel));
    idle(n, t, { amp: 0.6 });
    return n;
  };
  const bagAt = (t, fill = 1) => {
    const b = S.bag; poseBag(b, fill, t);
    const p = F.bag.pos(t), vy = F.bag.vy(t);
    b.position.set(...p); b.rotation.set(deg(4 * noise1(t * 2, 1)), t * 0.4, deg(5 * noise1(t * 1.7, 2) - vy * 3));
    return b;
  };
  const fillAt = t => (t < at('01', 0) ? 0.15 : t < F.bag.tRel ? 0.15 + 0.85 * ss((t - at('01', 0.1)) / (F.bag.tRel - 0.25 - at('01', 0.1))) : 1);
  const fireFx = t => { FX.embers.update(t, 0, [FIRE[0], 0.2, FIRE[2]]); FX.smoke.update(t, Math.floor(t / 2.4) * 2.4 - 0.01, [FIRE[0], 0.6, FIRE[2]]); };
  const benSand = (t, pos, rotY) => {
    const b = S.ben; b.root.visible = true; b.set(pos, rotY);
    hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]);
    return b;
  };
  // Ben's walk from beside the fire to where the bag comes down (shot 08)
  const benUnderBag = t => {
    const a = at('08', 0), b = at('08', 0.85), k = ss((t - a) / (b - a));
    const end = [F.bag.land[0], 0, F.bag.land[2]];
    return { pos: mix(BEN_FIRE, end, k), k, moving: t > a && t < b };
  };

  return [
    { id: '01', dur: 1.3, frame: ({ u, d, t }) => {
      const n = narrFire(t); eyes(n, t, 'open'); n.face.set(null, 'smile'); n.head.rotation.x += deg(15);
      bagAt(t, fillAt(t));
      const b = benSand(t, BEN_FIRE, deg(8)); idle(b, t); eyes(b, t, 'open'); eat(b, t, 'R', 1.0);
      b.head.rotation.y += deg(-20);
      fireFx(t);
      move(st, u / d, [[-0.4, 3.4, 12.0], [FIRE[0] + 0.4, 1.0, FIRE[2] - 0.3], 22], [[-1.6, 2.2, 8.6], [FIRE[0] + 0.3, 1.2, FIRE[2] - 0.3], 24], { t, shake: 0.02, aper: 2, ease: eo });
      aimSun(sun, FIRE, 16);
    } },

    { id: '02', dur: 1.0, frame: ({ u, d, t }) => {
      const n = narrFire(t); eyes(n, t, t > F.bag.tRel ? 'wide' : 'open'); n.face.set(null, t > F.bag.tRel ? 'o' : 'smile'); n.head.rotation.x += deg(lerp(18, -20, ss((t - F.bag.tRel) / 0.3)));
      bagAt(t, fillAt(t));
      const b = benSand(t, BEN_FIRE, deg(8)); idle(b, t); eyes(b, t, 'open'); b.setPose('stand'); b.arm('R', -60, -20);
      b.head.rotation.x += deg(-10 * ss((t - F.bag.tRel) / 0.3));
      fireFx(t);
      move(st, u / d, [[FIRE[0] - 2.4, 0.55, FIRE[2] + 2.9], [FIRE[0] + 0.3, 1.4, FIRE[2]], 24], [[FIRE[0] - 2.1, 0.5, FIRE[2] + 2.5], [FIRE[0] + 0.3, 1.7, FIRE[2]], 26], { t, shake: 0.015, aper: 3 });
      aimSun(sun, FIRE, 10);
    } },

    { id: '03', dur: 1.2, frame: ({ u, d, t }) => {
      const n = narrFire(t); eyes(n, t, 'wide', false); n.face.set(null, 'grin'); n.head.rotation.x += deg(-35);
      n.setPose('cheer'); n.armR.rotation.z += deg(20 * Math.sin(t * 9));
      const bag = bagAt(t);
      const b = benSand(t, BEN_FIRE, deg(8)); idle(b, t); eyes(b, t, 'wide', false); b.face.set(null, 'o');
      b.arm('R', -50, -25);
      const bp = bag.position;
      b.head.rotation.x += deg(-clamp(Math.atan2(bp.y - 1.4, 1.5) * 57, 0, 50));
      fireFx(t);
      shoot(st, [FIRE[0] - 3.4, 0.4, FIRE[2] + 2.6], [lerp(FIRE[0] + 0.2, bp.x, 0.8), lerp(1.4, bp.y + 0.3, 0.85), FIRE[2]], 20, { t, shake: 0.015, aper: 1.5 });
      aimSun(sun, FIRE, 14);
    } },

    { id: '04', dur: 1.4, frame: ({ u, d, t }) => {
      const n = narrFire(t); eyes(n, t, 'happy', false); n.face.set(null, 'grin'); n.head.rotation.x += deg(-45); n.setPose('cheer');
      const bag = bagAt(t);
      const b = benSand(t, BEN_FIRE, deg(8)); idle(b, t); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      b.setPose('arms_up'); bounce(b, t, { height: 0.08 }); b.head.rotation.x += deg(-40);
      hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]);
      fireFx(t);
      FX.confetti.update(t, at('04', 0.3), [bag.position.x, bag.position.y + 0.6, bag.position.z]);
      const bp = bag.position;
      move(st, u / d, [[bp.x + 2.0, 1.2, bp.z + 6.4], [bp.x - 0.6, bp.y - 1.5, FIRE[2] - 0.5], 20], [[bp.x + 1.8, 1.1, bp.z + 5.6], [bp.x - 0.6, bp.y - 1.2, FIRE[2] - 0.5], 20], { t, shake: 0.01, aper: 1, ease: eo });
      aimSun(sun, FIRE, 16);
    } },

    { id: '05', dur: 0.9, frame: ({ u, d, t }) => {
      const b = benSand(t, BEN_FIRE, -deg(52)); idle(b, t); eyes(b, t, 'wide', false); b.face.set(null, 'o'); talk(b, t, 'ben', { rest: 'o' });
      b.arm('R', -75, -30, 20); b.arm('L', -20, 30);
      hop(b, t, at('05', 0.15), 0.45, 0.22, 1);
      b.head.rotation.x += deg(-28); b.head.rotation.y += deg(-12);
      fireFx(t);
      const hp = headPos(b);
      shoot(st, [hp.x - 1.6, hp.y - 0.45, hp.z + 1.25], [hp.x + 0.05, hp.y + 0.1, hp.z], 32, { t, shake: 0.012, aper: 5, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },

    { id: '06', dur: 1.6, frame: ({ u, d, t }) => {
      // hot air is lighter: the balance tips, the hot box rises (damped swing)
      const U = S.balance.userData, k = t - at('06', 0.15);
      const th = k < 0 ? 0 : deg(17) * (1 - Math.exp(-3.2 * k) * Math.cos(7.5 * k));
      balance(S, th);
      const c = world(S.balance, [0, 0.55, 0]);
      move(st, u / d, [[c.x + 0.8, c.y + 0.75, c.z + 3.3], arr(c), 26], [[c.x + 0.45, c.y + 0.45, c.z + 2.6], [c.x, c.y - 0.05, c.z], 28], { t, shake: 0.008, aper: 3 });
      aimSun(sun, c, 6);
    } },

    { id: '07', dur: 1.1, frame: ({ u, d, t }) => {
      balance(S, deg(17));
      const hot = S.balance.userData.pans[1].userData.boxG;
      const esc = clamp((u / d) * 0.6);
      moveMoleculesHot(S, t, esc);
      const c = world(hot, [0, 0, 0]);
      shoot(st, [c.x + 0.25, c.y + 0.05 + 0.08 * u, c.z + 1.25], [c.x, c.y - 0.22, c.z], 30, { t, shake: 0.006, aper: 4 });
      aimSun(sun, c, 4);
    } },

    { id: '08', dur: 1.2, frame: ({ u, d, t }) => {
      const bag = bagAt(t);
      const w = benUnderBag(t), b = benSand(t, w.pos, Math.PI * 0.7); idle(b, t); eyes(b, t, 'open'); b.face.set(null, 'o');
      b.setPose('hold'); b.arm('L', -150, 20); b.arm('R', -150, -20);   // arms up, ready to catch
      if (w.moving) walk(b, t * 11, 0.7);
      b.head.rotation.x += deg(-45);
      const n = S.narr; n.root.visible = true; n.set([FIRE[0] + 1.2, 0, FIRE[2] - 1.4], deg(-20)); idle(n, t); n.setPose('hip'); eyes(n, t, 'open'); n.head.rotation.x += deg(-30);
      fireFx(t);
      const bp = bag.position;
      shoot(st, [bp.x + 3.6, 0.7, bp.z - 2.6], [bp.x - 0.5, lerp(2.4, 1.8, u / d), bp.z + 0.3], 22, { t, shake: 0.012, aper: 1.5 });
      aimSun(sun, bp, 12);
    } },

    { id: '09', dur: 0.9, frame: ({ u, d, t }) => {
      const p = [F.bag.land[0], 0, F.bag.land[2]];
      const b = benSand(t, p, Math.PI * 0.7); idle(b, t, { amp: 0.2 });
      const on = t >= F.bag.tLand;
      b.setPose('hold'); b.arm('L', on ? -90 : -150, on ? 60 : 20); b.arm('R', on ? -90 : -150, on ? -60 : -20);
      if (on) tremble(b, t, 0.4);
      eyes(b, t, on ? 'shut' : 'wide', false); b.face.set(null, on ? 'flat' : 'o'); b.head.rotation.x += deg(on ? 0 : -40);
      // the bag drapes over his head, deflating a little
      const bag = S.bag, hp = world(b.head, [0, 0.25, 0]);
      const k9 = ss((t - F.bag.tLand) / 0.25), fill = on ? lerp(1, 0.8, k9) : 1;
      poseBag(bag, fill, t);
      bag.position.set(...(on ? [hp.x, hp.y - 0.12 - 0.42 * k9, hp.z] : F.bag.pos(t))); bag.rotation.set(0, 0, on ? deg(8) : 0);
      bag.scale.setScalar(on ? lerp(1, 1.45, k9) : 1);
      move(st, u / d, [[p[0] + 2.8, 1.1, p[2] - 1.6], [p[0], 1.3, p[2]], 28], [[p[0] + 2.4, 1.2, p[2] - 1.35], [p[0], 1.35, p[2]], 30], { t, shake: 0.01, aper: 3 });
      aimSun(sun, p, 8);
    } },

    { id: '10', dur: 1.3, frame: ({ u, d, t }) => {
      // the bag (hot again) lifts a cookie off the table: 15 g of lift against a 15 g cookie, slowly
      balance(S, deg(17));
      const tl = world(S.table, [0.78, YARD.tableH + 0.012, 0.2]), k = t - at('10', 0.3);
      const up = k > 0 ? 0.9 * (k - (1 - Math.exp(-4 * k)) / 4) : 0;
      S.cookie.visible = true; S.cookie.position.set(tl.x, tl.y + up, tl.z); S.cookie.rotation.set(deg(6 * Math.sin(t * 3)) * (k > 0), 0, 0);
      const bag = S.bag; poseBag(bag, 1, t); bag.position.set(tl.x, tl.y + up + 0.45, tl.z); bag.rotation.set(0, t * 0.5, deg(3 * Math.sin(t * 2.3)));
      const str = bag.userData.string; setRope(str, [[tl.x, tl.y + up + 0.02, tl.z], [tl.x, tl.y + up + 0.45, tl.z]]);
      const n = S.narr; n.root.visible = true; const np = world(S.table, [1.1, 0, -0.95]);
      n.set([np.x, 0, np.z], deg(-40)); idle(n, t); eyes(n, t, 'happy', false); n.face.set(null, 'grin');
      n.arm('R', -75, -15, 20); n.arm('L', -10, 15); n.head.rotation.x += deg(-20 * clamp(k));
      move(st, u / d, [[tl.x + 0.3, tl.y + 0.15, tl.z + 2.2], [tl.x - 0.1, tl.y + 0.35, tl.z], 30], [[tl.x + 0.35, tl.y + 0.3, tl.z + 2.0], [tl.x - 0.05, tl.y + 0.65, tl.z], 30], { t, shake: 0.008, aper: 3 });
      aimSun(sun, tl, 6);
    } },

    { id: '11', dur: 1.2, frame: ({ u, d, t }) => {
      // tied to Ben's belt: no chance. He hops; the string goes slack and taut, the bag tugs feebly
      const p = [-0.6, 0, 5.2], b = S.ben; b.root.visible = true; b.set(p, Math.PI * 0.85);
      idle(b, t); b.setPose('fists');
      const y = hop(b, t, at('11', 0.12), 0.42, 0.3, 2);
      eyes(b, t, y > 0.02 ? 'angry' : 'open', y <= 0.02); b.face.set(null, y > 0.02 ? 'talk3' : 'frown'); talk(b, t, 'ben', { shout: true });
      b.head.rotation.x += deg(-25);
      const belt = local(b, [0.15, 0.62, 0.12]);
      const bag = S.bag; poseBag(bag, 1, t);
      const top = [belt.x + 0.25 + 0.05 * Math.sin(t * 5), Math.max(belt.y + 1.15, 1.95 + 0.06 * Math.sin(t * 6)), belt.z - 0.1];
      bag.position.set(...top); bag.rotation.set(0, t * 0.6, deg(10));
      setRope(bag.userData.string, [arr(belt), top]);
      S.narr.root.visible = true; S.narr.set([1.4, 0, 3.2], -deg(60)); idle(S.narr, t); S.narr.setPose('hip'); eyes(S.narr, t, 'lazy');
      S.narr.face.set(null, 'flat');
      move(st, u / d, [[p[0] + 2.4, 1.0, p[2] + 4.6], [p[0] + 0.3, 1.25, p[2]], 24], [[p[0] + 2.0, 0.95, p[2] + 4.0], [p[0] + 0.3, 1.3, p[2]], 24], { t, shake: 0.012, aper: 2 });
      aimSun(sun, p, 10);
    } },

    { id: '12', dur: 1.3, frame: ({ u, d, t }) => {
      // one cubic metre of hot air lifts about a quarter kilo: Ben's sandwich floats off under a glowing cube
      const b = S.ben; b.root.visible = true; b.set([-5.2, 0, 3.4], deg(110)); idle(b, t);
      const k = t - at('12', 0.25), rise = k > 0 ? 0.9 * (k - (1 - Math.exp(-4 * k)) / 4) : 0;
      const hand = local(b, [-0.05, 0.62, 0.62]);
      const sp = [hand.x, hand.y + rise, hand.z];
      S.sandwich.visible = true; S.scene.add(S.sandwich); S.sandwich.position.set(...sp); S.sandwich.rotation.set(0, t * 0.6, deg(6 * Math.sin(t * 4)) * (k > 0));
      const c = S.oneCube; c.visible = true; c.position.set(sp[0], sp[1] + 1.2, sp[2]); c.rotation.set(0, t * 0.6, 0);
      c.scale.setScalar(back(clamp((u - 0.05) / 0.25), 2));
      setRope(S.bag.userData.string, [[sp[0], sp[1] + 0.12, sp[2]], [sp[0], sp[1] + 0.7, sp[2]]]);
      b.setPose('stand'); b.arm('R', k > 0 ? -150 + 20 * Math.sin(t * 12) : -75, -15, 15); b.arm('L', -30, 20);
      if (k > 0.25) hop(b, t, at('12', 0.25) + 0.25, 0.4, 0.25, 2);
      eyes(b, t, k > 0 ? 'wide' : 'open', k <= 0); b.face.set(null, k > 0 ? 'o' : 'smile'); b.head.rotation.x += deg(-35 * clamp(k * 2));
      move(st, u / d, [[-8.6, 0.55, 0.2], [-4.8, 2.0, 3.4], 24], [[-8.3, 0.5, 0.6], [-4.8, 2.7, 3.4], 24], { t, shake: 0.012, aper: 2 });
      aimSun(sun, [-5, 1, 3], 10);
    } },

    { id: '12b', dur: 1.6, frame: ({ u, d, t }) => {
      // each cubic metre of hot air lifts about a quarter of a kilo; Ben + basket + burner + envelope need ~600 of them
      const o = [0, RIG.mouth, 0], k = clamp((u - 0.12) / (d * 0.72));
      const total = S.cubes.list.length;
      showCubes(S, total * eio(k), o);
      const gh = S.bal.ghost; gh.visible = true; gh.position.set(...o); gh.rotation.set(0, 0, 0);
      const b = S.ben; b.root.visible = true; b.set([-5.2, 0, 3.4], deg(110)); idle(b, t); eyes(b, t, 'wide', false); b.face.set(null, 'o');
      b.head.rotation.x += deg(-10 - 30 * k); b.setPose('stand'); b.arm('R', -20, -20);
      hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]);
      const n = S.narr; n.root.visible = true; n.set([-3.6, 0, 5.4], deg(150)); idle(n, t); n.setPose('point'); n.arm('R', -140, -10); eyes(n, t, 'open'); n.face.set(null, 'grin'); n.head.rotation.x += deg(-30);
      move(st, u / d, [[-3.5, 2.8, 13.5], [-2.5, 4.0, 2], 24], [[3.5, 4.0, 25], [-1.5, 7.4, 0], 24], { t, shake: 0.01, aper: 1, ease: eo });
      aimSun(sun, [0, 4, 0], 30);
    } },
  ];
}

// balance beam at angle th (hot side up): pans hang plumb from the beam ends
function balance(S, th) {
  const U = S.balance.userData;
  U.beam.rotation.z = th;
  U.pans.forEach(p => {
    const s = p.userData.side;
    p.position.set(0.78 * s * Math.cos(th), 0.95 + 0.78 * s * Math.sin(th), 0);
  });
}
function moveMoleculesHot(S, t, esc) { moveMolecules(S.molHot, t, 0.5, esc); }
