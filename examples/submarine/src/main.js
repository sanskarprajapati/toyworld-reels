// Submarine reel: one Three.js scene, every frame a pure function of t (window.render). Shot lengths come from
// timing.json (written by voice/build_voice.py) when present, else the storyboard durations.
// Underwater look: once the shot has placed the camera, a camera below the surface switches on blue-green fog and a tinted sky.
import * as THREE from 'three';
import { makeStage, timeline } from '../lib/stage.js';
import { loadAssets, sky, island } from '../lib/world.js';
import { Character } from '../lib/character.js';
import { VOICE } from '../lib/acting.js';
import { confetti, puff, Particles, hideParticles, aimBillboards, ALL } from '../lib/fx.js';
import { buildSet, resetSet, LAKE } from './set.js';
import { buildSub, buildBarrel, buildBeachBall } from './sub.js';
import { buildProps, resetProps, TRANSP } from './props.js';
import { makePhysics } from './physics.js';
import { shotsA } from './shots_a.js';
import { shotsB } from './shots_b.js';
import { shotsC } from './shots_c.js';
import { shotsD } from './shots_d.js';

const getJSON = async p => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const Q = new URLSearchParams(location.search);

const st = makeStage({ ssaa: +(Q.get('ssaa') ?? 2) });
st.renderer.localClippingEnabled = true;
const assets = await loadAssets(st.renderer);
st.sun = sky(st.scene, assets);
island(st.scene, assets, { z0: -LAKE.edge, z1: LAKE.edge });

const timing = (await getJSON('timing.json')) ?? (await getJSON('durations.json')) ?? {};
const voice = await getJSON('voice/timeline.json');
const env = await getJSON('voice/visemes.json');
if (voice && env) { VOICE.lines = voice.lines; VOICE.env = env; }

const mk = (S, P, FX) => [...shotsA(S, P, FX, st), ...shotsB(S, P, FX, st), ...shotsC(S, P, FX, st), ...shotsD(S, P, FX, st)];
let T = timeline(mk(null, null, null), timing);
const P = makePhysics(T);
const S = buildSet(st.scene, assets, Character);
S.sub = buildSub(st.scene); S.barrel = buildBarrel(st.scene); S.beach = buildBeachBall(st.scene);
buildProps(S, st.scene);

const cam = st.camera;
const drops = (n, seed, o = {}) => new Particles(st.scene, n, new THREE.SphereGeometry(0.03, 8, 6).scale(1, 1.6, 1),
  new THREE.MeshStandardMaterial({ color: '#e6f6fa', roughness: 0.08, transparent: true, opacity: 0.8 }), (i, r) => {
    const a = r() * Math.PI * 2, s = (o.spread ?? 1) * (0.8 + r() * 2.4), up = (o.up ?? 1) * (2.5 + r() * 3.5);
    return { delay: r() * 0.06, p: [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], v: [Math.cos(a) * s, up, Math.sin(a) * s], size: 0.6 + r() * 1.5, life: 1.6, spin: [0, 0, 0] };
  }, { seed, floor: LAKE.water, grow: u => 1 - u ** 3 });
const FX = {
  confetti: confetti(st.scene, 200),
  splash: drops(160, 41), splash2: drops(120, 42, { spread: 1.4, up: 0.8 }), splash3: drops(200, 43, { spread: 1.8, up: 1.4 }),
  foam: puff(st.scene, 30, '#ffffff', 16, { spread: 1.6, up: 0.4, size: 0.6, life: 1.4, opacity: 0.85, camera: cam }),
  sand: puff(st.scene, 36, '#d9c48f', 12, { spread: 2.2, up: 0.8, size: 0.7, life: 2.0, opacity: 0.85, camera: cam }),
  sparks: new Particles(st.scene, 50, new THREE.BoxGeometry(0.02, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }), (i, r) => {
    const a = r() * Math.PI * 2; return { delay: r() * 1.2, p: [0, 0, 0], v: [Math.cos(a) * (1 + r() * 2), 1 + r() * 2.5, Math.sin(a) * (1 + r() * 2)], size: 1, life: 0.4, spin: [r() * 20, r() * 20, 0] };
  }, { seed: 9, grow: u => 1 - u }),
  drips: new Particles(st.scene, 30, new THREE.SphereGeometry(0.025, 8, 6).scale(1, 1.5, 1), new THREE.MeshStandardMaterial({ color: '#cfeaf2', roughness: 0.1, transparent: true, opacity: 0.85 }), (i, r) => ({
    delay: i * 0.05, p: [(r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3], v: [(r() - 0.5) * 0.4, 0.2, (r() - 0.5) * 0.4], size: 1, life: 0.6, spin: [0, 0, 0] }), { seed: 46 }),
};
T = timeline(mk(S, P, FX), timing);

// underwater switch, after the camera is placed
const SKY_BG = st.scene.background, FOG = new THREE.FogExp2('#1b7a84', 0.075), WATER_BG = new THREE.Color('#1b7a84');
function medium() {
  const under = cam.position.y < LAKE.water;
  st.scene.fog = under ? FOG : null;
  st.scene.background = under ? WATER_BG : SKY_BG;
  st.scene.environmentIntensity = under ? 0.45 : 0.75;
  st.sun.intensity = under ? 1.4 : 2.6;
  st.post.vig.uniforms.warm.value = under ? -0.1 : 0.15;
  S.water.material.opacity = S.waterAlpha ?? (under ? 0.55 : 0.9);
}

window.DUR = Q.get('dur') ? +Q.get('dur') : T.total;
window.SHOT_AT = t => T.at(t).id;
window.render = t => {
  const s = T.at(t), u = t - s.start;
  hideParticles();
  resetSet(S, t); resetProps(S, t);
  S.sub.visible = S.barrel.visible = S.beach.visible = false;
  s.frame({ u, d: s.d, k: u / s.d, t, T, st });
  medium();
  aimBillboards();
  st.post.dof.aoSkip = [...ALL.filter(p => p.mesh.material.transparent).map(p => p.mesh), ...TRANSP, S.water];
  st.post.composer.render();
};
window.READY = true;
window.TIMELINE = T.list.map(s => ({ id: s.id, start: +s.start.toFixed(3), dur: +s.d.toFixed(3) }));
window.PHYS = { S: P.S, vals: P.subVals, barrel: P.barrel };
