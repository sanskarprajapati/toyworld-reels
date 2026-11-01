# Style rules

These came from viewer feedback on earlier reels ("they have pauses, the shots are too close, the visuals are slow").

## Pacing
- No pauses: no dead air between lines, no held frame waiting for the voice. The picture is cut to the voice.
- 45-60 shots, 1-1.5 s each. Something new every second: a cut, an event, a label, a camera move.
- Fast cameras: eased push-ins, orbits and cranes within the shot (`move()` with `eo`/`eio`); handheld shake 0.01-0.03.

## Framing
- Mostly wide and medium shots that show the whole set, the action and the characters together.
- Close-ups only for reactions, under 1 s.
- Check every frame for: the subject hidden by a character's back, a pillar, a tree, a label; the camera inside geometry;
  a character's arm across their face; sun glare; a huge foreground object.

## Acting (no "AI slop")
- Every visible character: a pose, `idle()` (breath, sway), `eyes()` with blinks, a mouth shape, and a reaction to what
  just happened. Speaking characters use `talk()` (lip sync from the recorded line). Shouts use `{ shout: true }`.
- Hands do things: hold props (`hold()`), point, wave, cover the face, flail, haul a rope, turn a wheel.
- Comic timing: the escalation gag lands on the victim (the neighbour) and the deadpan ending (Ben's slow blink).

## Look
- The floating island (striped lawn, soil cliffs), Poly Haven olive trees, white houses with orange roofs, soft vinyl toys,
  a warm sunny HDRI, gentle depth of field, AO and bloom (kit post). Keep it bright and saturated.
- Diagrams live in the 3D world: glowing cubes, force arrows, wind arrows, a gauge on the balloon, a glass tank on a bench.

## Labels and captions
- Captions: one word at a time, centred, key words yellow. Labels: short, all caps, upper third: `HOT AIR = LIGHTER`,
  `BALLAST TANKS`, `NEUTRAL`, impacts in red (`CRUNCH`, `SPLASH`). Counting labels: `{"text": "{n} m³", "count": [1, 600]}`.
- The label font has no "≈": write "1 m³ LIFTS 250 g", not "1 m³ ≈ 250 g".

## Voice and audio
- The narrator is quick and playful; character lines are short. The hook line and the final
  "Congratulations, you've built a ___!" frame the reel.
- Music sits ~21 dB under the voice. Every impact, splash, whoosh and pop-in has a sound.
- Master to -14 LUFS, true peak about -1 dB (`tw assemble` does it).
