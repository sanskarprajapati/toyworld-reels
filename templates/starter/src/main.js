// Starter film: one Three.js scene, every frame a pure function of t (window.render). Shot lengths come from
// timing.json (written by `tw voice <film> timing`) when present, else durations.json (the storyboard).
import * as THREE from 'three';
import { makeStage, timeline, install } from '../lib/stage.js';
import { loadAssets, sky, island } from '../lib/world.js';
import { Character } from '../lib/character.js';
import { VOICE } from '../lib/acting.js';
import { confetti } from '../lib/fx.js';
import { buildSet, resetSet } from './set.js';
import { makePhysics } from './physics.js';
import { shots } from './shots.js';

const getJSON = async p => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const Q = new URLSearchParams(location.search);

const st = makeStage({ ssaa: +(Q.get('ssaa') ?? 2) });
const assets = await loadAssets(st.renderer);
st.sun = sky(st.scene, assets);
island(st.scene, assets);

const timing = (await getJSON('timing.json')) ?? (await getJSON('durations.json')) ?? {};
const voice = await getJSON('voice/timeline.json');
const env = await getJSON('voice/visemes.json');
if (voice && env) { VOICE.lines = voice.lines; VOICE.env = env; }   // lip sync from the recorded lines

// build the timeline once for its start times, solve the physics against it, then build the real shots
let T = timeline(shots(null, null, null, st), timing);
const P = makePhysics(T);
const S = buildSet(st.scene, assets, Character);
const FX = { confetti: confetti(st.scene) };
T = timeline(shots(S, P, FX, st), timing);

install(st, T, t => resetSet(S, t), { dur: Q.get('dur') ? +Q.get('dur') : undefined });
window.TIMELINE = T.list.map(s => ({ id: s.id, start: +s.start.toFixed(3), dur: +s.d.toFixed(3) }));
