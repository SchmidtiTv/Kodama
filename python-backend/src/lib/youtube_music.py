"""YouTube Music data-shape helpers."""


class YoutubeMusic:
    @staticmethod
    def is_oauth_profile(raw) -> bool:
        """Identify unsupported OAuth profiles left over from older releases."""
        return isinstance(raw, dict) and ("refresh_token" in raw or raw.get("token_type") == "Bearer")

    _is_oauth_profile = is_oauth_profile
