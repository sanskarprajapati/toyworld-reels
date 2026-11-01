// The toy submarine (clear ballast tanks with a visible water level, periscope, hatch, propeller), the barrel with its rock,
// and the beach ball. Origins: sub = hull centre, bow along +z; barrel = base centre; ball = centre.
import * as THREE from 'three';
import { plain, soft, metal, glass, box, cyl, ball, mesh, group, deg, clamp } from '../lib/util.js';
import { TRANSP } from './props.js';

export const SUB = { r: 0.8, body: 2.6, tankR: 0.32, tankL: 2.5, tankX: 0.98, tankY: -0.3, mast: 2.2 };

export function buildSub(scene) {
  const U = group(scene, [0, 0, 0], [0, 0, 0], 'sub'); U.rotation.order = 'YXZ';
  const yel = new THREE.MeshPhysicalMaterial({ color: '#ffcf2e', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.3 });
  const brass = metal('#d9a441', 0.3), dark = plain('#3a3f46', 0.5), steel = metal('#b8bcc2', 0.3);
  // hull: an open-fronted cylinder with a rounded stern; the bow is a glass dome with Ben's cockpit behind it
  mesh(new THREE.CylinderGeometry(SUB.r, SUB.r, SUB.body, 32, 1, true), yel.clone(), U, [0, 0, 0], [Math.PI / 2, 0, 0]).material.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(SUB.r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), yel, U, [0, 0, -SUB.body / 2], [-Math.PI / 2, 0, 0]);
  cyl(SUB.r * 0.98, SUB.r * 0.98, 0.04, U, [0, 0, -0.1], plain('#4a5560', 0.7), [Math.PI / 2, 0, 0], 32);   // cockpit bulkhead
  box(1.2, 0.08, 1.3, U, [0, -0.6, 0.65], plain('#4a5560', 0.7));                                           // cockpit floor
  box(0.9, 0.25, 0.08, U, [0, -0.15, 1.15], plain('#30363d', 0.5), 0.03);                                   // dashboard
  for (let i = 0; i < 3; i++) ball(0.035, U, [-0.25 + i * 0.25, -0.05, 1.2], new THREE.MeshStandardMaterial({ color: ['#ff4d4d', '#7cff6b', '#ffd23f'][i], emissive: ['#ff4d4d', '#7cff6b', '#ffd23f'][i], emissiveIntensity: 0.8 }), null, 10);
  const dome = mesh(new THREE.SphereGeometry(SUB.r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass('#c8f0ff', 0.18), U, [0, 0, SUB.body / 2], [Math.PI / 2, 0, 0]);
  dome.castShadow = false; dome.renderOrder = 4; TRANSP.push(dome);
  mesh(new THREE.TorusGeometry(SUB.r, 0.06, 10, 36), brass, U, [0, 0, SUB.body / 2]);
  for (const s of [1, -1]) for (const z of [-0.8, 0.1]) {
    const g = group(U, [s * 0.79, 0.15, z], [0, s * Math.PI / 2, 0]);
    mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 24), brass, g);
    mesh(new THREE.CircleGeometry(0.17, 24), plain('#2a4a5a', 0.2, { extra: { envMapIntensity: 1.5 } }), g, [0, 0, -0.01]);
  }
  for (let i = -4; i <= 4; i++) mesh(new THREE.TorusGeometry(SUB.r + 0.005, 0.018, 6, 40), dark, U, [0, 0, i * 0.32]);   // hull seams
  // conning tower, hatch, periscope
  const tower = box(0.85, 0.8, 1.2, U, [0, 0.95, -0.2], yel, 0.18);
  U.userData.hatch = group(U, [0, 1.37, -0.55]);
  cyl(0.3, 0.3, 0.07, U.userData.hatch, [0, 0, 0.3], steel, undefined, 24);
  const peri = group(U, [0, 1.3, 0.15]);
  cyl(0.06, 0.06, SUB.mast, peri, [0, -SUB.mast / 2 + 0.2, 0], steel, undefined, 12);
  box(0.16, 0.16, 0.3, peri, [0, 0.25, 0.08], steel, 0.03);
  mesh(new THREE.CircleGeometry(0.055, 16), plain('#1a2a3a', 0.1), peri, [0, 0.25, 0.235]);
  U.userData.peri = peri;
  // stern: propeller and rudder
  const prop = group(U, [0, 0, -SUB.body / 2 - 0.95]);
  cyl(0.1, 0.1, 0.25, prop, [0, 0, 0], brass, [Math.PI / 2, 0, 0], 16);
  for (let i = 0; i < 3; i++) { const b = box(0.12, 0.5, 0.04, prop, [0, 0, 0], brass, 0.02); b.geometry.translate(0, 0.27, 0); b.rotation.set(0, deg(25), i * Math.PI * 2 / 3); }
  U.userData.prop = prop;
  const rud = group(U, [0, 0, -SUB.body / 2 - 0.6]);
  box(0.06, 0.9, 0.5, rud, [0, 0, -0.2], yel, 0.02);
  U.userData.rudder = rud;
  box(1.6, 0.05, 0.4, U, [0, 0, -SUB.body / 2 - 0.55], yel, 0.02);
  // clear ballast tanks with water inside (clipped flat at the level), straps, vents
  const tankM = new THREE.MeshPhysicalMaterial({ color: '#e8f6fb', roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  U.userData.tanks = [1, -1].map(s => {
    const g = group(U, [s * SUB.tankX, SUB.tankY, 0]);
    const shell = mesh(new THREE.CapsuleGeometry(SUB.tankR, SUB.tankL, 8, 24), tankM, g, [0, 0, 0], [Math.PI / 2, 0, 0]);
    shell.castShadow = false; shell.renderOrder = 5; TRANSP.push(shell);
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const wm = new THREE.MeshStandardMaterial({ color: '#2aa3c9', roughness: 0.2, transparent: true, opacity: 0.85, clippingPlanes: [plane], clipShadows: true, side: THREE.DoubleSide });
    const water = mesh(new THREE.CapsuleGeometry(SUB.tankR * 0.94, SUB.tankL, 8, 24), wm, g, [0, 0, 0], [Math.PI / 2, 0, 0]);
    water.renderOrder = 4;
    for (const z of [-0.9, 0.9]) mesh(new THREE.TorusGeometry(SUB.tankR + 0.02, 0.03, 6, 24), dark, g, [0, 0, z]);
    cyl(0.04, 0.04, 0.12, g, [0, SUB.tankR + 0.04, 1.1], steel, undefined, 8);     // top vent
    cyl(0.04, 0.04, 0.12, g, [0, -SUB.tankR - 0.04, -1.1], steel, undefined, 8);   // bottom flood port
    return { g, water, plane };
  });
  return U;
}

const _n = new THREE.Vector3(), _p = new THREE.Vector3(), _m = new THREE.Matrix3();
// fill 0..1 per tank: the water surface stays level in the world while the hull tilts
export function setTanks(U, fill) {
  U.updateMatrixWorld(true);
  U.userData.tanks.forEach(tk => {
    tk.g.updateMatrixWorld(true);
    const c = _p.setFromMatrixPosition(tk.g.matrixWorld), lvl = c.y - SUB.tankR + 2 * SUB.tankR * clamp(fill);
    tk.plane.normal.set(0, -1, 0); tk.plane.constant = lvl;      // keep points with y < lvl
    tk.water.visible = fill > 0.01;
  });
}

export function poseSub(U, pos, o = {}) {
  U.visible = true; U.position.set(...pos);
  U.rotation.set(o.pitch ?? 0, o.yaw ?? 0, o.roll ?? 0);
  U.userData.prop.rotation.z = (o.spin ?? 0);
  U.userData.rudder.rotation.y = o.rudder ?? 0;
  U.userData.peri.position.y = 1.3 + SUB.mast * 0.85 * (o.peri ?? 0);
  U.userData.hatch.rotation.x = -deg(110) * (o.hatch ?? 0);
  setTanks(U, o.fill ?? 0);
}

// ---------- the barrel (with its rock) and the beach ball ----------
export function buildBarrel(scene) {
  const g = group(scene, [0, 0, 0], [0, 0, 0], 'barrel'), wood = plain('#a8743f', 0.8), band = metal('#5d6066', 0.4);
  const staves = new THREE.CylinderGeometry(0.47, 0.42, 1.05, 24, 4, true);
  const p = staves.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 + 0.08 * Math.cos(y / 0.525 * Math.PI / 2); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  staves.computeVertexNormals();
  mesh(staves, plain('#a8743f', 0.8, { extra: { side: THREE.DoubleSide } }), g, [0, 0.525, 0]);
  cyl(0.42, 0.42, 0.05, g, [0, 0.03, 0], wood, undefined, 24);
  for (const y of [0.15, 0.9]) mesh(new THREE.TorusGeometry(0.47, 0.02, 6, 32), band, g, [0, y, 0], [Math.PI / 2, 0, 0]);
  const rock = mesh(new THREE.DodecahedronGeometry(0.42, 1), plain('#7d7a74', 0.9), g, [0, -0.45, 0], [0.4, 0.3, 0], [1, 0.8, 1]);
  g.userData.rock = rock;
  return g;
}

export function buildBeachBall(scene) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d'), cols = ['#ff4d4d', '#ffffff', '#ffd23f', '#ffffff', '#3ec1ff', '#ffffff'];
  cols.forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 512 / 6, 0, 512 / 6 + 1, 256); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.SphereGeometry(0.9, 48, 24), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.25, clearcoat: 0.8 }), scene);
}
