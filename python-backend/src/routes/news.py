import json
import os

from flask import jsonify, Blueprint

blueprint = Blueprint("news", __name__)

@blueprint.route("/news")
def get_news():
    """Fallback news feed for dev/offline: serves the repo's updates/news.json. Published builds
    fetch the remote feed directly; this is only used when that's unavailable."""
    try:
        p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "updates", "news.json")
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                return jsonify(json.load(f))
    except Exception:
        pass
    return jsonify([])
