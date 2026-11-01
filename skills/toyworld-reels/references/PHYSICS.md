# Making the physics look right

Viewers notice wrong physics before anything else. Every motion is a function of global time `t`, computed once against
the timeline (`makePhysics(T)`), so any frame renders on its own and shots can be re-timed.

## Closed forms first
- Free fall / thrown objects: `ballistic(p0, v0, age, g, drag)` from `kit/fx.js`.
- Bounces: restitution e; each bounce launches at e·v and lasts 2v/g (see the starter's ball).
- Floating objects settle as a damped spring around their waterline: `bob(u, x0, v0, w, zeta)` (submarine physics.js).
- Sliding with friction: `x = v0 u − ½ μ g u²` until it stops at `v0/(μg)`.
- Pendulum sway for anything hanging (the balloon basket): small angle driven by acceleration changes.

## Authored speed phases, solved to hit the beats
For a vehicle whose force you control (balloon burner, ballast tanks), author the vertical speed as smooth phases
(`[t, v]` keys with smoothstep between) and solve each phase's speed so the beats land in their shots:
height is linear in each phase speed, so one secant step is exact (`lin()` in both examples). Then:
- show the controls the motion implies (the burner gauge temperature, the tank water level) - the cause stays visible;
- keep every speed under the physical limit: the balloon's cold envelope falls at most ~7 m/s, a plastic bag ~1.6 m/s,
  a sub with full/empty tanks ~3.6 m/s. If a solved speed breaks a limit, move the beat (earlier vent, later contact),
  don't accept it;
- a lag is a feature: after the burner fires, the balloon keeps sinking until the speed crosses zero (the roof scrape).
A free ODE with tuned knobs drifted out of the shots and needed absurd time scaling; avoid it.

## Let the physics place the set
Compute where the action happens, then build the set there: the neighbour's roof ridge under the balloon's lowest point,
the lounger where the dropped sandwich lands, the pool where the sliding roof tile lands, grandma's garden where the
basket stops, the towed boat gliding to rest exactly over the surfacing sub.

## Re-check after every re-time
`tw voice timing` changes shot lengths. Re-run your physics check (print the solved speeds and which shot each contact
time falls in) and fix any beat that left its shot or any speed over its limit.

## Small truths that sell it
Bubbles rise and grow; fish dart away from anything big and fast; dust and sand puff on impact; the camera kicks on a
hit; a hanging basket tilts when the balloon accelerates; water levels stay level when the hull tilts (clipping plane).
