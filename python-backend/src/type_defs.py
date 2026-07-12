"""Shared concrete types for backend boundaries."""

from typing import TypeAlias, Union

from flask import Response


RouteResponse: TypeAlias = Union[Response, str, tuple[Response, int], tuple[str, int], tuple[bytes, int, dict[str, str]]]
