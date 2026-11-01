// Renderer, post stack and the shot dispatcher. The page contract (window.DUR / render(t) / READY) lives here.
import * as THREE from 'three';
import { makePost } from './post.js';
import { noise1 } from './util.js';
import { hideParticles, aimBillboards, ALL, TRANSP } from './fx.js';

export function makeStage(o = {}) {
  const W = innerWidth, H = innerHeight, ssaa = o.ssaa ?? 2;
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(ssaa); renderer.setSize(W, H);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = o.exposure ?? 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 900);
  const post = makePost(renderer, scene, camera, W, H, { ssaa, ao: true, aoRadius: 0.35, aoAmt: 0.6 });
  post.vig.uniforms.amt.value = 0.22; post.vig.uniforms.contrast.value = -0.08; post.vig.uniforms.sat.value = 1.04; post.vig.uniforms.warm.value = 0.15;
  post.bloom.strength = 0.12;
  return { renderer, scene, camera, post, W, H };
}

const _t = new THREE.Vector3();
// place the camera: lens in mm on a 36 mm tall sensor (portrait, like Blender's auto fit); focus = DOF focus point (default: target)
export function shoot(st, pos, target, lens = 35, o = {}) {
  const c = st.camera;
  c.fov = 2 * Math.atan(18 / lens) * 180 / Math.PI;
  c.position.set(...pos);
  _t.set(...target);
  if (o.shake) {   // handheld drift, in metres
    const s = o.shake, t = o.t ?? 0;
    c.position.x += s * noise1(t * 1.3, 1); c.position.y += s * noise1(t * 1.1, 2);
    _t.x += s * 0.5 * noise1(t * 0.9, 3); _t.y += s * 0.5 * noise1(t * 1.2, 4);
  }
  c.up.set(0, 1, 0);
  if (o.roll) c.up.set(Math.sin(o.roll), Math.cos(o.roll), 0);
  c.lookAt(_t);
  c.updateProjectionMatrix();
  const f = o.focus ? new THREE.Vector3(...o.focus) : _t;
  st.post.dof.focus = Math.max(0.3, c.position.distanceTo(f));
  st.post.dof.aper = o.aper ?? 6;          // bigger = shallower
  st.post.dof.maxCoc = o.maxCoc ?? 14;
}

// shots: [{id, dur, frame(ctx)}]; timing: {id: seconds} overrides dur. ctx = {u: local s, d: duration, k: u/d, t: global s, T: timeline}
export function timeline(shots, timing = {}) {
  let acc = 0;
  const list = shots.map(s => { const d = timing[s.id] ?? s.dur; const r = { ...s, d, start: acc }; acc += d; return r; });
  const byId = Object.fromEntries(list.map(s => [s.id, s]));
  return { list, total: acc, start: id => byId[id].start, end: id => byId[id].start + byId[id].d, dur: id => byId[id].d,
    at: t => { for (const s of list) if (t < s.start + s.d) return s; return list[list.length - 1]; } };
}

export function install(st, T, before, o = {}) {
  window.DUR = o.dur ?? T.total;
  window.SHOT_AT = t => T.at(t).id;
  window.render = t => {
    t += o.offset ?? 0;
    const s = T.at(t), u = t - s.start;
    hideParticles();
    before(t, s);
    s.frame({ u, d: s.d, k: u / s.d, t, T, st });
    aimBillboards();
    st.post.dof.aoSkip = [...ALL.filter(p => p.mesh.material.transparent).map(p => p.mesh), ...TRANSP];
    st.post.composer.render();
  };
  window.READY = true;
}
