// Small shared helpers for the Three.js reels: easing, deterministic noise, materials, primitive builders.
// Coordinates: Y up, characters face +Z. 1 unit = 1 m.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { clamp, lerp, seg, ss, eio, eo, ei, back, spring, mulberry, hash, vnoise, TAU, monotone, track, env } from '/core/lib.js';
import { clamp, hash } from '/core/lib.js';

export const D2R = Math.PI / 180;
export const deg = d => d * D2R;

// smooth value noise in [-1, 1] keyed by a seed, for idle sway and camera handheld
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash(i + seed * 101.3), b = hash(i + 1 + seed * 101.3);
  return (a + (b - a) * u) * 2 - 1;
}

// piecewise keys [[t, v], ...] with smoothstep easing between keys (holds outside)
export function keys(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, v0] = list[i], [t1, v1] = list[i + 1];
    if (t <= t1) {
      const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1, e = k * k * (3 - 2 * k);
      if (Array.isArray(v0)) return v0.map((x, j) => x + (v1[j] - x) * e);
      return v0 + (v1 - v0) * e;
    }
  }
  return list[list.length - 1][1];
}

// ---------- materials ----------
const MATS = new Map();
// soft matte vinyl: rough, a little sheen so the edges glow like the Blender toys
export function soft(color, o = {}) {
  const key = 'soft' + color + JSON.stringify(o);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshPhysicalMaterial({
    color, roughness: o.rough ?? 0.62, metalness: 0, sheen: o.sheen ?? 0.35, sheenRoughness: 0.6,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5), specularIntensity: o.spec ?? 0.45,
    emissive: o.glow ? new THREE.Color(color) : new THREE.Color(0), emissiveIntensity: o.glow ?? 0,
    side: o.side ?? THREE.FrontSide, transparent: !!o.opacity, opacity: o.opacity ?? 1,
  }));
  return MATS.get(key);
}
export function plain(color, rough = 0.8, o = {}) {
  const key = 'plain' + color + rough + JSON.stringify(o);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: o.metal ?? 0, ...o.extra }));
  return MATS.get(key);
}
export function metal(color, rough = 0.35) { return plain(color, rough, { metal: 0.85 }); }
export function glass(color = '#bfe3f2', opacity = 0.28) {
  const key = 'glass' + color + opacity;
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0, transparent: true, opacity, depthWrite: false, specularIntensity: 1 }));
  return MATS.get(key);
}

// ---------- primitives ----------
export function mesh(geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0], scale = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scale) m.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export function group(parent, pos = [0, 0, 0], rot = [0, 0, 0], name = '') {
  const g = new THREE.Group(); g.name = name; g.position.set(...pos); g.rotation.set(...rot);
  if (parent) parent.add(g);
  return g;
}
export const sphereGeo = (r, seg = 32) => new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1));
// limb capsule hanging along -Y from its origin (origin = top cap centre), like the Blender rig
export function limbGeo(r, len, seg = 20) {
  const g = new THREE.CapsuleGeometry(r, len, 8, seg);
  g.translate(0, -len / 2, 0);
  return g;
}
export const box = (w, h, d, parent, pos, mat, radius = 0, rot) =>
  mesh(radius > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, Math.min(w, h, d) / 2 - 1e-4)) : new THREE.BoxGeometry(w, h, d), mat, parent, pos, rot);
export const cyl = (rTop, rBot, h, parent, pos, mat, rot, seg = 32) => mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat, parent, pos, rot);
export const ball = (r, parent, pos, mat, scale, seg = 32) => mesh(sphereGeo(r, seg), mat, parent, pos, [0, 0, 0], scale);

// a tube through world points, rebuilt per frame for ropes and cables; a twisted-strand texture slides with `travel`
let ROPE_TEX = null;
function ropeTex() {
  if (ROPE_TEX) return ROPE_TEX;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 9;
  for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 22, 0); g.lineTo(i * 22 + 64, 64); g.stroke(); }
  ROPE_TEX = new THREE.CanvasTexture(c); ROPE_TEX.wrapS = ROPE_TEX.wrapT = THREE.RepeatWrapping; ROPE_TEX.colorSpace = THREE.SRGBColorSpace;
  return ROPE_TEX;
}
export function ropeMesh(mat, r = 0.02, twisted = false) {
  if (twisted) { mat = mat.clone(); mat.map = ropeTex().clone(); mat.map.needsUpdate = true; }
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.castShadow = true; m.userData.r = r; m.frustumCulled = false;
  return m;
}
export function setRope(m, pts, travel = 0, seg = 24) {
  const v = pts.map(p => (p.isVector3 ? p : new THREE.Vector3(...p)));
  if (v.length < 2) { m.visible = false; return; }
  m.visible = true;
  const curve = v.length === 2 ? new THREE.LineCurve3(v[0], v[1]) : new THREE.CatmullRomCurve3(v, false, 'centripetal');
  m.geometry.dispose();
  m.geometry = new THREE.TubeGeometry(curve, v.length === 2 ? 1 : seg, m.userData.r, 8, false);
  if (m.material.map) {
    const per = m.userData.r * 7;    // one twist every few diameters
    m.material.map.repeat.set(curve.getLength() / per, 1);
    m.material.map.offset.set(-travel / per, 0);
  }
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const saturate = x => clamp(x, 0, 1);
