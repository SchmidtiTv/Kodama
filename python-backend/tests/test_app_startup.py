from unittest.mock import MagicMock, patch

from src import create_app


def test_app_startup_restores_a_saved_profile():
    with (
        patch("src.setup_ipv4_first"),
        patch("src.Profile"),
        patch("src.YoutubeMusicSession") as session_class,
        patch("src.LastFM"),
        patch("src.CacheSettings"),
        patch("src.ComposerBridge"),
        patch("src.ComposerSettings"),
        patch("src.LyricsService"),
        patch("src.MusixMatch"),
        patch("src.Playlist"),
        patch("src.Album"),
        patch("src.YTDLP") as ytdlp_class,
        patch("src.StreamService"),
        patch("src.FFmpeg"),
        patch("src.DownloadService"),
        patch("src.ExportService"),
        patch("src.OverlayServer"),
        patch("src.RemoteControl"),
        patch("src.register_blueprints"),
        patch("src.setup_debug"),
        patch("src.setup_log_tee"),
        patch("src.setup_logger"),
    ):
        session = session_class.return_value
        session.state = MagicMock()
        app = create_app()

    session.autoload_first_profile.assert_called_once_with()
    assert app.extensions["youtube_music_session"] is session
    ytdlp_class.return_value.activate_ytdlp_update.assert_called_once_with()
