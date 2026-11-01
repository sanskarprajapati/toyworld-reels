# Hot-air balloon (Three.js): storyboard

"Hold a thin plastic bag over a fire and it flies. Congratulations, you've built a hot-air balloon!"
1080x1920, 30 fps, about 1:05. Same world, cast and look as the elevator and bridge reels, same pipeline.
What changes this time (the user's notes): no pauses, wide and medium framing (close-ups only for short reactions),
~50 shots of 1–1.5 s, faster camera and acting, many more props, inserts, diagrams and labels.
Order of work: storyboard → 3D and animation → script and voice fitted to shot lengths → assembly.
The opening (shots 01–12, ~15 s) is rendered first for review.

## World
The floating island with no river. Wind blows from the launch yard towards the neighbour's house, then (higher up) towards grandma's.
- **Launch yard** at the origin: the narrator's house behind, a campfire, a garden table, olive trees, a hedge.
- **Neighbour's house** downwind (+x, about 30 m away): a pool with a sun lounger beside it. The neighbour sunbathes.
- **Grandma's cottage** further on, past the neighbour (the high wind carries the balloon there): a garden with a washing line.
- Floating-island look from the air: lawn top, soil cliffs, sky all around.

## Cast
- **Ben**: the pilot. Orange hoodie, spiky hair. Eats a sandwich. Lip-synced lines.
- **Narrator ("you")**: green shirt, blue cap. Builds things.
- **Neighbour**: his bedsheets become the balloon; the balloon scrapes his roof. Lip-synced line.
- **Grandma**: the balloon lands in her garden. Lip-synced punchline.

## The balloon (toy scale)
Envelope 11 m tall, 9 m wide, about 600 m³, striped in coloured gores (the neighbour's bedsheets: red, yellow, blue, white),
a parachute vent at the crown on a red rope, a skirt at the mouth, a burner frame with two gas bottles, a laundry-basket gondola.

## Physics
- **Why it floats**: air at 100 °C is about a fifth less dense than air at 20 °C (ρ ∝ 1/T). Lift = V·ρ_cold·(1 − T_cold/T_hot)·g:
  about 0.25 kg per cubic metre. The thin bag (0.1 m³, 10 g) lifts 25 g, so it flies with a cookie but not with Ben.
  The balloon needs T_hot ≈ 85 °C just to hover with Ben, basket, burner and envelope (≈ 130 kg).
- **Flight** is integrated once over the whole timeline (state: height, vertical speed, air temperature inside):
  the air inside cools towards the outside (time constant a few seconds, toy-compressed), the burner adds heat, lift and weight
  give the acceleration, plus quadratic drag and the added mass of the air the envelope pushes aside. So the balloon answers the
  burner **late**: it keeps sinking for a moment after the burner fires (shot 31) and keeps rising after the burner stops.
- **Drift**: the horizontal velocity relaxes towards the wind at the balloon's height. Low wind blows +x (to the neighbour's),
  high wind blows −z (to grandma's). The neighbour's roof and grandma's garden are placed where the integrated path goes.
- **Vent**: opening the vent dumps hot air (the inside temperature drops fast) → descent. Landing: the basket touches down with the
  descent speed, bounces once, the wind drags the envelope, which pulls the basket over and along the lawn (friction), then the
  envelope collapses as it cools.
- **Falls** (bag, sandwich, roof tiles, cookie) are free falls with light drag. Wind-tossed things bob as damped springs.
- Every shot starts from the state the previous one ended in.

## Labels
HOT AIR = LIGHTER · 25 g · 0.25 kg PER m³ · 600 m³ · 100 °C → 60 °C · WIND LAYERS · VENT · impacts (BONK, CRUNCH)

## Shot list
W = wide (whole set + characters), M = medium (full body + surroundings), C = close (reaction only, ≤ 1 s).

| # | dur | size | Picture | Camera | Action / physics | Overlay |
|---|---|---|---|---|---|---|
| 01 | 1.3 | W | Yard: narrator holds a thin plastic bag mouth-down over a campfire; Ben squats beside with a sandwich | 3/4 high, fast push in | flames lick, bag sides start to fill | |
| 02 | 1.0 | M | The bag puffs up, wrinkles smooth out; narrator lets go | low, side | bag volume eases to full, fingers open | |
| 03 | 1.2 | W | Bag lifts and floats up past camera; Ben's head tracks it | low, tilt up | rise with drag, gentle wobble | |
| 04 | 1.4 | W | High wide: bag above the trees, the two tiny below; confetti bursts | crane down from above | bag drifts with the wind | confetti |
| 05 | 0.9 | C | Ben: mouth open, sandwich halfway | close | jumps once | |
| 06 | 1.6 | M | Insert on the table: two glass boxes on a balance. Blue balls (cold) slow and packed; red balls (hot) fast and spread | 3/4 over the table | the hot box rises, the balance tips | HOT AIR = LIGHTER |
| 07 | 1.1 | C | Inside the hot box: red balls zip, a few escape out the open bottom | top-down tight | ball count drops | |
| 08 | 1.2 | W | The bag cools in the sky and drifts back down … | wide from the lawn | slow sink | |
| 09 | 0.9 | M | … over Ben's head | medium | bag drapes over him, he freezes | |
| 10 | 1.3 | M | Narrator ties the hot bag to a cookie: it lifts the cookie | side, table height | cookie rises | 25 g |
| 11 | 1.2 | M | Ben ties the bag to his belt and jumps: nothing; bag tugs feebly | medium wide | Ben hops twice, bag strains | |
| 12 | 1.3 | M | One glowing 1 m³ cube of hot air pops in and floats off with Ben's sandwich (≈ 250 g); Ben grabs at it | medium | rise against the sandwich's weight | 1 m³ ≈ 250 g |
| 12b | 1.6 | W | Diagram: glowing cubes stack up into a ghost balloon outline, a counter runs to 600 | wide, pull back | cubes pop in bottom-up | 600 m³ |
| 13 | 1.4 | W | Narrator and Ben unroll a huge striped envelope across the lawn | high wide | envelope unrolls along the lawn | |
| 14 | 1.0 | M | Neighbour over the fence: "Are those my bedsheets?" | medium, over the fence | lip sync, points | |
| 15 | 1.3 | W | A big fan blows cold air into the mouth; the envelope swells lying on its side | low at the mouth | radius grows, ripples | |
| 16 | 1.0 | W | Inside the envelope looking up the striped dome | inside, up | fabric ripples | |
| 17 | 1.4 | W | Ben fires the burner: flame into the mouth; the envelope rises to stand upright, pulling the basket upright | wide side | rotation about the basket, flame | |
| 18 | 0.9 | C | Ben's face lit orange by the roaring flame, eyes squint | close | flicker | |
| 19 | 1.2 | M | Ben climbs into the basket; narrator hands him a sandwich | medium wide | climb, hand-off | |
| 20 | 1.3 | W | Lift-off: basket leaves the lawn, grass flattens, dust | low wide | lift from the integration | |
| 21 | 1.2 | W | From the ground: balloon rises out of frame, narrator waves | static low | | |
| 22 | 1.6 | W | Aerial: balloon over the floating island, houses tiny below | very wide, orbit | | ALTITUDE meter |
| 23 | 0.9 | C | Ben over the basket rim, hair in the wind, grinning | close | | |
| 24 | 1.2 | W | Ben's view down: the island, narrator tiny | POV down | | |
| 25 | 1.3 | M | Ben stops the burner to eat; the balloon starts to sink | medium wide | inside temperature falls | |
| 26 | 1.2 | M | Thermometer on the envelope drops 100 → 60 °C, down arrow | insert on the gores | needle moves | 100 °C → 60 °C |
| 27 | 1.4 | W | Balloon descends towards the neighbour's house and pool; neighbour sunbathing | wide over the pool | drift + sink | |
| 28 | 0.9 | C | Ben panics, drops his sandwich | close | | |
| 29 | 1.1 | M | Sandwich lands on the neighbour's face | medium on the lounger | free fall, splat | SPLAT |
| 30 | 1.2 | M | Ben yanks the burner lever: huge flame | medium | | |
| 31 | 1.5 | W | Still sinking for a moment (lag), the basket scrapes the roof ridge, tiles fly, then it climbs away | wide side | the lag is the integration | CRUNCH |
| 32 | 1.5 | M | A loose tile slides off the roof and splashes into the pool; the neighbour sits up with the sandwich on his face: "Hey!" | medium wide | tile slides (g sin θ), falls, splash | |
| 33 | 1.2 | M | Ben turns a steering wheel he tied to the basket: nothing happens | medium | | |
| 34 | 0.9 | C | The wheel comes off in his hands | close | | |
| 35 | 1.8 | W | Diagram: wind arrows in layers, low ones →, high ones ↙; balloon icon climbs from one to the other | wide sky, side | arrows stream | WIND LAYERS |
| 36 | 1.4 | W | Burner: the balloon climbs into the high layer; basket flags swing round; it turns towards grandma's | wide | drift change | |
| 37 | 1.2 | W | Clouds slide past, a gull lands on the crown | wide high | | |
| 38 | 0.9 | M | Grandma in her garden looks up, shading her eyes | medium | | |
| 39 | 1.3 | M | Ben pulls the red rope; the vent at the crown opens, hot air shimmers out | medium on the crown | vent opens | VENT |
| 40 | 1.0 | W | Inside, looking up: a disc of sky opens at the top | inside up | | |
| 41 | 1.4 | W | Balloon drops towards grandma's lawn, faster | wide | sink speeds up | |
| 42 | 0.9 | C | Ben: "Too much!" still hanging on the rope | close | lip sync | |
| 43 | 1.3 | W | Basket hits the lawn, bounces, tips, is dragged along by the envelope | low wide | bounce, drag, turf flies | BONK |
| 44 | 0.9 | C | Ben's face in the grass, dragged along | close, tracking | | |
| 45 | 1.3 | W | The envelope collapses over grandma's washing line; basket stops at her feet | wide | collapse | |
| 46 | 1.4 | W | Hero wide: deflated balloon, Ben crawls out, confetti | wide crane | | confetti |
| 47 | 1.4 | M | Grandma: "There's a bus, dear." | medium over Ben | lip sync | |
| 48 | 1.0 | C | Ben deadpan, grass on his head; the plastic bag drifts down onto him again | close | slow blink | |

About 59 s before voice fitting; shots stretch to their lines with ~0.03 s gaps (no pauses).
