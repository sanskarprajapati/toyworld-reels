#!/bin/sh
# One-time install: the render/voice/audio engine (Lemo-Opuscar, MIT), its Node + Python packages and headless browser,
# the offline English voice model (Kokoro, ~340 MB) and the CC0 3D assets from Poly Haven (~200 MB).
#
#   ./setup.sh            everything above
#   ./setup.sh --music    also the CC0 orchestral sample packs for the music bed (VSCO 2 CE + FreePats, ~800 MB);
#                         without them the bed is played on modelled plucked strings
#
# Needs: git, Node 20+, Python 3.11-3.13 (or uv), ffmpeg. The engine goes to ~/.toyworld/lemo-opuscar (TOYWORLD_HOME to
# change it) unless LEMO_OPUSCAR_HOME points at an existing clone.
set -e
TW=$(cd "$(dirname "$0")" && pwd -P)
MUSIC=; for a in "$@"; do case $a in --music) MUSIC=1 ;; *) echo "usage: ./setup.sh [--music]"; exit 1 ;; esac; done
for c in git node npm ffmpeg; do command -v $c >/dev/null || { echo "✗ $c is needed"; exit 1; }; done

# the engine is pinned to a known-good commit
PIN=f17136060781a0068a7951245a3aa7835a7230de
export LEMO_OPUSCAR_HOME=${LEMO_OPUSCAR_HOME:-${TOYWORLD_HOME:-$HOME/.toyworld}/lemo-opuscar}
if [ ! -d "$LEMO_OPUSCAR_HOME/core/render" ]; then
  echo "↓ engine: lemo-opuscar → $LEMO_OPUSCAR_HOME"
  mkdir -p "$(dirname "$LEMO_OPUSCAR_HOME")"
  git clone --quiet --filter=blob:none --sparse https://github.com/lemomo-ai/lemo-opuscar.git "$LEMO_OPUSCAR_HOME"
  git -C "$LEMO_OPUSCAR_HOME" sparse-checkout set --no-cone '/*' '!/styles/*/demo/' '!/styleboard/' '!/docs/frames/' '!/films/'
  git -C "$LEMO_OPUSCAR_HOME" checkout --quiet $PIN 2>/dev/null || echo "! could not pin $PIN; using main"
fi
SETUP=$LEMO_OPUSCAR_HOME/plugin/skills/lemo-opuscar/scripts/setup.sh
sh "$SETUP" deps voice music
(cd "$LEMO_OPUSCAR_HOME" && sh tools/fetch.sh voice)
[ -n "$MUSIC" ] && (cd "$LEMO_OPUSCAR_HOME" && sh tools/fetch.sh instruments vsco2ce && sh tools/fetch.sh instruments freepats)
"$LEMO_OPUSCAR_HOME/.venv/bin/python" "$TW/tools/fetch_assets.py"
chmod +x "$TW/tw"
echo
"$TW/tw" doctor && echo "\n✓ ready. Try:  ./tw sheet examples/balloon   or   ./tw new my-reel"
