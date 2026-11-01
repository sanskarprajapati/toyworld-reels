# Credits

- **Lemo-Opuscar** (MIT, (c) 2026 LemoLab, https://github.com/lemomo-ai/lemo-opuscar): the render engine (headless capture,
  contact sheets, muxing and -14 LUFS mastering), Kokoro TTS wrapper, Whisper check, sound-effect primitives, sampler and
  plucked-string models. Installed by `setup.sh`, not vendored. `kit/post.js` and `kit/util.js` adapt its `core/three/post.js`
  and `core/lib.js` (MIT notice applies).
- **Poly Haven** (CC0, https://polyhaven.com): Kloofendal 48d Partly Cloudy (Pure Sky) HDRI; Grass Ground, Rocky Trail,
  Leafy Grass and Brown Mud Leaves 01 textures; Island Tree 01-03 models. Downloaded by `tools/fetch_assets.py`.
- **Kokoro-82M** (Apache 2.0) voice model, downloaded by the engine. **faster-whisper** (MIT) speech check.
- **Fonts** (SIL Open Font License 1.1): Fredoka (The Fredoka Project Authors) and Lilita One (Juan Montoreano), in
  `assets/fonts/` with their licence files.
- **Music samples** (optional, CC0): VS Chamber Orchestra Community Edition (Versilian Studios) and FreePats.
- Character face atlases (`assets/faces/`) were drawn for this project by `tools/face_sprites.py` (MIT).
