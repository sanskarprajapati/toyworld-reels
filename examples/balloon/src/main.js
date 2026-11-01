// Hot-air balloon reel: one Three.js scene, every frame a pure function of t (window.render). Shot lengths come from
// timing.json (written by voice/build_voice.py) when present, else the storyboard durations.
import * as THREE from 'three';
import { makeStage, timeline, install } from '../lib/stage.js';
import { loadAssets, sky, island } from '../lib/world.js';
import { Character } from '../lib/character.js';
import { VOICE } from '../lib/acting.js';
import { confetti, puff, Particles } from '../lib/fx.js';
import { buildSet, resetSet, YARD } from './set.js';
import { makeFlight, makeBag } from './physics.js';
import { shotsA } from './shots_a.js';
import { shotsB } from './shots_b.js';
import { shotsC } from './shots_c.js';
import { shotsD } from './shots_d.js';

const getJSON = async p => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const Q = new URLSearchParams(location.search);

const st = makeStage({ ssaa: +(Q.get('ssaa') ?? 2) });
const assets = await loadAssets(st.renderer);
st.sun = sky(st.scene, assets);
island(st.scene, assets);

const timing = (await getJSON('timing.json')) ?? (await getJSON('durations.json')) ?? {};
const voice = await getJSON('voice/timeline.json');
const env = await getJSON('voice/visemes.json');
if (voice && env) { VOICE.lines = voice.lines; VOICE.env = env; }

const mk = (S, F, FX) => [...shotsA(S, F, FX, st), ...shotsB(S, F, FX, st), ...shotsC(S, F, FX, st), ...shotsD(S, F, FX, st)];
let T = timeline(mk(null, null, null), timing);
const F = makeFlight(T);
F.T = T;
F.bag = makeBag(T, YARD.fire);
const S = buildSet(st.scene, assets, Character, F);

const cam = st.camera;
const drops = (n, seed, o = {}) => new Particles(st.scene, n, new THREE.SphereGeometry(0.022, 8, 6).scale(1, 1.6, 1),
  new THREE.MeshStandardMaterial({ color: '#e6f6fa', roughness: 0.08, transparent: true, opacity: 0.75 }), (i, r) => {
    const a = r() * Math.PI * 2, s = (o.spread ?? 1) * (0.8 + r() * 2.2), up = (o.up ?? 1) * (2.5 + r() * 3);
    return { delay: r() * 0.06, p: [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], v: [Math.cos(a) * s, up, Math.sin(a) * s], size: 0.6 + r() * 1.4, life: 1.2, spin: [0, 0, 0] };
  }, { seed, floor: o.floor ?? 0.2, grow: u => 1 - u ** 3 });
const FX = {
  confetti: confetti(st.scene, 220),
  dust: puff(st.scene, 26, '#e6dccb', 12, { spread: 2.6, up: 0.8, size: 0.5, life: 1.2, opacity: 0.75, camera: cam }),
  bigdust: puff(st.scene, 40, '#d9ceb8', 15, { spread: 4, up: 1.2, size: 0.8, life: 1.6, opacity: 0.8, camera: cam }),
  smoke: puff(st.scene, 60, '#9aa0a6', 19, { spread: 0.2, up: 1.6, size: 0.35, life: 2.4, opacity: 0.45, camera: cam }),
  heat: puff(st.scene, 50, '#ffffff', 23, { spread: 0.6, up: 2.2, size: 0.9, life: 1.6, opacity: 0.22, camera: cam }),
  splash: drops(90, 41, { spread: 0.8, up: 0.8, floor: 0.22 }),
  embers: new Particles(st.scene, 50, new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffb347', toneMapped: false }), (i, r) => ({
    delay: i * 0.09, p: [(r() - 0.5) * 0.4, 0.2, (r() - 0.5) * 0.4], v: [(r() - 0.5) * 0.6, 1.2 + r() * 1.4, (r() - 0.5) * 0.6], size: 0.6 + r(), life: 1.4, spin: [0, 0, 0], g: -0.4 }), { seed: 47 }),
  tiles: new Particles(st.scene, 14, new THREE.BoxGeometry(0.3, 0.03, 0.4), new THREE.MeshStandardMaterial({ color: '#d9603b', roughness: 0.7 }), (i, r) => {
    const a = (r() - 0.5) * 2.4;
    return { delay: r() * 0.15, p: [(r() - 0.5) * 1.2, 0, (r() - 0.5) * 1.6], v: [1.5 + r() * 2.5, 1.5 + r() * 2.5, Math.sin(a) * 2], size: 1, life: 2.2, spin: [r() * 12, r() * 8, r() * 10] };
  }, { seed: 48, floor: 0.05 }),
  turf: new Particles(st.scene, 40, new THREE.BoxGeometry(0.12, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: '#4d8a32', roughness: 0.9 }), (i, r) => {
    const a = (r() - 0.5) * 2;
    return { delay: r() * 0.9, p: [0, 0, 0], v: [Math.cos(a) * (1 + r() * 2), 1 + r() * 2.5, Math.sin(a) * (1 + r() * 2)], size: 0.6 + r(), life: 1.1, spin: [r() * 15, r() * 15, 0], color: i % 3 ? '#4d8a32' : '#6b4a2e' };
  }, { seed: 49, floor: 0.03 }),
  wind: new Particles(st.scene, 60, new THREE.BoxGeometry(0.6, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }), (i, r) => ({
    delay: i * 0.01, p: [0, (r() - 0.5) * 1.2, (r() - 0.5) * 1.2], v: [3.5 + r() * 2, 0, -1.5 - r()], size: 1, life: 0.6, spin: [0, Math.atan2(2, 4.5), 0], g: 0 }), { seed: 50 }),
};
FX.smoke.parts.forEach((q, i) => { q.delay = i * 0.07; });
FX.heat.parts.forEach((q, i) => { q.delay = i * 0.04; });

T = timeline(mk(S, F, FX), timing);
install(st, T, t => resetSet(S, t), { dur: Q.get('dur') ? +Q.get('dur') : undefined });
window.TIMELINE = T.list.map(s => ({ id: s.id, start: +s.start.toFixed(3), dur: +s.d.toFixed(3) }));
window.PHYS = { B: F.B, vals: F.vals, landing: F.landing, stop: F.stop, sandwich: F.sandwich, bag: { tRel: F.bag.tRel, tLand: F.bag.tLand, sink: F.bag.vals.sink } };
