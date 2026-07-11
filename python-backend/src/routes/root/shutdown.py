"""Stop the legacy local backend process."""

import os
import threading
import time

from . import blueprint


@blueprint.route("/shutdown", methods=["GET", "POST"])
def shutdown():
    def stop_process():
        time.sleep(0.2)
        os._exit(0)

    threading.Thread(target=stop_process, daemon=True).start()
    return "ok"
