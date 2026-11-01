// Deterministic particle effects: every particle's state is a closed-form function of its age, so any frame renders alone.
import * as THREE from 'three';
import { mulberry, clamp } from './util.js';

const _qz = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();

// position under gravity with linear drag k (closed form)
export function ballistic(p0, v0, a, g = 9.81, k = 0) {
  if (k < 1e-4) return [p0[0] + v0[0] * a, p0[1] + v0[1] * a - 0.5 * g * a * a, p0[2] + v0[2] * a];
  const e = (1 - Math.exp(-k * a)) / k;
  return [p0[0] + v0[0] * e, p0[1] + v0[1] * e - g * (a - e) / k, p0[2] + v0[2] * e];
}

// every system, so a frame can start with all of them hidden and re-aim camera-facing cards after the camera moves
export const ALL = [];
// static transparent meshes (glass, water in a tank, domes): skipped by the AO pass like particles, but NOT hidden
// before every frame. Never put a static mesh in ALL: it would vanish unless every shot re-shows it.
export const TRANSP = [];
export function hideParticles() { for (const p of ALL) { p.mesh.visible = false; p._last = null; } }
export function aimBillboards() { for (const p of ALL) if (p.billboard && p._last) p.update(...p._last); }

export class Particles {
  // spawn(i, rnd) -> { delay, p, v, size, life, spin:[x,y,z], color }
  constructor(scene, n, geo, mat, spawn, o = {}) {
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    this.mesh.castShadow = o.shadow ?? false; this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    const rnd = mulberry(o.seed ?? 7);
    this.parts = [...Array(n)].map((_, i) => spawn(i, rnd));
    this.g = o.g ?? 9.81; this.k = o.drag ?? 0; this.grow = o.grow ?? (u => 1);
    this.floor = o.floor ?? -1e9; this.billboard = o.billboard ?? null;
    this.parts.forEach((q, i) => q.color && this.mesh.setColorAt(i, new THREE.Color(q.color)));
    this.t0 = null;
    ALL.push(this);
  }
  // origin moves the whole burst; t0 = burst time
  update(t, t0 = this.t0, origin = [0, 0, 0]) {
    this._last = [t, t0, origin];
    let any = false;
    this.parts.forEach((q, i) => {
      const a = t0 === null ? -1 : t - t0 - (q.delay || 0);
      if (a < 0 || a > q.life) { M.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, M); return; }
      any = true;
      const p = ballistic(q.p, q.v, a, q.g ?? this.g, q.k ?? this.k);
      P.set(p[0] + origin[0], Math.max(this.floor, p[1] + origin[1]), p[2] + origin[2]);
      const sp = q.spin || [0, 0, 0];
      if (this.billboard) Q.copy(this.billboard.quaternion).multiply(_qz.setFromAxisAngle(_z, (q.r0 || 0) + sp[2] * a));
      else Q.setFromEuler(E.set(sp[0] * a + (q.r0 || 0), sp[1] * a, sp[2] * a));
      S.setScalar(q.size * this.grow(a / q.life, q));
      this.mesh.setMatrixAt(i, M.compose(P, Q, S));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = any;
    return any;
  }
}

const COLORS = ['#ff4d4d', '#ffd23f', '#3ec1ff', '#7cff6b', '#ff7ae0', '#ffffff', '#ff9f1c'];

export function confetti(scene, n = 160, seed = 3) {
  const geo = new THREE.PlaneGeometry(0.09, 0.05);
  const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 });
  return new Particles(scene, n, geo, mat, (i, r) => {
    const a = r() * Math.PI * 2, s = 3 + r() * 5;
    return { delay: r() * 0.25, p: [0, 0, 0], v: [Math.cos(a) * s * 0.6, 5 + r() * 6, Math.sin(a) * s * 0.6], size: 1 + r(),
      life: 3, spin: [r() * 14, r() * 9, r() * 12], color: COLORS[i % COLORS.length], k: 1.6 };
  }, { seed, g: 6 });
}

// soft lumpy cloud texture for billboard puffs
let CLOUD = null;
function cloudTex() {
  if (CLOUD) return CLOUD;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = mulberry(5);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = i ? 0.1 + r() * 0.1 : 0, x = N / 2 + Math.cos(a) * d * N, y = N / 2 + Math.sin(a) * d * N, rad = N * (i ? 0.14 + r() * 0.08 : 0.3);   // stays inside the card
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  CLOUD = new THREE.CanvasTexture(c); CLOUD.colorSpace = THREE.SRGBColorSpace;
  return CLOUD;
}

// soft dust / smoke puff: camera-facing cloud cards expanding outward and fading by shrinking
export function puff(scene, n = 24, color = '#d8cbb4', seed = 5, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, map: cloudTex(), roughness: 1, transparent: true, opacity: o.opacity ?? 0.9, depthWrite: false,
    emissive: new THREE.Color(color), emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const spread = o.spread ?? 3, up = o.up ?? 1.2;
  return new Particles(scene, n, new THREE.PlaneGeometry(2, 2), mat, (i, r) => {
    const a = r() * Math.PI * 2, s = spread * (0.5 + r());
    return { delay: r() * 0.08, p: [0, r() * 0.3, 0], v: [Math.cos(a) * s, up * (0.3 + r()), Math.sin(a) * s], size: (o.size ?? 0.45) * (0.6 + r() * 0.8),
      life: (o.life ?? 1.2) * (0.7 + r() * 0.5), spin: [0, 0, (r() - 0.5) * 2], r0: r() * 6, k: 2.5, g: -0.3 };
  }, { seed, billboard: o.camera, grow: u => (0.35 + 0.65 * Math.sin(Math.min(1, u * 2.5) * Math.PI / 2)) * (1 - u ** 3) });
}

export function sparks(scene, n = 40, seed = 9) {
  const mat = new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false });
  return new Particles(scene, n, new THREE.BoxGeometry(0.02, 0.02, 0.12), mat, (i, r) => {
    const a = r() * Math.PI * 2;
    return { delay: r() * 0.5, p: [0, 0, 0], v: [Math.cos(a) * (1 + r() * 3), 1 + r() * 3, Math.sin(a) * (1 + r() * 3)], size: 1, life: 0.35 + r() * 0.3, spin: [r() * 20, r() * 20, 0] };
  }, { seed, grow: u => 1 - u });
}

export function sweat(scene, n = 6, seed = 4) {
  const mat = new THREE.MeshPhysicalMaterial({ color: '#9fd8ff', roughness: 0.05, transmission: 0.2, transparent: true, opacity: 0.85 });
  return new Particles(scene, n, new THREE.SphereGeometry(0.03, 12, 8).scale(1, 1.4, 1), mat, (i, r) => {
    const a = (r() - 0.5) * 2.4;
    return { delay: i * 0.22 + r() * 0.1, p: [Math.sin(a) * 0.3, 0.45, Math.cos(a) * 0.15], v: [Math.sin(a) * 1.2, 1.4 + r(), 0.3], size: 1, life: 0.6 };
  }, { seed });
}

// text sprite (a symbol drawn on a canvas), e.g. music notes
export function glyph(text, color = '#222', size = 256, font = 'bold 200px sans-serif') {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, size / 2, size / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export { clamp };
