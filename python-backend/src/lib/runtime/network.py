"""Outbound network preferences applied during application startup."""

import socket

from src.config import Config


# Captured once at import time, before any patching, so it always refers to the
# real resolver even if setup_ipv4_first() runs more than once.
_original_getaddrinfo = socket.getaddrinfo


AddressInfo = tuple[
    socket.AddressFamily,
    socket.SocketKind,
    int,
    str,
    tuple[int, bytes] | tuple[str, int] | tuple[str, int, int, int],
]


def _ipv4_first_getaddrinfo(
    host: bytes | str | None,
    port: bytes | int | str | None,
    family: int = 0,
    type: int = 0,
    proto: int = 0,
    flags: int = 0,
) -> list[AddressInfo]:
    results = _original_getaddrinfo(host, port, family, type, proto, flags)
    ipv4 = [entry for entry in results if entry[0] == socket.AF_INET]
    return ipv4 or results


def setup_ipv4_first() -> None:
    """Prefer IPv4 for all outbound connections when enabled.

    On machines with broken/blackholed IPv6, Python's socket stack tries the
    IPv6 address first and stalls ~40s waiting for it to time out before falling
    back to IPv4 (unlike curl/browsers, it does not do Happy-Eyeballs). That made
    every outbound fetch — Google thumbnail CDN, YouTube Music — hang for ~40s.
    Filtering getaddrinfo to IPv4 removes the stall; harmless where IPv6 works.

    Disable by setting ``Config.PREFER_IPV4 = False``.
    """
    if not Config.PREFER_IPV4:
        return

    socket.getaddrinfo = _ipv4_first_getaddrinfo
    print("[net] IPv4-first outbound resolution enabled.", flush=True)
