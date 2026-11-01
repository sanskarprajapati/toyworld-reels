# Workflow

## 0. Install (once)

```sh
./setup.sh            # engine, voice model, 3D assets (add --music for the sampled orchestral bed)
./tw doctor
```

## 1. Topic

Pick machines whose explanation is a ladder of failures, each fixed by one real design idea:
- balloon: bag over a fire flies → can't lift Ben → 600 m³ envelope → fan + burner → cools and sinks → burner lag → can't steer → wind layers → vent → landing
- submarine: barrel + rock sinks forever → beach ball can't dive → ballast tanks → too heavy → neutral trim → propeller, periscope → pressure → blow ballast → breach
Good candidates: canal lock, water tower, elevator, bridge, rocket, parachute, crane, lighthouse, windmill, traffic lights, toilet cistern.
Offer three with a one-line story each and let the user choose.

## 2. Storyboard (`STORYBOARD.md`)

Use the template sections: the hook line, World (where everything stands, in metres), Cast, Physics (every motion that has
to look right and how), Labels, and the shot table `| # | dur | size | Picture | Camera | Action / physics | Overlay |`.
- 45-60 shots of 1-1.5 s (a 0.9 s close-up reaction is fine). Ids are `01`, `02`, ...; to insert a shot later use `12b`
  (ids sort as strings).
- Every 3-5 shots there is a new event: a prop, a gag, a diagram, a label, a cutaway.
- The opening (~15 s) must contain the hook, the first "Congratulations", the first failure and the first explanation.
- Write `durations.json` (`{"01": 1.3, ...}`) from the table.

## 3. 3D and animation

Layout of a film folder (made by `tw new`): `index.html`, `src/main.js` (stage, assets, timeline), `src/set.js` (set and
cast, plus `resetSet` which hides/resets everything each frame), `src/physics.js`, `src/shots*.js` (split at ~12 shots per
file), `lib` → the kit, `assets` → the assets.
- Every frame is a pure function of time: each shot's `frame({u, d, t})` poses everything it shows from scratch.
- Build the physics first (PHYSICS.md), then the set (place set pieces where the physics puts the action), then the shots.
- Review loop, after every batch of shots: `tw sheet <film> <name> 0.2 0.6 0.9` and look at every frame. Typical fixes:
  camera inside a wall or a prop, a character's back to the camera, an arm covering a face, a label covering the subject,
  sun glare, foreground clutter, an object floating or sinking into another. Fix, re-render that shot's stills, repeat.

## 4. Script and voice

`voice/script.json` groups shots with the lines that cover them (see the starter and the examples):
- narrator lines carry the explanation; characters get short lip-synced lines (Ben: "Whoa!", neighbour: "Hey! My roof!").
- `key` words show in yellow in the captions.
- Kokoro voices (offline): narrator `am_puck` speed 1.2 + tempo 1.36, Ben `am_echo` + pitch 3, grandma `bf_lily`, neighbour
  `am_michael`. Never raise Kokoro speed above 1.3: speed up with `tempo` (ffmpeg atempo) instead.
- `tw voice <film> tts` checks every line with Whisper. Rewrite lines it mishears (first words get swallowed: "Put Ben"
  heard as "But Ben"; "Bullseye" as "We'll see"). Kokoro varies run to run, so redo only the changed ids.
- `tw voice <film> timing` scales each group's shots to its lines (0.03 s between lines). It prints `gap` when a group's
  lines are shorter than its shots can shrink (floor 0.7): lengthen the line rather than raising the floor.
- After timing, re-check the physics against the new shot lengths (contacts still inside their shots, speeds still legal).

## 5. Assemble and review

- `audio/events.json`: `{"music": {"bpm", "key"}, "events": [[shot, fraction, sound, gain], ...]}`. Sound names: see
  `tools/sfxlib.py` (54 synthesised sounds). Every impact, whoosh and pop-in gets a sound.
- `tw render <film> 16` (opening) or `tw render <film>` (full); ~4 s of render per second of film.
- `tw assemble <film> [picture] [out]` mixes, burns captions and labels, masters to -14 LUFS and writes a 720p phone copy.
- Review the assembled MP4: `ffmpeg -i out.mp4 -vf "fps=3,scale=200:356,tile=10x6" -frames:v 1 sheet.jpg`, and `tw check`.
- Send the opening first; build the rest only after the user approves it.
