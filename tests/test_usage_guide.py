from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "docs/USAGE_GUIDE.html"


class GuideParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.coordinates: list[str] = []
        self.ids: list[str] = []
        self.remote_assets: list[str] = []
        self.scripts = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if coordinate := values.get("data-coordinate"):
            self.coordinates.append(coordinate)
        if element_id := values.get("id"):
            self.ids.append(element_id)
        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value and re.match(r"^(?:https?:)?//", value):
                self.remote_assets.append(value)
        if tag == "script":
            self.scripts += 1


def test_usage_guide_is_complete_offline_and_coordinate_exact() -> None:
    source = GUIDE.read_text(encoding="utf-8")
    parser = GuideParser()
    parser.feed(source)
    parser.close()

    expected = {f"{file}{rank}" for rank in range(1, 9) for file in "ABCDEFGH"}
    assert len(parser.coordinates) == 64
    assert set(parser.coordinates) == expected
    assert len(set(parser.coordinates)) == 64
    assert parser.remote_assets == []
    assert parser.scripts == 1
    assert {"start", "grid", "usage", "next", "boundary"} <= set(parser.ids)
    assert "No embedded Strum or Arp" in source
    assert "Shipped + roadmap" in source
    assert "Your strike shapes the whole chord" in source
    assert "Implemented · 0.4.6" in source
    assert "v0.5.2" in source
    assert "duplicate standby" in source
    assert "Reload Grid" in source
    assert "Scale C Minor | Chord: Auto | Voice 0 | Nearest on | Bass off | Ext 9" in source
    assert "Last: Fm | Quality Min | Ext 9 | Inv VL -1" in source
    assert "PUSH SCREEN · PLAYING" in source
    assert "Playing&nbsp;&nbsp;Cm +m7+9" in source
    assert "Hold Mode" not in source
    assert "Choose Simple or Advanced" not in source
    assert "always transform held chords" in source
    assert "Implemented · 0.5.2" in source
    assert "never retriggering a retained/shared pitch" in source
    assert "Release the newest overlap and the previous held chord reappears" in source
    assert (
        "Changing Voice, Live’s scale, Base Octave, Nearest mode, or lifecycle focus "
        "clears history"
    ) in source
    assert "The page is explanatory only; it does not send MIDI." in source


def test_usage_guide_documents_current_control_roles() -> None:
    source = GUIDE.read_text(encoding="utf-8")

    for coordinate, role in {
        "A8": "Dim",
        "B8": "Minor",
        "C8": "Major",
        "D8": "Suspended",
        "E8": "Add 6",
        "F8": "Add minor 7",
        "G8": "Add Major 7",
        "H8": "Add 9",
        "A7": "Voice down",
        "B7": "Voice reset",
        "C7": "Voice up",
        "D7": "Nearest voice leading",
        "E7": "Bass down",
        "F7": "Bass reset",
        "G7": "Bass up",
        "H7": "Bass toggle",
    }.items():
        assert f'data-coordinate="{coordinate}" data-role="{role}"' in source

    assert source.count('data-kind="chord"') == 32
    assert source.count('data-kind="reserved"') == 16
    assert source.count('data-kind="voiceleading"') == 1
