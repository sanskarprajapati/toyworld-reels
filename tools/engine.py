"""Where the render/voice/audio engine lives: the Lemo-Opuscar library (MIT, https://github.com/lemomo-ai/lemo-opuscar).

Resolution order: $TOYWORLD_ENGINE, $LEMO_OPUSCAR_HOME, ${TOYWORLD_HOME:-~/.toyworld}/lemo-opuscar, ~/lemo-opuscar.
"""
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _find():
    for c in (os.environ.get('TOYWORLD_ENGINE'), os.environ.get('LEMO_OPUSCAR_HOME'),
              os.path.join(os.environ.get('TOYWORLD_HOME', os.path.expanduser('~/.toyworld')), 'lemo-opuscar'), os.path.expanduser('~/lemo-opuscar')):
        if c and os.path.isdir(os.path.join(c, 'core', 'render')):
            return os.path.abspath(c)
    raise SystemExit('✗ engine not found: run ./setup.sh first')


LIB = _find()
PY = os.path.join(LIB, '.venv', 'bin', 'python')
