"""Project-owned Max object policy shared by generators and validators."""

WP5_ALLOWED_NEWOBJS = frozenset(
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
        "receive",
        "route",
        "sel",
        "t",
        "zl",
    }
)
WP5_ALLOWED_MAXCLASSES = frozenset(
    {
        "inlet",
        "live.comment",
        "live.dial",
        "live.tab",
        "message",
        "newobj",
        "outlet",
        "panel",
        "textbutton",
    }
)
WP5_EMBEDDED_RUNTIME_FILES = frozenset(
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
