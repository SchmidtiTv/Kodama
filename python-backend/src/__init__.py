from flask import Flask

from src.config import Config
from src.lib import setup_debug, setup_log_tee, YTDLP, setup_logger
from src.routes import register_blueprints


def create_app():
    try:
        app = Flask(__name__)
        app.config.from_object(Config)

        register_blueprints(app)

        setup_debug(app)
        setup_log_tee()
        setup_logger()

        ytdlp = YTDLP()
        ytdlp.activate_ytdlp_update()

        return app

    except Exception as err:
        raise RuntimeError("Failed to create Flask application.") from err
