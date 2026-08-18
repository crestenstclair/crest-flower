"""Project-owned Max object policy shared by generators and validators."""

WP1_ALLOWED_NEWOBJS = frozenset({"midiin", "midiout", "s"})
WP1_ALLOWED_MAXCLASSES = frozenset({"live.dial", "panel", "newobj"})

FORBIDDEN_OBJECTS = frozenset(
    {
        "aka.shell",
        "jit.gl.node",
        "jweb",
        "mxj",
        "node.script",
        "shell",
        "udpreceive",
        "udpsend",
    }
)

FORBIDDEN_PREFIXES = ("jit.", "node.")
