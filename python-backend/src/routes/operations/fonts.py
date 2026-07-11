"""Local system fonts (Windows Registry)."""

from flask import jsonify

from . import blueprint


@blueprint.route("/api/local-fonts")
def api_local_fonts():
    """Return sorted list of font family names installed on the system (Windows Registry)."""
    families = set()
    _style_suffixes = (
        " Bold Italic", " Bold", " Italic", " Regular",
        " Light Italic", " Light", " Medium Italic", " Medium",
        " SemiBold Italic", " SemiBold", " Demi Bold", " Demi",
        " Black Italic", " Black", " Thin Italic", " Thin",
        " ExtraLight Italic", " ExtraLight", " ExtraBold Italic", " ExtraBold",
        " Condensed Bold Italic", " Condensed Bold", " Condensed Italic", " Condensed",
        " Narrow Bold", " Narrow",
    )
    try:
        import winreg
        reg_paths = [
            (winreg.HKEY_LOCAL_MACHINE,
             r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts"),
            (winreg.HKEY_CURRENT_USER,
             r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts"),
        ]
        for hive, path in reg_paths:
            try:
                key = winreg.OpenKey(hive, path)
                i = 0
                while True:
                    try:
                        name, _, _ = winreg.EnumValue(key, i)
                        # Strip "(TrueType)", "(OpenType)", "(All res)" etc.
                        name = name.split("(")[0].strip()
                        # Strip style suffixes (longest match first)
                        for suf in _style_suffixes:
                            if name.lower().endswith(suf.lower()):
                                name = name[: len(name) - len(suf)].strip()
                                break
                        if name:
                            families.add(name)
                        i += 1
                    except OSError:
                        break
                winreg.CloseKey(key)
            except Exception:
                pass
    except Exception:
        pass
    return jsonify(sorted(families))
