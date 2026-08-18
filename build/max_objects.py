"""Project-owned Max object policy shared by generators and validators."""

WP4_ALLOWED_NEWOBJS = frozenset(
    {
        "append",
        "deferlow",
        "gate",
        "js",
        "live.object",
        "live.observer",
        "live.path",
        "live.thisdevice",
        "midiformat",
        "midiin",
        "midiout",
        "midiparse",
        "p",
        "prepend",
        "route",
        "sel",
        "t",
        "zl",
    }
)
WP4_ALLOWED_MAXCLASSES = frozenset(
    {
        "inlet",
        "live.comment",
        "live.dial",
        "message",
        "newobj",
        "outlet",
        "panel",
        "textbutton",
    }
)
WP4_EMBEDDED_RUNTIME_FILES = frozenset(
    {
        "active-notes.js",
        "harmony.js",
        "live-scale-adapter.js",
        "push-grid-adapter.js",
        "runtime-adapter.js",
        "state.js",
    }
)

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
