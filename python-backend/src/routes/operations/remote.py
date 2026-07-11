"""LAN remote control endpoints.

Desktop-only control routes (`_enable`/`_status`/`_device`/`_push`/`_poll`/
`_sync`) are restricted to localhost; the phone-facing routes are gated by the
session token and per-device approval inside the RemoteControl service.
"""

from flask import Response, jsonify, request

from . import blueprint
from ._services import remote_control


def _is_local():
    ra = request.remote_addr or ""
    return ra.startswith("127.") or ra in ("::1", "localhost")


# ── Desktop-only control endpoints (localhost) ──
@blueprint.route("/remote/_enable", methods=["POST"])
def remote_enable():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    return jsonify(remote_control().enable(request.json or {}))


@blueprint.route("/remote/_status")
def remote_status():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    return jsonify(remote_control().status_payload())


@blueprint.route("/remote/_device", methods=["POST"])
def remote_device():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    payload, status = remote_control().device_action(request.json or {})
    return jsonify(payload), status


@blueprint.route("/remote/_push", methods=["POST"])
def remote_push():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    remote_control().push_state(request.json or {})
    return jsonify({"ok": True})


@blueprint.route("/remote/_poll")
def remote_poll():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    return jsonify({"commands": remote_control().poll()})


@blueprint.route("/remote/_sync", methods=["POST"])
def remote_sync():
    if not _is_local():
        return jsonify({"error": "forbidden"}), 403
    return jsonify({"commands": remote_control().sync(request.json or {})})


# ── Phone-facing endpoints (token + device-approval gated) ──
@blueprint.route("/remote/hello", methods=["POST"])
def remote_hello():
    payload, status = remote_control().hello(request.json or {})
    return jsonify(payload), status


@blueprint.route("/remote/state")
def remote_state():
    payload, status = remote_control().get_state(request.args.get("token"), request.args.get("deviceId"))
    return jsonify(payload), status


@blueprint.route("/remote/cmd", methods=["POST"])
def remote_cmd():
    payload, status = remote_control().command(request.json or {})
    return jsonify(payload), status


@blueprint.route("/remote")
def remote_page():
    return Response(remote_control().page_html(), mimetype="text/html")
