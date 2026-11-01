// Shots 25-36: the air cools and the balloon sinks onto the neighbour's garden, the sandwich, the late burner and the
// roof scrape, the tile in the pool, the useless steering wheel, wind layers.
import { deg, ss, eo, eio, back, clamp, lerp, noise1 } from '../lib/util.js';
import { idle, eyes, talk, flail, tremble, look, shake, jabber } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { ballistic } from '../lib/fx.js';
import { G, wind, WIND } from './physics.js';
import { RIG, ENV } from './balloon.js';
import { hold, eat, headPos, world, arr, move } from './rig.js';
import { balloonAt, benAboard, onValve, rimCentre, crown, envCentre } from './crew.js';

// the neighbour sunbathing on his lounger (head towards +z, face up, shades on); sit: 0 lying .. 1 sat bolt upright
export function neighLounging(S, t, sit = 0) {
  const n = S.neigh, L = S.lounger.position; n.root.visible = true;
  n.root.rotation.order = 'YXZ';
  n.root.position.set(L.x, lerp(0.2, 0.36, sit), L.z - lerp(0.39, 0.15, sit));
  n.root.rotation.set(deg(lerp(-62, -8, ss(sit))), Math.PI * (1 + 0.5 * ss(sit)), 0);   // sitting up, he swings round to face the pool
  n.setPose('stand'); n.legL.rotation.x = n.legR.rotation.x = deg(lerp(0, -80, ss(sit)));
  n.arm('L', lerp(-160, -40, sit), lerp(30, 25, sit)); n.arm('R', lerp(-160, -40, sit), lerp(-30, -25, sit));   // hands behind his head
  idle(n, t, { amp: 0.3 });
  S.shades.visible = true;
  return n;
}

// the sandwich after Ben drops it: free fall from F.sandwich.p0 with the basket's velocity; then on the neighbour's face
function sandwichAt(S, F, t) {
  const sw = F.sandwich, sd = S.sandwich; S.scene.add(sd); sd.visible = true;
  if (t < sw.tLand) {
    const a = t - sw.tDrop, p = ballistic(sw.p0, sw.v0, a);
    sd.position.set(...p); sd.rotation.set(a * 7, a * 3, a * 5);
  } else {
    const hp = headPos(S.neigh); sd.position.set(hp.x, hp.y + 0.24, hp.z); sd.rotation.set(-deg(62) + deg(90), Math.PI, 0);
  }
}

function tileAt(S, F, t) {
  const r = F.tile.pos(t), m = S.tiles[0]; m.visible = true;
  m.position.set(...r.p); m.rotation.set(0, 0, -r.rot);
  if (t > F.tile.tLand) m.visible = false;
}

export function shotsC(S, F, FX, st) {
  const sun = st?.sun;
  const at = (id, k) => F.T.start(id) + k * F.T.dur(id);

  return [
    { id: '25', dur: 1.3, frame: ({ u, d, t }) => {
      // burner off, Ben eats; the air inside cools and the balloon starts to sink
      const p = balloonAt(S, F, t);
      const b = benAboard(S, t, { rotY: deg(30) }); b.setPose('stand'); hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]); eat(b, t, 'R', 1.0);
      eyes(b, t, 'happy', false); b.arm('L', -15, 20);
      const c = rimCentre(S);
      move(st, u / d, [[c.x + 7, c.y + 3.5, c.z + 9], [c.x, c.y + 5.5, c.z], 22], [[c.x + 6, c.y + 2.2, c.z + 8], [c.x, c.y + 4.5, c.z], 22], { t, shake: 0.02, aper: 0.4 });
      aimSun(sun, [p[0], p[1] + 6, p[2]], 30);
    } },

    { id: '26', dur: 1.2, frame: ({ u, d, t }) => {
      // the gauge on the envelope: the air inside has cooled below the hover line (green)
      balloonAt(S, F, t);
      const gz = S.bal.gauge; gz.userData.needle.rotation.z = gz.userData.ang(F.temp(t) + 0.8 * Math.sin(t * 9));
      const c = world(gz, [0, 0, 0]), o = world(gz, [0, 0, 1]);
      const dx = o.x - c.x, dz = o.z - c.z;
      shoot(st, [c.x + dx * 4.2 + 0.6, c.y + 0.4 - 0.3 * u, c.z + dz * 4.2], [c.x, c.y - 0.3, c.z], 30, { t, shake: 0.01, aper: 3 });
      aimSun(sun, c, 10);
    } },

    { id: '27', dur: 1.4, frame: ({ u, d, t }) => {
      // sinking towards the neighbour's house; he's sunbathing by the pool
      const p = balloonAt(S, F, t);
      const b = benAboard(S, t, { rotY: deg(70) }); b.setPose('stand'); hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]); eat(b, t, 'R', 1.0);
      const n = neighLounging(S, t); eyes(n, t, 'shut', false); n.face.set(null, 'smile');
      const L = S.lounger.position;
      move(st, u / d, [[L.x + 3.5, 1.3, L.z + 10], [L.x - 4, 4.6, L.z], 20], [[L.x + 3, 1.1, L.z + 8.6], [L.x - 3.5, 5.2, L.z], 20], { t, shake: 0.01, aper: 0.4 });
      aimSun(sun, [L.x, 2, L.z], 30);
    } },

    { id: '28', dur: 0.9, frame: ({ u, d, t }) => {
      balloonAt(S, F, t);
      const b = benAboard(S, t, { rotY: deg(90) }), dropped = t >= F.sandwich.tDrop;
      b.setPose('stand'); b.arm('L', -150, 40); b.arm('R', dropped ? -170 : -90, -40);
      flail(b, t, { amp: 18, period: 0.22 }); eyes(b, t, 'wide', false); jabber(b, t, { rate: 9 });
      if (dropped) sandwichAt(S, F, t); else hold(b, S.sandwich, 'R', [0, -0.6, 0.08], [deg(90), 0, 0]);
      const hp = headPos(b);
      shoot(st, [hp.x + 1.6, hp.y + 0.15, hp.z + 0.9], [hp.x, hp.y - 0.3, hp.z], 28, { t, shake: 0.03, aper: 3, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '29', dur: 1.1, frame: ({ u, d, t }) => {
      balloonAt(S, F, t);
      const hit = t >= F.sandwich.tLand;
      const n = neighLounging(S, t); eyes(n, t, hit ? 'wide' : 'shut', false); n.face.set(null, hit ? 'o' : 'smile');
      if (hit) tremble(n, t, 0.6);
      sandwichAt(S, F, t);
      const hp = headPos(n);
      shoot(st, [hp.x + 1.7, hp.y + 1.3, hp.z + 1.4], [hp.x - 0.1, hp.y + 0.35 - 0.2 * u, hp.z - 0.3], 24, { t, shake: hit ? 0.02 : 0.008, aper: 2.5, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '30', dur: 1.2, frame: ({ u, d, t }) => {
      // Ben yanks the burner on: a big blast
      const on = t >= F.B.tOn;
      balloonAt(S, F, t, { burn: on ? 1.5 : 0 });
      const b = benAboard(S, t, { rotY: deg(-20) }); b.setPose('stand'); onValve(b, on ? 1 : clamp((t - F.B.tOn + 0.25) / 0.25));
      b.arm('L', -100, 30); eyes(b, t, on ? 'angry' : 'wide', false); b.face.set(null, on ? 'talk3' : 'o');
      if (on) b.mSkin.color.set('#ffb070');
      const c = rimCentre(S);
      move(st, u / d, [[c.x + 1.0, c.y + 0.6, c.z + 4.4], [c.x, c.y + 1.4, c.z], 22], [[c.x + 0.8, c.y + 0.3, c.z + 3.6], [c.x, c.y + 1.8, c.z], 22], { t, shake: on ? 0.03 : 0.01, aper: 2 });
      aimSun(sun, c, 12);
    } },

    { id: '31', dur: 1.5, frame: ({ u, d, t }) => {
      // the lag: still sinking, the basket drags across the ridge (tiles fly), then it climbs away
      const p = balloonAt(S, F, t, { burn: 1.2 });
      const b = benAboard(S, t, { rotY: deg(90) }); b.setPose('arms_up'); flail(b, t, { amp: 20 }); eyes(b, t, 'wide', false); b.face.set(null, 'scream');
      FX.tiles.update(t, F.B.tScrape, [S.ridge[0] + 0.3, 7.9, S.ridge[1]]);
      FX.dust.update(t, F.B.tScrape, [S.ridge[0], 7.9, S.ridge[1]]);
      tileAt(S, F, t);
      const kick = t > F.B.tScrape ? 0.12 * Math.exp(-(t - F.B.tScrape) * 6) * Math.sin((t - F.B.tScrape) * 50) : 0;
      shoot(st, [S.ridge[0] - 3, 6 + kick, S.ridge[1] + 19], [S.ridge[0] + 0.5, 9.5, S.ridge[1]], 20, { t, aper: 0.4 });
      aimSun(sun, [S.ridge[0], 6, 0], 30);
    } },

    { id: '32', dur: 1.5, frame: ({ u, d, t }) => {
      // the loose tile slides off the roof and splashes into the pool; the neighbour sits up, sandwich on his face
      balloonAt(S, F, t);
      tileAt(S, F, t);
      FX.splash.update(t, F.tile.tLand, F.tile.land);
      const n = neighLounging(S, t, ss((t - at('32', 0)) / 0.3)); eyes(n, t, 'angry', false); talk(n, t, 'neighbour', { shout: true, rest: 'frown' });
      n.arm('R', -150, -20); n.armR.rotation.x += deg(15 * Math.sin(t * 14));
      sandwichAt(S, F, t);
      const L = S.lounger.position, tl = F.tile.land;
      shoot(st, [L.x - 4.8, 1.9, L.z + 5.8], [L.x - 0.9, 0.75, L.z + 0.9], 22, { t, shake: 0.01, aper: 1 });
      aimSun(sun, [L.x, 1, L.z], 16);
    } },

    { id: '33', dur: 1.2, frame: ({ u, d, t }) => {
      // Ben turns a steering wheel he tied to the basket: the balloon doesn't care
      balloonAt(S, F, t);
      S.bal.wheel.visible = S.bal.wheelStick.visible = true; S.bal.wheel.rotation.z = Math.sin(t * 5) * 1.6;
      const b = benAboard(S, t, { z: 0.15 }); b.setPose('stand'); b.arm('L', -75, 12, 10 + 15 * Math.sin(t * 5)); b.arm('R', -75, -12, 10 - 15 * Math.sin(t * 5));
      eyes(b, t, 'angry'); b.face.set(null, 'frown'); b.spine.rotation.z += deg(8 * Math.sin(t * 5));
      const c = rimCentre(S);
      move(st, u / d, [[c.x + 2.0, c.y + 2.2, c.z + 3.8], [c.x, c.y + 0.4, c.z + 0.3], 24], [[c.x + 1.6, c.y + 1.7, c.z + 3.2], [c.x, c.y + 0.4, c.z + 0.3], 24], { t, shake: 0.012, aper: 2 });
      aimSun(sun, c, 10);
    } },

    { id: '34', dur: 0.9, frame: ({ u, d, t }) => {
      balloonAt(S, F, t);
      const b = benAboard(S, t, { z: 0.15 }); b.setPose('stand');
      const off = u > 0.25;
      const W = S.bal.wheel; W.visible = true; S.bal.wheelStick.visible = true;
      if (off) { b.armR.add(W); W.position.set(0.12, -0.62, 0.15); W.rotation.set(deg(70), 0, 0); }
      b.arm('L', off ? -110 : -75, 12, off ? 40 : 10); b.arm('R', off ? -110 : -75, -12, off ? 40 : 10);
      eyes(b, t, off ? 'sad' : 'angry', false); b.face.set(null, off ? 'flat' : 'frown');
      const hp = headPos(b);
      shoot(st, [hp.x + 0.5, hp.y - 0.15, hp.z + 1.7], [hp.x, hp.y - 0.4, hp.z], 30, { t, shake: 0.01, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 8);
    } },

    { id: '35', dur: 1.8, frame: ({ u, d, t }) => {
      // wind layers: low air blows one way, high air another; the balloon climbs from one into the other
      const p = balloonAt(S, F, t);
      layers(S, t, p);
      shoot(st, [p[0] - 22, 52, p[2] + 30], [p[0] + 3, 16, p[2] - 2], 24, { t, aper: 0.1 });
      aimSun(sun, [p[0], 10, p[2]], 80);
    } },

    { id: '36', dur: 1.4, frame: ({ u, d, t }) => {
      // into the high layer: the flags swing round, the drift turns towards grandma's
      const p = balloonAt(S, F, t);
      const v = F.vel(t), w = wind(p[1]), rel = Math.atan2(w[1] - v[2], w[0] - v[0]);
      S.bal.flags.forEach(f => { f.rotation.y = -rel; f.userData.cloth.rotation.y = 0.3 * Math.sin(t * 13); });
      const b = benAboard(S, t, { rotY: deg(-30) }); b.setPose('point'); b.arm('R', -100, -10); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const a = deg(lerp(10, 40, eio(u / d)));
      shoot(st, [p[0] - 22 * Math.sin(a), p[1] + 5, p[2] + 22 * Math.cos(a)], [p[0], p[1] + 6, p[2]], 22, { t, aper: 0.3 });
      aimSun(sun, [p[0], p[1], p[2]], 40);
    } },
  ];
}

// the wind-layer diagram: orange arrows low (→), blue arrows high (towards grandma's), streaming
function layers(S, t, p) {
  const lo = WIND.lo, hi = WIND.hi;
  const place = (list, y0, dir, spd) => list.forEach((a, i) => {
    a.visible = true;
    const yaw = Math.atan2(-dir[1], dir[0]), L = 70, s = ((i / list.length) * L + t * spd * 3) % L - L / 2;
    a.position.set(p[0] + dir[0] / Math.hypot(...dir) * s + (i % 2) * 2, y0 + (i % 3) * 3, p[2] + dir[1] / Math.hypot(...dir) * s);
    a.rotation.set(0, yaw, 0); a.scale.setScalar(3.2);
  });
  place(S.arrowsLo, 11, lo, Math.hypot(...lo));
  place(S.arrowsHi, 32, hi, Math.hypot(...hi));
}
