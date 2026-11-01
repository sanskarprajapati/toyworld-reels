# Submarine (Three.js): storyboard

"Put Ben in a barrel, tie on a rock, push him in the lake. Congratulations, you've built a submarine!"
1080x1920, 30 fps, about 1:00–1:10. Same world, cast and pipeline as the balloon reel, with the same rules: no pauses (cut on the voice),
wide and medium shots (close-ups only for short reactions), ~50 shots of 1–1.5 s, fast camera and acting, many props, diagrams and labels.
Order: storyboard → 3D and animation → script and voice fitted to shot lengths → assembly. Opening (shots 01–11, ~15 s) first for review.

## World
- **The lake** cuts across the island along x (the island's channel, like the bridge river but wide and deep): banks at z = ±13,
  water surface at y = −0.5, a flat sandy bed at y = −7 with sloped banks. Underwater: blue-green fog, light shafts from the surface,
  rippling caustics on the sand, seaweed, rocks, a school of fish, a sunken bicycle.
- **Near bank (z > 13)**: the narrator's wooden jetty sticking out to z = 8, a workbench, the crane arm used to launch the sub.
- **The neighbour** dozes in a rowboat in the middle of the lake with a fishing rod.
- **Far bank (z < −13)**: grandma's cottage with a small jetty; grandma sits there with her snorkel kit.

## Cast
Ben (crew, goggles), narrator (builds), neighbour (fishing, gets flipped), grandma (punchline). All lip-synced, blinking, acting with hands.

## The submarine (toy scale)
A yellow capsule 4.2 m long, 1.6 m across, conning tower with a periscope and hatch, a big bubble porthole at the bow (Ben visible),
a propeller and rudder at the stern, and two **transparent ballast tanks** strapped along the sides so the water level inside is visible.

## Physics
- **Buoyancy** (Archimedes): the water pushes up with the weight of the water an object pushes aside: F = ρ_w·V·g.
  Heavier than the water it displaces → sinks; lighter → floats with the fraction m / (ρ_w V) under the surface; equal → hovers.
- **Barrel + rock**: ≈ 0.35 m³, 900 kg (a big rock) → net ≈ 550 kg down; it sinks at its terminal speed ≈ 4 m/s (quadratic drag) and thumps into the sand.
- **Beach ball**: 0.5 m³, 2 kg → floats almost on top; Ben pushes it under, it shoots back up (net up force ≈ 500 kg-weight) and launches him.
- **Sub**: hull volume 6 m³ (6000 kg of water), dry mass 5200 kg → floats with 87 % under; the tanks hold 1600 kg of water.
  Tank fill f sets the mass 5200 + 1600 f; terminal speed with full or empty tanks ≈ 3.6 m/s: f = 0.5 hovers, more sinks, less rises. Vertical motion is integrated with drag and added mass;
  vents open → f rises over seconds (water floods in, air bubbles out of the top vents); the pump trims f back to 0.5; blowing the tanks with
  compressed air drops f to 0 fast → it rises, faster and faster, breaches, falls back and bobs (damped spring) to its floating line.
- **Pressure**: +1 atmosphere for every 10 m of water; the hull panels creak as Ben goes deeper.
- Fish dart away from fast-moving objects. Bubbles rise at ~0.3 m/s and grow as they rise.

## Labels
SPLASH · BUOYANCY = WEIGHT OF WATER PUSHED ASIDE · SINK / FLOAT / HOVER · BALLAST TANKS · NEUTRAL · PERISCOPE · +1 atm PER 10 m · BLOW BALLAST

## Shot list
W = wide, M = medium, C = close (reaction ≤ 1 s).

| # | dur | size | Picture | Camera | Action / physics | Overlay |
|---|---|---|---|---|---|---|
| 01 | 1.3 | W | Jetty: narrator ties a big rock to a barrel; Ben stands in it with goggles | 3/4 high, push in | knot, Ben thumbs-up | |
| 02 | 1.0 | M | Narrator kicks the barrel off the jetty end | side, low | tips, falls (free fall), splash | SPLASH |
| 03 | 1.3 | W | Underwater reveal: barrel sinks rock-first, bubble trail; fish scatter | underwater, wide | terminal sink speed | |
| 04 | 1.4 | W | Thump on the sand, sand cloud; bubbles burst upward like confetti | underwater low | | confetti bubbles |
| 05 | 0.9 | C | Ben in the barrel, cheeks puffed, a few bubbles escape | close | blink, worried | |
| 06 | 1.2 | W | From the jetty: narrator hauls the rope, barrel pops up, Ben gasps and spits water | above water | haul, splash | |
| 07 | 1.6 | M | Table demo: a block lowered into a brim-full tank; spilled water runs into a cup on a scale | 3/4 over the table | water level, spill stream | BUOYANCY = WEIGHT OF WATER PUSHED ASIDE |
| 08 | 1.2 | M | Diagram underwater: the rock with a big down arrow (weight) and a smaller up arrow (buoyancy) | underwater | arrows grow | |
| 09 | 1.3 | W | Ben tries a giant beach ball: pushes it under … | above water | buoyancy spring | |
| 10 | 1.3 | M | … it shoots up and launches him; splash | low | ballistic | |
| 11 | 1.5 | M | Glass tank: rock sinks, ball floats, a half-full jar hovers in the middle | side | sink / float / hover | SINK · FLOAT · HOVER |
| 12 | 1.4 | W | On the jetty the sub assembles: hull halves, tower, porthole pop on | high wide, orbit | pop-ins, sparks | |
| 13 | 1.3 | M | Cutaway: the two clear ballast tanks, empty | side | | BALLAST TANKS |
| 14 | 1.0 | M | Ben climbs in through the hatch with a fishing net | medium | climb | |
| 15 | 1.2 | W | Crane lowers the sub into the lake; it floats high | wide | splash, bob to the waterline | |
| 16 | 1.3 | M | Ben opens the vents: water floods into the tanks, air bubbles out of the top | side at the waterline | tank level rises | |
| 17 | 1.4 | W | Split view at the surface: the sub slips under | half above, half below | sinks | |
| 18 | 1.2 | W | Too heavy: it sinks to the bottom, thump, sand | underwater | | |
| 19 | 0.9 | C | Ben through the porthole, wobbling | close | | |
| 20 | 1.3 | M | Pump runs, the tank level drops to half: the sub lifts off and hangs still | side | net force zero | NEUTRAL |
| 21 | 1.4 | W | Underwater hero: sub hovering, fish school, light shafts | wide, orbit | | |
| 22 | 0.9 | C | A fish kisses the porthole; Ben grins | close | | |
| 23 | 1.2 | M | Propeller spins, sub moves off, rudder turns | stern | | |
| 24 | 1.3 | W | Glides past a seaweed forest and a sunken bicycle | tracking | weeds sway in the wake | |
| 25 | 1.2 | M | Periscope rises through the surface | split at the surface | | PERISCOPE |
| 26 | 1.0 | M | Periscope view (round mask): the neighbour dozing in his rowboat | POV | | |
| 27 | 1.2 | W | Above water: the neighbour's boat, line in the water | wide | bob | |
| 28 | 1.2 | W | Underwater: the hook drifts down and snags the sub's rail | underwater | | |
| 29 | 0.9 | M | The rod bends double: "Big one!" | medium | lip sync | |
| 30 | 1.3 | W | The sub tows the rowboat across the lake; neighbour hangs on to the rod | wide above | towed boat, wake | |
| 31 | 1.0 | C | Neighbour: "Biggest catch of my life!" | close | lip sync | |
| 32 | 1.2 | W | The sub dives deeper, the line goes taut | underwater | | |
| 33 | 1.4 | M | Diagram: depth gauge; pressure rings squeeze the hull | side | +1 atm per 10 m | +1 atm PER 10 m |
| 34 | 0.9 | C | Hull creaks, a rivet pops, Ben sweats | close | | |
| 35 | 1.0 | W | A giant catfish eye fills the porthole | close then pull | | |
| 36 | 1.3 | M | Ben slams the air valve: bubbles blast from the tank bottoms, levels drop | side | blow tanks | BLOW BALLAST |
| 37 | 1.4 | W | Rising faster and faster, bubble trail | underwater, looking up | | |
| 38 | 1.2 | W | Breach right under the rowboat: boat flips, neighbour flies | above water | ballistic | |
| 39 | 1.0 | M | Neighbour splashes in | low | splash | |
| 40 | 1.3 | W | Sub bobs and settles; the upturned rowboat floats beside it | wide | damped bob | |
| 41 | 0.9 | M | Neighbour on the upturned boat, a fish on his head | medium | lip sync | |
| 42 | 1.3 | W | Ben pops the hatch, waves; the sub putters to grandma's jetty | wide | | |
| 43 | 1.4 | W | Hero wide, confetti: "Congratulations, you've built a submarine!" | crane | | confetti |
| 44 | 1.4 | M | Grandma with her snorkel and flippers: "They sell snorkels, dear." | medium | lip sync | |
| 45 | 1.0 | C | Ben deadpan, water pours from his ears | close | slow blink | |
