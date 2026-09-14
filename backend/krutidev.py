"""Kruti Dev (legacy Devanagari) -> Unicode converter.

Faithful Python port of the vendored JS converter (frontend/src/lib/krutidev),
so PDFs authored in legacy fonts (Kruti Dev / DevLys ...) whose text layer is
ASCII-mapped can be turned into real Unicode Devanagari without OCR noise.
Mapping data is shared via krutidev_map.json (generated from the same source).
"""
import json
import re
from pathlib import Path

_MAP = json.loads((Path(__file__).parent / "krutidev_map.json").read_text(encoding="utf-8"))
_MAIN = _MAP["main"]
_UNATT_UNI = _MAP["unattached_unicode"]
_VOWELS_UNI = set(_MAP["vowels_unicode"])


def _rep(t: str, find: str, replace: str) -> str:
    return t if find == "" else t.replace(find, replace)


def kruti_to_unicode(text: str) -> str:
    if not text:
        return text
    t = str(text)

    t = _rep(t, " \xaa", "\xaa")
    t = _rep(t, " ~j", "~j")
    t = _rep(t, " z", "z")

    for find, replace in _MAIN:
        t = _rep(t, find, replace)

    t = _rep(t, "\xb1", "Z\u0902")
    t = _rep(t, "\xc6", "\u0930\u094df")

    # f + ?  ->  ? + ि   (short-i matra sits before consonant in Kruti Dev)
    t = re.sub(r"f(.?)", lambda m: m.group(1) + "\u093f", t)

    t = _rep(t, "\xc7", "fa")
    t = _rep(t, "\xaf", "fa")
    t = _rep(t, "\xc9", "\u0930\u094dfa")

    # fa? -> ? + िं
    t = re.sub(r"fa(.?)", lambda m: m.group(1) + "\u093f\u0902", t)

    t = _rep(t, "\xca", "\u0940Z")

    # ि् + ? -> ् + ? + ि
    t = re.sub("\u093f\u094d(.?)", lambda m: "\u094d" + m.group(1) + "\u093f", t)

    t = _rep(t, "\u094dZ", "Z")

    # reph: move र् (encoded as 'Z') before the preceding consonant cluster
    guard = 0
    while "Z" in t and guard < 20000:
        guard += 1
        zi = t.index("Z")
        if zi == 0:
            t = t.replace("Z", "\u0930\u094d", 1)
            continue
        index = zi - 1
        match = t[index]
        while index >= 0 and t[index] in _VOWELS_UNI:
            index -= 1
            if index >= 0:
                match = t[index] + match
        t = t.replace(match + "Z", "\u0930\u094d" + match, 1)

    # ' ', ',' and ्  are illegal just before a matrā
    for matra in _UNATT_UNI:
        t = _rep(t, " " + matra, matra)
        t = _rep(t, "," + matra, matra + ",")
        t = _rep(t, "\u094d" + matra, matra + ",")

    t = _rep(t, "\u094d\u094d\u0930", "\u094d\u0930")
    t = _rep(t, "\u094d\u0930\u094d", "\u0930\u094d")
    t = _rep(t, "\u094d\u094d", "\u094d")
    t = _rep(t, "\u094d ", " ")
    return t.strip()


def devanagari_count(s: str) -> int:
    return sum(1 for c in (s or "") if "\u0900" <= c <= "\u097f")
