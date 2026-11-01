// Moving props and diagrams: campfire flames, the balance's air molecules, the cubic-metre cubes, the fan, clouds, a gull,
// wind-layer arrows, the sandwich and the cookie. All posed per frame from absolute time.
import * as THREE from 'three';
import { plain, soft, metal, box, cyl, ball, mesh, group, mulberry, deg, clamp, noise1, back } from '../lib/util.js';
import { ALL } from '../lib/fx.js';
import { ENV } from './balloon.js';

const flameMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const skip = m => { m.castShadow = false; ALL.push({ mesh: m, billboard: null }); return m; };

// fire tongues: cones that flicker and lean
function fireTongues(parent) {
  const g = group(parent, [0, 0.12, 0]), list = [];
  const rnd = mulberry(12);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, r = i ? 0.12 + rnd() * 0.15 : 0;
    const m = skip(mesh(new THREE.ConeGeometry(0.22, 0.95, 12, 1, true), flameMat(i % 2 ? '#ff7a1a' : '#ffb340'), g, [Math.cos(a) * r, 0.3, Math.sin(a) * r]));
    m.geometry.translate(0, 0.47, 0); m.position.y = 0;
    list.push({ m, ph: rnd() * 6, h: 0.7 + rnd() * 0.6 });
  }
  const core = skip(mesh(new THREE.ConeGeometry(0.15, 0.6, 10, 1, true), flameMat('#fff1b0'), g, [0, 0, 0]));
  core.geometry.translate(0, 0.3, 0);
  list.push({ m: core, ph: 1, h: 1 });
  const light = new THREE.PointLight('#ff8a3a', 0, 7, 1.6); light.position.set(0, 0.7, 0); g.add(light);
  return { g, list, light };
}

// air molecules bouncing in a box of side L (closed form: reflected straight lines)
function molecules(parent, n, color, speed, seed, r = 0.028) {
  const rnd = mulberry(seed), m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 12, 8), soft(color, { glow: 0.25 }), n);
  m.castShadow = false; parent.add(m);
  const parts = [...Array(n)].map(() => ({ p: [rnd(), rnd(), rnd()], v: [(rnd() - 0.5), (rnd() - 0.5), (rnd() - 0.5)].map(x => x * speed * 2), esc: rnd() }));
  return { m, parts };
}
const reflect = x => { const f = ((x % 2) + 2) % 2; return f > 1 ? 2 - f : f; };
const M4 = new THREE.Matrix4(), V3 = new THREE.Vector3(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1);
// escape: 0..1 share of molecules that have dropped out of the open bottom by now (hot box)
export function moveMolecules(mol, t, L, escape = 0) {
  mol.parts.forEach((q, i) => {
    let x = reflect(q.p[0] + q.v[0] * t / L), y = reflect(q.p[1] + q.v[1] * t / L), z = reflect(q.p[2] + q.v[2] * t / L);
    let s = 1;
    if (q.esc < escape) { const a = (escape - q.esc) * 6; y = -a * a * 0.6 + Math.min(y, 0.05); s = Math.max(0, 1 - a * 0.6); }
    V3.set((x - 0.5) * (L - 0.06), (y - 0.5) * (L - 0.06), (z - 0.5) * (L - 0.06));
    mol.m.setMatrixAt(i, M4.compose(V3, Q, S1.setScalar(s)));
  });
  mol.m.instanceMatrix.needsUpdate = true;
}

// the 600 one-metre cubes that fill the balloon's shape, sorted bottom-up
function cubes(scene) {
  const list = [];
  for (let y = 0.5; y < ENV.top; y += 1) {
    let r = 0;
    for (const p of ENV.pts) if (Math.abs(p[1] - y) < 0.6) r = Math.max(r, p[0]);
    for (let x = -r; x <= r; x += 1) for (let z = -r; z <= r; z += 1) if (Math.hypot(x, z) < r - 0.2) list.push([x, y, z]);
  }
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffb000', emissiveIntensity: 0.35, roughness: 0.4, transparent: true, opacity: 0.8 }), list.length);
  m.castShadow = false; scene.add(m); m.frustumCulled = false;
  const edges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.93, 0.93, 0.93), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.6 }), list.length);
  scene.add(edges); edges.frustumCulled = false;
  ALL.push({ mesh: m, billboard: null }, { mesh: edges, billboard: null });
  return { m, edges, list };
}

let CLOUD = null;
function cloudTex() {
  if (CLOUD) return CLOUD;
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = mulberry(55);
  for (let i = 0; i < 26; i++) {
    const x = N * (0.18 + r() * 0.64), y = N * (0.42 + (r() - 0.5) * 0.25 - (Math.abs(x / N - 0.5) < 0.2 ? 0.08 : 0)), rad = N * (0.08 + r() * 0.1);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(250,250,252,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  CLOUD = new THREE.CanvasTexture(c); CLOUD.colorSpace = THREE.SRGBColorSpace;
  return CLOUD;
}

function arrow(color) {
  const s = new THREE.Shape();
  s.moveTo(-1.6, -0.35); s.lineTo(0.5, -0.35); s.lineTo(0.5, -0.8); s.lineTo(1.6, 0); s.lineTo(0.5, 0.8); s.lineTo(0.5, 0.35); s.lineTo(-1.6, 0.35); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  g.translate(0, 0, -0.125); g.rotateX(-Math.PI / 2);   // lies flat, points +x
  return new THREE.Mesh(g, soft(color, { glow: 0.35 }));
}

function gull(scene) {
  const g = group(scene, [0, 0, 0], [0, 0, 0], 'gull'), white = soft('#f7f7f7'), grey = soft('#9aa3ad');
  ball(0.16, g, [0, 0, 0], white, [1, 0.8, 2.2], 16);
  ball(0.11, g, [0, 0.1, 0.32], white, null, 14);
  mesh(new THREE.ConeGeometry(0.035, 0.14, 8), soft('#ffb020'), g, [0, 0.09, 0.46], [Math.PI / 2, 0, 0]);
  for (const s of [1, -1]) ball(0.018, g, [0.07 * s, 0.14, 0.4], plain('#111'), null, 8);
  const wings = [1, -1].map(s => {
    const w = group(g, [0.1 * s, 0.05, 0]);
    const m = box(0.7, 0.03, 0.26, w, [0.35 * s, 0, 0], grey, 0.012);
    box(0.18, 0.031, 0.2, w, [0.62 * s, 0, -0.02], plain('#2a2a2e', 0.7));
    return w;
  });
  for (const s of [1, -1]) cyl(0.01, 0.01, 0.18, g, [0.05 * s, -0.18, 0], soft('#ffb020'), undefined, 6);
  g.userData.wings = wings;
  return g;
}

function fan(scene) {
  const g = group(scene, [0, 0, 0], [0, 0, 0], 'fan'), dark = plain('#2c2f35', 0.5), steel = metal('#c9ccd1', 0.3);
  mesh(new THREE.TorusGeometry(0.75, 0.08, 12, 40), dark, g, [0, 0.9, 0]);
  for (let i = 0; i < 8; i++) { const r = box(1.5, 0.015, 0.015, g, [0, 0.9, 0.06], steel); r.rotation.z = i * Math.PI / 8; }
  const hub = group(g, [0, 0.9, 0]);
  cyl(0.12, 0.12, 0.15, hub, [0, 0, 0], soft('#f2782c'), [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) { const b = box(0.24, 0.62, 0.03, hub, [0, 0, 0], soft('#f2782c')); b.geometry.translate(0, 0.33, 0); b.rotation.set(0, deg(25), i * Math.PI * 2 / 3); }
  box(0.25, 0.45, 0.35, g, [0, 0.9, -0.32], dark, 0.05);
  for (const s of [1, -1]) { const l = cyl(0.03, 0.03, 1.0, g, [0.45 * s, 0.4, -0.2], steel, [0, 0, s * deg(25)], 8); }
  box(1.4, 0.06, 0.6, g, [0, 0.03, -0.2], dark);
  g.userData.hub = hub;
  return g;
}

export function buildProps(S, scene, assets) {
  S.flames = fireTongues(S.fire);
  const pans = S.balance.userData.pans;
  S.molCold = molecules(pans[0].userData.boxG, 46, '#3c8ce8', 0.08, 3);
  S.molHot = molecules(pans[1].userData.boxG, 18, '#f0452e', 0.55, 4);
  S.cubes = cubes(scene);
  S.fan = fan(scene);
  S.stake = group(scene, [-3.4, 0, -2.2], [0, 0, 0], 'stake');
  cyl(0.06, 0.04, 0.6, S.stake, [0, 0.25, 0], plain('#7c5a38', 0.9), undefined, 8);
  S.oneCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), S.cubes.m.material.clone());
  S.oneCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: '#ffffff' })));
  scene.add(S.oneCube); ALL.push({ mesh: S.oneCube, billboard: null });
  S.gull = gull(scene);
  // sandwich and cookie
  S.sandwich = group(scene, [0, 0, 0], [0, 0, 0], 'sandwich');
  box(0.22, 0.04, 0.2, S.sandwich, [0, 0.02, 0], soft('#f3d9a4'), 0.015);
  box(0.24, 0.02, 0.22, S.sandwich, [0, 0.05, 0], soft('#7cc44a'), 0.008);
  box(0.21, 0.02, 0.19, S.sandwich, [0, 0.07, 0], soft('#e8574a'), 0.008);
  box(0.22, 0.04, 0.2, S.sandwich, [0, 0.1, 0], soft('#f3d9a4'), 0.015);
  S.cookie = group(scene, [0, 0, 0], [0, 0, 0], 'cookie');
  cyl(0.12, 0.12, 0.025, S.cookie, [0, 0, 0], soft('#c88a48'), undefined, 24);
  for (let i = 0; i < 6; i++) ball(0.012, S.cookie, [Math.cos(i * 1.1) * 0.05, 0.012, Math.sin(i * 1.7) * 0.05], plain('#4a2a18'), null, 6);
  // clouds (billboards, placed by the shots)
  const cm = new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, depthWrite: false, roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.35 });
  S.clouds = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), cm); m.castShadow = false; scene.add(m); ALL.push({ mesh: m, billboard: null }); return m; });
  // wind-layer arrows
  S.arrowsLo = [...Array(7)].map(() => { const a = arrow('#ff9a2a'); scene.add(a); return a; });
  S.arrowsHi = [...Array(7)].map(() => { const a = arrow('#3c8ce8'); scene.add(a); return a; });
  // turf the basket rips up on landing, roof tiles from the scrape (a few solid tiles)
  S.tiles = [...Array(9)].map(() => box(0.32, 0.03, 0.42, scene, [0, 0, 0], plain('#d9603b', 0.7)));
}

export function resetProps(S, t) {
  const f = S.flames;
  f.list.forEach(q => {
    const k = 1 + 0.25 * Math.sin(t * 13 + q.ph) + 0.2 * noise1(t * 6, q.ph * 10);
    q.m.scale.set(1 - 0.1 * Math.sin(t * 17 + q.ph), q.h * k, 1);
    q.m.rotation.z = 0.15 * noise1(t * 3, q.ph);
  });
  f.light.intensity = 16 * (1 + 0.2 * Math.sin(t * 21));
  S.cubes.m.visible = S.cubes.edges.visible = false;
  S.fan.visible = false; S.stake.visible = false; S.oneCube.visible = false; S.gull.visible = false; S.sandwich.visible = false; S.cookie.visible = false;
  S.clouds.forEach(c => { c.visible = false; });
  [...S.arrowsLo, ...S.arrowsHi].forEach(a => { a.visible = false; });
  S.tiles.forEach(x => { x.visible = false; });
  moveMolecules(S.molCold, t, 0.5); moveMolecules(S.molHot, t, 0.5);
}

// show n of the cubes (bottom-up), each popping in; at the world origin o
export function showCubes(S, n, o, popAge = 0.12) {
  const { m, edges, list } = S.cubes;
  m.visible = edges.visible = true;
  const k = Math.floor(n), fr = n - k;
  list.forEach((p, i) => {
    const s = i < k ? 1 : i === k ? back(fr, 2) : 0;
    V3.set(o[0] + p[0], o[1] + p[1], o[2] + p[2]);
    M4.compose(V3, Q, S1.setScalar(s)); m.setMatrixAt(i, M4); edges.setMatrixAt(i, M4);
  });
  m.instanceMatrix.needsUpdate = true; edges.instanceMatrix.needsUpdate = true;
  return list.length;
}

// a cloud card facing the camera at p, size s
export function cloud(S, i, p, s, cam) {
  const c = S.clouds[i]; c.visible = true; c.position.set(...p); c.scale.setScalar(s); c.quaternion.copy(cam.quaternion);
}

// gull flying or perched: flap 0..1
export function poseGull(S, p, yaw, flap, t) {
  const g = S.gull; g.visible = true; g.position.set(...p); g.rotation.set(0, yaw, 0);
  const a = flap * deg(40) * Math.sin(t * 16);
  g.userData.wings[0].rotation.z = a + (1 - flap) * deg(-70); g.userData.wings[1].rotation.z = -a + (1 - flap) * deg(70);
}
