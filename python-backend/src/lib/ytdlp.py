"""yt-dlp update activation helper."""

import sys

from src.config import config_dirs


class YTDLP:
    @staticmethod
    def activate_ytdlp_update() -> None:
        """Prefer the newest downloaded yt-dlp wheel over the bundled version."""
        try:
            wheels = sorted(config_dirs.YTDLP_UPDATE_DIR.glob("yt_dlp-*.whl"))
            if wheels and str(wheels[-1]) not in sys.path:
                sys.path.insert(0, str(wheels[-1]))
        except OSError:
            pass
