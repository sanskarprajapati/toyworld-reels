// The submarine set: a deep lake across the island (along x), the narrator's jetty on the near bank (+z), the neighbour's
// rowboat in the middle, grandma's jetty on the far bank. Underwater: sandy bed with caustics, sloped banks, rocks, weeds.
import * as THREE from 'three';
import { plain, soft, metal, glass, box, cyl, ball, mesh, group, mulberry, deg, ropeMesh } from '../lib/util.js';
import { house, tree, fence } from '../lib/world.js';

export const LAKE = { edge: 13, water: -0.5, bed: -7, bedZ: 9 };       // banks at z = ±13 slope down to a flat bed |z| < 9
export const JETTY = { x: 0, z0: 15, z1: 7.5, y: 0.35 };                // deck from the bank out over the water
export const GJETTY = { x: -10, z0: -15, z1: -9.5, y: 0.3 };            // grandma's
export const CAUSTIC = { t: { value: 0 } };

function rippleNormal() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), rnd = mulberry(17);
  const waves = [...Array(9)].map(() => ({ kx: Math.round((rnd() - 0.5) * 10), ky: Math.round(1 + rnd() * 7), a: 0.4 + rnd() * 0.6, p: rnd() * 6.28 }));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let dx = 0, dy = 0;
    for (const w of waves) { const c0 = Math.cos(2 * Math.PI * (w.kx * i + w.ky * j) / N + w.p) * w.a; dx += c0 * w.kx; dy += c0 * w.ky; }
    const k = (j * N + i) * 4, nx = -dx * 0.035, ny = -dy * 0.035, l = Math.hypot(nx, ny, 1);
    img.data[k] = (nx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// sand with moving caustic light (two crossed sine lattices, time from CAUSTIC.t)
function sandMaterial(color = '#d9c48f') {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  m.onBeforeCompile = sh => {
    sh.uniforms.ct = CAUSTIC.t;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float ct;')
      .replace('#include <map_fragment>', `
        vec2 q = vWP.xz * 0.9;
        float c1 = sin(q.x * 2.1 + sin(q.y * 1.3 + ct * 1.1) * 1.6 + ct * 0.8);
        float c2 = sin(q.y * 2.3 + sin(q.x * 1.7 - ct * 0.9) * 1.6 - ct * 0.7);
        float caus = pow(clamp(1.0 - abs(c1 * c2), 0.0, 1.0), 6.0);
        float grain = fract(sin(dot(floor(vWP.xz * 18.0), vec2(12.9898, 78.233))) * 43758.5453);
        diffuseColor.rgb *= (0.92 + 0.12 * grain) * (1.0 + 0.9 * caus * step(vWP.y, -0.6));`);
  };
  return m;
}

function lake(scene) {
  const L = LAKE, len = 180, g = group(scene, [0, 0, 0], [0, 0, 0], 'lake');
  const sand = sandMaterial(), bank = sandMaterial('#b99a6a');
  const slope = Math.hypot(L.edge - L.bedZ, -L.bed), ang = Math.atan2(-L.bed, L.edge - L.bedZ);
  for (const s of [1, -1]) {
    const p = mesh(new THREE.PlaneGeometry(len, slope), bank, g, [0, L.bed / 2, s * (L.edge + L.bedZ) / 2]);
    p.rotation.x = s > 0 ? -Math.PI / 2 - ang : -Math.PI / 2 + ang; p.castShadow = false;   // rising to the bank edge
    box(len, 0.06, 0.25, g, [0, -0.02, s * (L.edge - 0.05)], plain('#4c9636', 0.9)).castShadow = false;
  }
  mesh(new THREE.PlaneGeometry(len, 2 * L.bedZ + 0.4), sand, g, [0, L.bed, 0], [-Math.PI / 2, 0, 0]).castShadow = false;
  // rocks on the bed and banks
  const rnd = mulberry(23), n = 140, rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 1), plain('#8f8a80', 0.9), n), M = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const x = -50 + rnd() * 100, z = (rnd() - 0.5) * 2 * (L.bedZ + 2), sc = 0.4 + rnd() * 1.4;
    const y = Math.abs(z) < L.bedZ ? L.bed : L.bed + (Math.abs(z) - L.bedZ) * Math.tan(ang);
    M.compose(new THREE.Vector3(x, y + 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), new THREE.Vector3(sc * 1.3, sc * 0.6, sc));
    rocks.setMatrixAt(i, M);
  }
  rocks.castShadow = rocks.receiveShadow = true; g.add(rocks);
  const nm = rippleNormal(); nm.repeat.set(len / 7, 4);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(len, 2 * L.edge, 1, 1), new THREE.MeshPhysicalMaterial({
    color: '#1f7a86', roughness: 0.06, transparent: true, opacity: 0.9, normalMap: nm, normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 1.2, specularIntensity: 1, side: THREE.DoubleSide, depthWrite: false }));
  water.rotation.x = -Math.PI / 2; water.position.y = L.water; water.renderOrder = 3;
  g.add(water);
  return { water, nm };
}

function jetty(scene, J, w = 1.8) {
  const g = group(scene, [J.x, 0, 0], [0, 0, 0], 'jetty'), wood = plain('#a77b52', 0.85), dark = plain('#6f5236', 0.9);
  const n = Math.round((J.z0 - J.z1) / 0.28);
  for (let i = 0; i < n; i++) box(w, 0.07, 0.24, g, [0, J.y, J.z0 - i * 0.28], i % 3 ? wood : plain('#b48a5e', 0.85));
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) for (let z = J.z1 + 0.1; z < J.z0; z += 2.2) cyl(0.08, 0.08, 9, g, [x, J.y - 4.5, z], dark, undefined, 10);
  return g;
}

export function rowboat() {
  const g = new THREE.Group(), hull = plain('#e8e2d4', 0.6), trim = plain('#2f6fb8', 0.6), wood = plain('#a07650', 0.85);
  const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hull.clone());
  h.material.side = THREE.DoubleSide; h.scale.set(0.75, 0.45, 1.7); h.castShadow = h.receiveShadow = true; g.add(h);
  mesh(new THREE.TorusGeometry(1, 0.05, 8, 40), trim, g, [0, 0, 0], [Math.PI / 2, 0, 0], [0.75, 1.7, 1]);
  for (const z of [-0.5, 0.45]) box(1.3, 0.05, 0.28, g, [0, -0.08, z], wood);
  return g;
}

export function buildSet(scene, assets, Character) {
  const S = { scene };
  const lk = lake(scene); S.water = lk.water; S.ripples = lk.nm;
  S.jetty = jetty(scene, JETTY); jetty(scene, GJETTY, 1.4);
  // the narrator's yard: house, workbench, the launch crane
  house(scene, [8, 0, 24], deg(195), { name: 'narr_house' });
  S.bench = group(scene, [-2.6, 0, 17], [0, deg(10), 0], 'bench');
  box(2.4, 0.08, 1.1, S.bench, [0, 0.86, 0], plain('#c89a62', 0.75), 0.02);
  for (const [x, z] of [[1.1, 0.45], [-1.1, 0.45], [1.1, -0.45], [-1.1, -0.45]]) box(0.07, 0.82, 0.07, S.bench, [x, 0.41, z], plain('#a87b4f', 0.8));
  S.crane = group(scene, [2.2, 0, 13.4], [0, 0, 0], 'crane');
  const yel = soft('#f2b705'), steel = metal('#9aa0a6', 0.4);
  box(0.9, 0.3, 0.9, S.crane, [0, 0.15, 0], plain('#55595e', 0.6));
  cyl(0.12, 0.14, 4.2, S.crane, [0, 2.1, 0], yel, undefined, 16);
  S.boom = group(S.crane, [0, 4.1, 0]);
  box(0.18, 0.18, 6.2, S.boom, [0, 0, -2.8], yel);
  S.hookLine = ropeMesh(plain('#2b2b2b', 0.6), 0.015); scene.add(S.hookLine);
  // far bank: grandma's cottage behind her jetty
  house(scene, [-11, 0, -21], deg(0), { name: 'gran_cottage', w: 7, d: 6, h: 3.6, floors: 1, roofH: 2.2 });
  fence(scene, [-30, -14.2], [-14, -14.2], 0.9); fence(scene, [-6, -14.2], [20, -14.2], 0.9);
  house(scene, [-30, 0, 26], deg(160), { name: 'h3' });
  house(scene, [26, 0, -26], deg(-15), { name: 'h4', w: 6 });
  house(scene, [32, 0, 22], deg(200), { name: 'h5' });
  const T = [[-9, 18, 0, 3.2], [12, 17, 1, 3], [-16, 21, 2, 3.4], [20, 19, 0, 3.1], [-20, -19, 1, 3.3], [6, -20, 2, 3], [16, -22, 0, 3.4], [-28, 16, 2, 3.2], [28, -18, 1, 3]];
  T.forEach(([x, z, k, s], i) => tree(scene, assets, [x, 0, z], k, s, i * 1.7));
  S.boat = rowboat(); scene.add(S.boat);
  S.rod = group(scene, [0, 0, 0], [0, 0, 0], 'rod');
  cyl(0.015, 0.025, 2.4, S.rod, [0, 1.2, 0], plain('#3a2a20', 0.5), undefined, 8);
  S.line = ropeMesh(plain('#f4f4f4', 0.5), 0.005); scene.add(S.line);
  S.rope = ropeMesh(plain('#c8a46a', 0.9), 0.025, true); scene.add(S.rope);

  S.ben = new Character(scene, 'ben', assets.faces);
  S.narr = new Character(scene, 'narrator', assets.faces);
  S.neigh = new Character(scene, 'neighbour', assets.faces);
  S.granCh = new Character(scene, 'grandma', assets.faces);
  // swimming goggles for Ben
  S.goggles = group(S.ben.head, [0, 0.3, 0.255]);
  for (const s of [1, -1]) mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 20), soft('#21b3c9', { rough: 0.3 }), S.goggles, [0.09 * s, 0, 0]);
  for (const s of [1, -1]) mesh(new THREE.CircleGeometry(0.07, 20), glass('#bfe9f5', 0.45), S.goggles, [0.09 * s, 0, 0.005]);
  box(0.62, 0.035, 0.02, S.goggles, [0, 0, -0.02], soft('#21b3c9'));
  // grandma's snorkel mask
  S.snorkel = group(S.granCh.head, [0, 0.3, 0.27]);
  box(0.3, 0.14, 0.06, S.snorkel, [0, 0, 0], glass('#d8f4ff', 0.4), 0.03);
  cyl(0.02, 0.02, 0.45, S.snorkel, [0.2, 0.15, -0.05], soft('#ffcc00'), undefined, 8);
  return S;
}

export function resetSet(S, t) {
  for (const c of [S.ben, S.narr, S.neigh, S.granCh]) {
    c.reset(); c.root.visible = false; c.root.rotation.set(0, 0, 0);
    if (c.root.parent !== S.scene) S.scene.add(c.root);
  }
  S.goggles.visible = true; S.snorkel.visible = false; S.waterAlpha = null;
  S.boat.visible = true; S.rod.visible = false;
  for (const r of [S.line, S.rope, S.hookLine]) r.visible = false;
  S.ripples.offset.set(t * 0.02, t * 0.035);
  CAUSTIC.t.value = t;
}
