"""Read deterministic display metadata from the ES5 runtime using development Node."""

from functools import lru_cache
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


@lru_cache(maxsize=1)
def playing_display_labels() -> list[str]:
    """Use the runtime's identity catalog for generation and static validation."""
    result = subprocess.run(
        ["node", "-e", (
            "process.stdout.write(JSON.stringify("
            "require('./src/max/runtime-adapter.js').playingDisplayLabels()))"
        )],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    labels = json.loads(result.stdout)
    if not labels or labels[0] != "--" or len(labels) != len(set(labels)):
        raise ValueError("Playing catalog must be unique with -- at code zero")
    return labels
