# Kit reference (`lib/` in every film)

Coordinates: Y up, 1 unit = 1 m, characters about 1.5 m tall and facing +Z, feet at their root.

## stage.js
- `makeStage({ssaa})` → `st = {renderer, scene, camera, post}`; `timeline(shots, timing)` → `T` with `start(id)`, `dur(id)`, `total`.
- `install(st, T, beforeEachFrame, {dur})` defines the page contract (`window.render(t)`); the renderer calls it per frame.
- `shoot(st, pos, target, lensMM, {t, shake, aper, focus, roll})` places the camera (lens on a 36 mm tall sensor: 20 = wide,
  24-26 = medium, 28-34 = close). `aper` bigger = shallower depth of field.

## world.js
`loadAssets(renderer)`, `sky(scene, assets)` → sun, `aimSun(sun, centre, size)` (call every shot: shadow box follows the
action), `island(scene, assets, hole?)` (hole `{z0, z1}` cuts a channel for a river or lake), `house(scene, pos, rotY, {w, d, h,
floors, roofH})` (ridge height = h + roofH), `tree(scene, assets, pos, kind, scale)`, `fence(scene, a, b, h)`.

## character.js / acting.js
`new Character(scene, 'ben' | 'narrator' | 'neighbour' | 'grandma', assets.faces)`; per frame: `ch.reset()` (in resetSet),
`ch.set(pos, rotY)`, `ch.setPose(name[, name2, k])` (stand, cheer, wave, point, push, sit, hold, fists, arms_up, hip, haul_hi,
haul_lo, slump, peer, balance, shrug, thumbs, sip), `ch.arm('L'|'R', flex, abduction, yaw)`, `ch.face.set(eyes, mouth)`.
Eyes: open blink wide angry lazy shut happy sad raised dizzy look_l look_r. Mouths: smile grin closed o talk1-3 scream frown flat shout yawn.
Acting: `idle`, `eyes(ch, t, state, blink)`, `talk(ch, t, who, {shout, rest})`, `jabber`, `flail`, `nod`, `shake`, `look`,
`tremble`, `bounce`, `pump`. Accessories (goggles, shades, snorkel) are groups added to `ch.head`.

## rig.js
`world(obj, localPoint)`, `headPos(ch)`, `arr(v)`, `mix(a, b, k)`, `walk(ch, phase)`, `hold(ch, obj, side, offset)`,
`eat(ch, t)`, `hop(ch, t, t0, period, height, n)`, `move(st, k, [pos, target, lens], [pos, target, lens], opts)` (eased camera move).

## fx.js
`Particles(scene, n, geo, mat, spawn, {g, drag, floor, billboard, grow})` with `update(t, t0, origin)`; ready-made
`confetti`, `puff` (dust/smoke/steam, camera-facing), `sparks`, `sweat`; `ballistic()`.

## util.js
Materials `soft` (vinyl), `plain`, `metal`, `glass`; builders `box`, `cyl`, `ball`, `mesh`, `group`; `ropeMesh` + `setRope(m, points)`
for ropes, cables and fishing lines; easing `ss`, `eo`, `eio`, `back`; `keys(list, t)`; `noise1`, `deg`, `clamp`, `lerp`.

## Gotchas (each of these cost a re-render)
- `fx.js ALL` is hidden at the start of every frame. Static transparent meshes (glass, tank water, a dome) go in `TRANSP`
  instead; putting them in ALL makes them vanish.
- Every frame must reset all state it touches (scales, visibility, colours, parents): attach a character to a vehicle with
  `vehicle.add(ch.root)` and let resetSet put it back in the scene.
- Build per-frame meshes once; change positions, not geometry, except ropes (`setRope`) and deforming shapes.
- Billboards must be aimed after the camera is placed (`aimBillboards()` runs after the shot).
- An object hidden inside another shows as a solid blob through glass: a capsule hull behind a glass dome reads as an
  opaque ball. Open the hull where the window is.
- Plane rotations: check that slopes rise towards the bank; a wrong sign makes a wall across the view.
- Never name a shell function `times` (a POSIX builtin).
- Kokoro swallows the first phoneme; the voice tool prefixes ", " automatically. Ids like `12b` sort after `12`.
