// Master set: HDRI sky, sun, floating island (striped lawn with grass grain, soil cliffs), olive trees, houses.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { plain, box, mesh, group, soft } from './util.js';

export const A = 'assets/';   // film folder symlinks ../assets here
export const ISLAND = { x0: -90, x1: 90, z0: -110, z1: 90, depth: 18 };
export const WALL = '#eef0f0', ROOF = '#d9603b', WINDOW = '#3d7fc4', DOOR = '#2d78a8';

const tex = new THREE.TextureLoader();
const loadTex = (p, srgb = true) => new Promise((res, rej) => tex.load(A + p, t => {
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; res(t);
}, undefined, rej));

export async function loadAssets(renderer) {
  const [hdr, grass, grassN, soil, soilN, eyesPlain, eyesFreckles, mouths, trees] = await Promise.all([
    new RGBELoader().loadAsync(A + 'hdri/sky_2k.hdr'),
    loadTex('textures/grass_ground_diff.jpg'), loadTex('textures/grass_ground_nor.jpg', false),
    loadTex('textures/rocky_trail_diff.jpg'), loadTex('textures/rocky_trail_nor.jpg', false),
    loadTex('faces/eyes_plain.png'), loadTex('faces/eyes_freckles.png'), loadTex('faces/mouths.png'),
    Promise.all(['island_tree_01', 'island_tree_02', 'island_tree_03'].map(n => new GLTFLoader().loadAsync(`${A}trees/${n}/${n}.gltf`))),
  ]);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  const envMap = pm.fromEquirectangular(hdr).texture;
  for (const t of [eyesPlain, eyesFreckles, mouths]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; }
  const treeSrc = trees.map(g => {
    const root = g.scene;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      const m = o.material;
      if (m.transparent || /leaves/.test(m.name)) { m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; }   // cut-out leaves (like EEVEE dithered)
      m.side = THREE.DoubleSide;
    });
    return root;
  });
  return { hdr, envMap, grass, grassN, soil, soilN, faces: { plain: eyesPlain, freckles: eyesFreckles, mouths }, treeSrc };
}

export function sky(scene, assets, o = {}) {
  scene.background = assets.hdr;
  scene.environment = assets.envMap;
  scene.environmentIntensity = o.env ?? 0.75;
  scene.backgroundIntensity = o.bg ?? 1.0;
  const rot = o.rot ?? 2.0;
  scene.backgroundRotation = new THREE.Euler(0, rot, 0);
  scene.environmentRotation = new THREE.Euler(0, rot, 0);
  const sun = new THREE.DirectionalLight(0xfff6ea, o.sun ?? 2.6);
  sun.userData.dir = new THREE.Vector3(...(o.sunDir ?? [0.45, 0.62, 0.64])).normalize();
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  return sun;
}

// keep the sun's shadow box centred on the action (size = metres across)
export function aimSun(sun, center, size = 30) {
  const c = center.isVector3 ? center : new THREE.Vector3(...center);
  sun.target.position.copy(c);
  sun.position.copy(c).addScaledVector(sun.userData.dir, 80);
  const cam = sun.shadow.camera, h = size / 2;
  if (cam.right !== h) { cam.left = -h; cam.right = h; cam.top = h; cam.bottom = -h; cam.near = 1; cam.far = 200; cam.updateProjectionMatrix(); }
}

function lawnMaterial(assets, a = '#3f8a30', b = '#5ea844', stripe = 3.6) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.92, normalMap: assets.grassN, normalScale: new THREE.Vector2(0.7, 0.7) });
  m.onBeforeCompile = sh => {
    sh.uniforms.grassMap = { value: assets.grass };
    sh.uniforms.colA = { value: new THREE.Color(a) };
    sh.uniforms.colB = { value: new THREE.Color(b) };
    sh.uniforms.stripe = { value: stripe };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform sampler2D grassMap; uniform vec3 colA, colB; uniform float stripe;')
      .replace('#include <map_fragment>', `
        float st = smoothstep(-0.12, 0.12, sin(vWP.x * PI / stripe));
        vec3 base = mix(colA, colB, st);
        float g = dot(texture2D(grassMap, vWP.xz * 0.35).rgb, vec3(0.299, 0.587, 0.114));
        float g2 = dot(texture2D(grassMap, vWP.xz * 0.06 + 0.37).rgb, vec3(0.299, 0.587, 0.114));
        float grain = mix(0.72, 1.18, clamp((g - 0.15) / 0.3, 0.0, 1.0)) * mix(0.9, 1.08, clamp((g2 - 0.15) / 0.3, 0.0, 1.0));
        diffuseColor.rgb *= base * grain;`);
  };
  return m;
}

// hole = {z0, z1}: a channel across the whole island along x (e.g. a river); the lawn and slab stop at its edges
export function island(scene, assets, hole = null) {
  const I = ISLAND, w = I.x1 - I.x0, d = I.z1 - I.z0;
  const root = group(scene, [0, 0, 0], [0, 0, 0], 'island');
  const lawnN = assets.grassN.clone(); lawnN.repeat.set(w * 0.35, d * 0.35); lawnN.needsUpdate = true;
  const lawn = lawnMaterial({ ...assets, grassN: lawnN });
  const soilT = assets.soil.clone(); soilT.repeat.set(w / 4, I.depth / 4); soilT.needsUpdate = true;
  const soilN = assets.soilN.clone(); soilN.repeat.copy(soilT.repeat); soilN.needsUpdate = true;
  const soilM = new THREE.MeshStandardMaterial({ map: soilT, normalMap: soilN, normalScale: new THREE.Vector2(1.5, 1.5), color: '#d08050', roughness: 0.95 });
  const strips = hole ? [[I.z0, hole.z0], [hole.z1, I.z1]] : [[I.z0, I.z1]];
  for (const [a, b] of strips) {
    const top = new THREE.Mesh(new THREE.PlaneGeometry(w, b - a), lawn);
    top.rotation.x = -Math.PI / 2; top.position.set((I.x0 + I.x1) / 2, 0, (a + b) / 2);
    top.receiveShadow = true; root.add(top);
    const slab = box(w, I.depth, b - a, root, [(I.x0 + I.x1) / 2, -I.depth / 2 - 0.02, (a + b) / 2], soilM);
    slab.castShadow = false;
  }
  root.userData.soilM = soilM;
  return root;
}

export function tree(scene, assets, pos, kind = 0, scale = 3, rotY = 0) {
  const t = assets.treeSrc[kind % assets.treeSrc.length].clone();
  t.position.set(pos[0], (pos[1] ?? 0) - 0.1, pos[2]); t.rotation.y = rotY; t.scale.setScalar(scale);
  scene.add(t);
  return t;
}

function roofGeo(w, d, h) {
  const hd = d / 2 + 0.35, s = new THREE.Shape();
  s.moveTo(-hd, 0); s.lineTo(hd, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w + 0.6, bevelEnabled: false });
  g.translate(0, 0, -(w + 0.6) / 2); g.rotateY(Math.PI / 2);
  return g;
}

// box house with a gable roof; front (door) faces +Z in its own frame
export function house(scene, pos, rotY = 0, o = {}) {
  const w = o.w ?? 7, d = o.d ?? 6, h = o.h ?? 5.5, floors = o.floors ?? 2;
  const root = group(scene, pos, [0, rotY, 0], o.name ?? 'house');
  const wall = plain(o.wall ?? WALL, 0.85);
  box(w, h, d, root, [0, h / 2, 0], wall);
  mesh(roofGeo(w, d, o.roofH ?? 2.4), plain(ROOF, 0.7), root, [0, h, 0]);
  windows(root, w, d, h, floors, o.door !== false);
  return root;
}

export function windows(root, w, d, h, floors, door = true, cols = null) {
  const win = plain(WINDOW, 0.25, { extra: { envMapIntensity: 1.4 } }), trim = plain('#f7f7f7', 0.6);
  cols = cols ?? (w > 6 ? 3 : 2);
  const out = [];
  for (let f = 0; f < floors; f++) {
    const y = floors > 1 ? 1.5 + f * (h / floors) : h * 0.55;
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (w / cols);
      if (door && f === 0 && c === Math.floor(cols / 2)) { box(1.1, 2.1, 0.08, root, [x, 1.05, d / 2 + 0.02], plain(DOOR, 0.5)); continue; }
      out.push(box(1.0, 1.3, 0.08, root, [x, y + 0.4, d / 2 + 0.03], win));
      box(1.25, 1.55, 0.06, root, [x, y + 0.4, d / 2 + 0.01], trim);
    }
  }
  return out;
}

export function fence(scene, a, b, height = 1, color = '#f4f4f0') {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const root = group(scene, [a[0], 0, a[1]], [0, -ang, 0]);
  const m = plain(color, 0.7), n = Math.max(2, Math.floor(len / 0.22));
  const pick = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, height, 0.05), m, n);
  const M = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { M.makeTranslation(i * 0.22, height / 2, 0); pick.setMatrixAt(i, M); }
  pick.castShadow = pick.receiveShadow = true; root.add(pick);
  for (const y of [0.3, height - 0.2]) box(len, 0.08, 0.04, root, [len / 2, y, 0.04], m);
  return root;
}
