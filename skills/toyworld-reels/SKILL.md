---
name: toyworld-reels
description: Make a 60-75 s vertical (1080x1920) "how does it work" explainer reel in a toy-world 3D style, built entirely in code with Three.js - storyboard, physically correct animation, lip-synced characters, offline voiceover, captions, labels, music and SFX, mastered to -14 LUFS. Use when the user asks for a toy-world / "Congratulations, you've built a ___" style explainer reel, a short-form 3D explainer about how something works, or wants to continue or edit a film made with toyworld-reels.
---

# Toy-world explainer reels

A reel explains how one everyday machine or idea works through a funny escalating story on a floating toy island:
the silliest version first ("Put Ben in a barrel, tie on a rock... congratulations, you've built a submarine!"),
then each failure motivates the next real piece of the design, until the real thing works and the punchline lands.
Cast: Ben (crash-test hero), the narrator ("you", the builder), the neighbour (victim of every escalation), grandma (punchline).

Examples to read before writing anything: `examples/balloon/` (hot-air balloon, 49 shots, 59 s) and `examples/submarine/`
(45 shots, 57 s), each with STORYBOARD.md, src/, voice/script.json and audio/events.json.

## Where things are

The repo root is two folders above this file (or `${CLAUDE_PLUGIN_ROOT}` when installed as a plugin). Call it `$TW`.
- `$TW/tw` - the CLI (run it with no arguments for help). `$TW/setup.sh` - one-time install; run it if `$TW/tw doctor` fails.
- `$TW/kit/` - the shared Three.js library (world, characters with painted faces, acting, particles, post, staging).
- `$TW/templates/starter/` - copied by `tw new`. `$TW/tools/` - voice, mix, music, overlay, asset fetch.
- References: [WORKFLOW.md](references/WORKFLOW.md) (the process, step by step), [STYLE.md](references/STYLE.md) (pacing,
  framing, acting, labels, voice), [PHYSICS.md](references/PHYSICS.md) (making motion look right), [KIT.md](references/KIT.md)
  (API and gotchas). Read WORKFLOW.md and STYLE.md fully before the storyboard; PHYSICS.md and KIT.md before the 3D.

## The process (non-negotiable order)

1. **Topic** - propose 3 topics (how-it-works machines with a built-in escalation) and let the user pick.
2. **Storyboard** - `tw new <dir>`, then write STORYBOARD.md: world layout, cast, physics plan, labels, and a shot list of
   45-60 shots of 1-1.5 s, mostly wide/medium. Write durations.json from it.
3. **3D and animation** - build the set, props and shots; review contact sheets (`tw sheet`) and fix every problem you see
   before moving on. Physics first: solve the motion so the story beats land inside their shots.
4. **Script and voice, fitted to the picture** - write voice/script.json group by group so each group of shots is
   covered by its lines; `tw voice <film> tts`, read the Whisper check, fix misheard lines (`tw voice <film> tts g05_0`),
   then `tw voice <film> timing`. Shots stretch or shrink to the voice: no dead air. Then re-check the physics timing.
5. **Assemble the opening** (~15 s): `tw render <film> <seconds>`, `tw assemble <film> <film>/render/opening_picture.mp4 <out>`,
   review the result frame by frame (contact sheet of the MP4), send it to the user and **wait for approval**.
6. **Build the rest**, review every shot, voice it, render the full reel, assemble, check (`tw check`), deliver the MP4 and
   the `_phone.mp4` copy.

Never send anything you have not looked at frame by frame. Run at most two renders/heavy processes at once.
