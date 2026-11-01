// Underwater life and diagrams: a fish school (flees fast things), kelp that sways, bubble streams, light shafts,
// the Archimedes demo and the sink/float/hover tank on the bench, force arrows, a sunken bicycle, the giant catfish.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { plain, soft, metal, glass, box, cyl, ball, mesh, group, mulberry, deg, clamp, noise1, ropeMesh } from '../lib/util.js';
import { ALL, Particles } from '../lib/fx.js';
import { LAKE } from './set.js';

const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S1 = new THREE.Vector3();
// static transparent meshes: skipped by the AO pass but, unlike particles in ALL, not hidden before every frame
export const TRANSP = [];
export const skip = m => { m.castShadow = false; TRANSP.push(m); return m; };

function fishGeo() {
  const body = new THREE.SphereGeometry(0.12, 12, 8); body.scale(0.55, 0.75, 1.5);
  const tail = new THREE.ConeGeometry(0.1, 0.16, 4); tail.rotateX(Math.PI / 2); tail.scale(0.3, 1, 1); tail.translate(0, 0, -0.24);
  return mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()]);
}

export function buildProps(S, scene) {
  const rnd = mulberry(77);
  // fish school
  const n = 46, fm = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 });
  S.oneFish = new THREE.Mesh(fishGeo(), new THREE.MeshStandardMaterial({ color: '#ff8a2a', roughness: 0.4 })); scene.add(S.oneFish);
  S.fish = new THREE.InstancedMesh(fishGeo(), fm, n); S.fish.frustumCulled = false; scene.add(S.fish);
  S.fishData = [...Array(n)].map((_, i) => ({ r: 1.2 + rnd() * 2.2, w: (0.5 + rnd() * 0.4) * (i % 7 ? 1 : -1), ph: rnd() * 6.28, y: (rnd() - 0.5) * 1.6, s: 0.55 + rnd() * 0.45 }));
  S.fishData.forEach((f, i) => S.fish.setColorAt(i, new THREE.Color(['#ff8a2a', '#ffd23f', '#ff5a3a', '#ffb347'][i % 4])));
  // kelp: 60 stalks x 5 segments, posed per frame (instanced per segment level)
  S.kelpBase = [...Array(60)].map(() => { const x = -30 + rnd() * 60, z = (rnd() - 0.5) * 2 * (LAKE.bedZ - 0.5); return { x, z, h: 0.5 + rnd() * 0.4, ph: rnd() * 6 }; });
  S.kelp = [0, 1, 2, 3, 4].map(k => {
    const g = new THREE.BoxGeometry(0.16, 1, 0.03); g.translate(0, 0.5, 0);
    const m = new THREE.InstancedMesh(g, soft(['#2f7d32', '#3c8f3a', '#4ea347', '#5eb553', '#6cc35e'][k], { side: THREE.DoubleSide }), S.kelpBase.length);
    m.frustumCulled = false; scene.add(m); return m;
  });
  // light shafts: additive gradient cards hanging from the surface
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g2 = c.getContext('2d'), gr = g2.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(255,255,240,0.55)'); gr.addColorStop(1, 'rgba(255,255,240,0)');
  g2.fillStyle = gr; g2.fillRect(0, 0, 64, 256);
  const hg = g2.createLinearGradient(0, 0, 64, 0); hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(0.5, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(0,0,0,1)');
  g2.globalCompositeOperation = 'destination-out'; g2.fillStyle = hg; g2.fillRect(0, 0, 64, 256);
  const st = new THREE.CanvasTexture(c); st.colorSpace = THREE.SRGBColorSpace;
  const sm = new THREE.MeshBasicMaterial({ map: st, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0.5 });
  S.shafts = [...Array(14)].map(() => { const m = skip(new THREE.Mesh(new THREE.PlaneGeometry(0.8, 9), sm)); m.geometry.translate(0, -4.5, 0); scene.add(m); return m; });
  // bubbles: streams from the barrel, the sub's vents, Ben's mouth; a burst for the 'confetti' moment
  const bm = new THREE.MeshPhysicalMaterial({ color: '#e9fbff', roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false, envMapIntensity: 1.5 });
  const bubbles = (n, seed, o = {}) => new Particles(scene, n, new THREE.SphereGeometry(o.r ?? 0.05, 10, 8), bm, (i, r) => ({
    delay: o.burst ? r() * 0.15 : i * (o.dt ?? 0.05), p: [(r() - 0.5) * (o.spread ?? 0.3), 0, (r() - 0.5) * (o.spread ?? 0.3)],
    v: [(r() - 0.5) * (o.side ?? 0.4), (o.up ?? 1.2) * (0.7 + r() * 0.6), (r() - 0.5) * (o.side ?? 0.4)], size: 0.5 + r() * 1.2, life: o.life ?? 2.5, spin: [0, 0, 0], g: -(o.g ?? 0.4) }), { seed, grow: u => 1 + u * 0.6 });
  S.bub = { trail: bubbles(80, 61, { dt: 0.03, up: 0.6 }), burst: bubbles(120, 62, { burst: true, up: 3.5, side: 3, spread: 0.8, r: 0.07, life: 1.8 }),
    ventA: bubbles(70, 63, { dt: 0.03, up: 1.5, spread: 0.1 }), ventB: bubbles(70, 64, { dt: 0.03, up: 1.5, spread: 0.1 }),
    blowA: bubbles(90, 65, { dt: 0.015, up: 2.5, side: 1.2, spread: 0.2, r: 0.07 }), blowB: bubbles(90, 66, { dt: 0.015, up: 2.5, side: 1.2, spread: 0.2, r: 0.07 }),
    mouth: bubbles(20, 67, { dt: 0.12, up: 0.8, spread: 0.05, r: 0.035, life: 1.5 }), wake: bubbles(60, 68, { dt: 0.04, up: 0.3, side: 0.6, spread: 0.4, life: 1.6 }) };
  Object.values(S.bub).forEach(b => { b.mesh.material = bm; });
  // force arrows (shot 08) and pressure arrows (shot 33)
  const arrowGeo = (() => {
    const s = new THREE.Shape(); s.moveTo(-0.12, 0); s.lineTo(0.12, 0); s.lineTo(0.12, 0.7); s.lineTo(0.3, 0.7); s.lineTo(0, 1); s.lineTo(-0.3, 0.7); s.lineTo(-0.12, 0.7); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); g.translate(0, 0, -0.04); return g;
  })();
  S.arrowUp = mesh(arrowGeo, soft('#3c8ce8', { glow: 0.4 }), scene); S.arrowDown = mesh(arrowGeo, soft('#ff4d4d', { glow: 0.4 }), scene);
  S.squeeze = new THREE.InstancedMesh(arrowGeo, soft('#ff7a2a', { glow: 0.4 }), 14); S.squeeze.frustumCulled = false; scene.add(S.squeeze);
  // sunken bicycle
  S.bike = group(scene, [-1.5, LAKE.bed + 0.05, -2.5], [deg(80), deg(30), 0], 'bike');
  for (const z of [-0.55, 0.55]) mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 28), plain('#2b2b2b', 0.6), S.bike, [0, 0, z], [0, Math.PI / 2, 0]);
  const fr = plain('#c0392b', 0.5);
  for (const [a, b] of [[[0, 0, -0.55], [0, 0.35, 0.1]], [[0, 0.35, 0.1], [0, 0, 0.55]], [[0, 0, -0.55], [0, 0.4, -0.3]], [[0, 0.4, -0.3], [0, 0.35, 0.1]]]) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), m = cyl(0.02, 0.02, A.distanceTo(B), S.bike, [0, 0, 0], fr, undefined, 6);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  }
  // giant catfish face (shot 35)
  S.catfish = group(scene, [0, 0, 0], [0, 0, 0], 'catfish');
  ball(1.4, S.catfish, [0, 0, 0], soft('#6f7a52', { rough: 0.7 }), [1.3, 0.9, 1.6], 32);
  for (const s of [1, -1]) {
    ball(0.32, S.catfish, [0.75 * s, 0.35, 1.7], soft('#f4f1d8'), null, 24);
    ball(0.17, S.catfish, [0.78 * s, 0.37, 1.97], plain('#111', 0.2), null, 16);
    const w = cyl(0.03, 0.01, 1.8, S.catfish, [0.5 * s, -0.35, 2.1], soft('#3a4030'), [deg(70), 0, s * deg(55)], 6);
  }
  box(1.6, 0.15, 0.3, S.catfish, [0, -0.45, 2.05], plain('#2a2c22', 0.8), 0.06);
  buildDemos(S, scene);
}

// ---------- the bench demos ----------
function glassBox(parent, w, h, d, pos) {
  const g = group(parent, pos), gm = glass('#cfe9f5', 0.18);
  for (const [x, z, ry, ww] of [[0, d / 2, 0, w], [0, -d / 2, 0, w], [w / 2, 0, Math.PI / 2, d], [-w / 2, 0, Math.PI / 2, d]]) skip(mesh(new THREE.PlaneGeometry(ww, h), gm, g, [x, h / 2, z], [0, ry, 0]));
  box(w, 0.02, d, g, [0, 0.01, 0], glass('#cfe9f5', 0.35));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)).translate(0, h / 2, 0), new THREE.LineBasicMaterial({ color: '#4f7f94' })));
  return g;
}
const waterMat = () => new THREE.MeshStandardMaterial({ color: '#2aa3d0', roughness: 0.1, transparent: true, opacity: 0.6, depthWrite: false });
function buildDemos(S, scene) {
  const B = S.bench, top = 0.9;
  // Archimedes: brim-full tank with a spout, block lowered in, spill runs into a cup on a kitchen scale
  const A = {};
  A.root = group(B, [0, 0, 0]);
  A.tank = glassBox(A.root, 0.5, 0.5, 0.4, [-0.55, top, 0]);
  A.water = skip(box(0.48, 1, 0.38, A.tank, [0, 0.24, 0], waterMat()));
  A.water.geometry.translate(0, 0.5, 0); A.water.position.y = 0.01;
  cyl(0.025, 0.025, 0.22, A.tank, [0.32, 0.44, 0], metal('#b8bcc2'), [0, 0, deg(75)], 10);
  A.block = box(0.2, 0.2, 0.2, A.root, [-0.55, top + 0.8, 0], plain('#5a6068', 0.5), 0.02);
  A.string = ropeMesh(plain('#f4f4f4', 0.6), 0.004); scene.add(A.string);
  A.scale = group(A.root, [0.35, top, 0]);
  box(0.42, 0.06, 0.42, A.scale, [0, 0.03, 0], plain('#f2f2f2', 0.4), 0.02);
  const dial = mesh(new THREE.CircleGeometry(0.11, 32), plain('#fffbe8', 0.5), A.scale, [0, 0.07, 0.212]);
  A.needle = box(0.008, 0.09, 0.004, A.scale, [0, 0.07, 0.216], plain('#e8232a', 0.4)); A.needle.geometry.translate(0, 0.04, 0);
  A.cup = group(A.scale, [0, 0.06, 0]);
  skip(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 24, 1, true), glass('#d8f0fb', 0.3), A.cup, [0, 0.11, 0]));
  A.cupWater = skip(cyl(0.11, 0.095, 1, A.cup, [0, 0, 0], waterMat()));
  A.cupWater.geometry.translate(0, 0.5, 0);
  A.stream = skip(cyl(0.012, 0.012, 1, B, [0, 0, 0], waterMat()));
  S.archi = A;
  // sink / float / hover tank
  const D = {};
  D.root = group(B, [0, 0, 0]);
  D.tank = glassBox(D.root, 0.7, 0.9, 0.45, [0, top, 0]);
  D.water = skip(box(0.68, 0.8, 0.43, D.tank, [0, 0.41, 0], waterMat()));
  D.rock = mesh(new THREE.DodecahedronGeometry(0.07, 1), plain('#7d7a74', 0.9), D.tank);
  D.ball = ball(0.07, D.tank, [0, 0, 0], soft('#ff4d4d'));
  D.jar = group(D.tank, [0, 0, 0]);
  mesh(new THREE.CapsuleGeometry(0.06, 0.1, 6, 16), soft('#ffd23f'), D.jar);   // a toy bottle, half full: the same weight as the water it pushes aside
  cyl(0.065, 0.065, 0.03, D.jar, [0, 0.09, 0], metal('#d9a441'), undefined, 20);
  S.sfh = D;
}

export function resetProps(S, t) {
  S.fish.visible = false; S.oneFish.visible = false; S.kelp.forEach(k => { k.visible = false; }); S.shafts.forEach(m => { m.visible = false; });
  for (const m of [S.arrowUp, S.arrowDown, S.squeeze, S.bike, S.catfish]) m.visible = false;
  S.archi.string.visible = false; S.archi.stream.visible = false; S.archi.root.visible = false; S.sfh.root.visible = false;
}

// underwater dressing around a point: kelp, shafts (facing the camera around y), fish around centre c (fleeing `away` points)
export function underwater(S, t, cam, o = {}) {
  S.bike.visible = true;
  S.kelpBase.forEach((k, i) => {
    let mx = M4.identity(); const P = new THREE.Vector3(k.x, LAKE.bed, k.z), Rq = new THREE.Quaternion();
    S.kelp.forEach((m, j) => {
      const sway = 0.12 * Math.sin(t * 1.3 + k.ph + j * 0.7) + (o.wake ? 0.25 * Math.exp(-((k.x - o.wake[0]) ** 2 + (k.z - o.wake[2]) ** 2) / 6) * Math.sin(t * 6 + j) : 0);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(sway, k.ph, sway * 0.6));
      Rq.multiply(q);
      M4.compose(P, Rq, S1.set(1, k.h, 1)); m.setMatrixAt(i, M4); m.visible = true;
      P.add(new THREE.Vector3(0, k.h, 0).applyQuaternion(Rq));
    });
  });
  S.kelp.forEach(m => { m.instanceMatrix.needsUpdate = true; });
  const c = o.centre ?? [0, -3, 0];
  S.shafts.forEach((m, i) => {
    m.visible = true; const a = i * 2.39996;
    m.position.set(c[0] + Math.cos(a) * (3 + (i % 5) * 2.2), LAKE.water - 0.05, c[2] + Math.sin(a) * (3 + (i % 5) * 2.2));
    m.rotation.set(0, Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z), deg(-12));
    m.material.opacity = 0.2 + 0.06 * Math.sin(t * 0.7 + i);
  });
  if (o.fish) fishSchool(S, t, o.fish, o.away ?? []);
}

export function fishSchool(S, t, c, away = []) {
  S.fish.visible = true;
  S.fishData.forEach((f, i) => {
    const a = f.ph + f.w * t;
    V.set(c[0] + Math.cos(a) * f.r, c[1] + f.y + 0.2 * Math.sin(t * 2 + f.ph), c[2] + Math.sin(a) * f.r);
    for (const p of away) {            // dart away from anything big and fast
      const dx = V.x - p[0], dy = V.y - p[1], dz = V.z - p[2], d = Math.hypot(dx, dy, dz) + 1e-3, push = clamp((3.2 - d) / 3.2) * 2.4;
      V.x += dx / d * push; V.y += dy / d * push * 0.5; V.z += dz / d * push;
    }
    const yaw = Math.atan2(-Math.sin(a) * Math.sign(f.w), Math.cos(a) * Math.sign(f.w));
    Q.setFromEuler(E.set(0, Math.atan2(-Math.sin(a), Math.cos(a)) * 0 + (f.w > 0 ? -a : Math.PI - a), 0.15 * Math.sin(t * 9 + i)));
    M4.compose(V, Q, S1.setScalar(f.s)); S.fish.setMatrixAt(i, M4);
  });
  S.fish.instanceMatrix.needsUpdate = true;
}
