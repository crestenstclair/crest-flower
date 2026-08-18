"""Project-owned Max object policy shared by generators and validators."""

WP2_ALLOWED_NEWOBJS = frozenset(
    {
        "append",
        "deferlow",
        "gate",
        "js",
        "live.object",
        "live.observer",
        "live.path",
        "live.thisdevice",
        "midiin",
        "midiout",
        "p",
        "prepend",
        "route",
        "s",
        "sel",
        "t",
        "zl",
    }
)
WP2_ALLOWED_MAXCLASSES = frozenset(
    {"inlet", "live.comment", "live.dial", "message", "newobj", "outlet", "panel"}
)
WP2_EMBEDDED_RUNTIME_FILES = frozenset({"push-grid-adapter.js"})

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
