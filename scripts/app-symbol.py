#!/usr/bin/env python3
"""Zeichnet das App-Symbol von KI-LEAD (public/icons/) aus den Radarwerten in docs/app-symbol.md.

Aufruf aus der Repositorywurzel: python3 scripts/app-symbol.py   (benötigt Pillow: pip install pillow)
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

ORANGE = (0xE7, 0x5B, 0x12)  # Hintergrund, BBK-Farbschema (RAL 2004, angenähert)
WEISS = (0xFF, 0xFF, 0xFF)  # Gerüst und Kontur
BLAU = (0x1D, 0x4F, 0x91)  # Innenfläche (RAL 5015/5002, angenähert)

# Tief „Bernd“, Sicht des Bundes, 15.–17.07.2021; Stufen 0–6 je Achse D1 … D8 (Begründung: docs/app-symbol.md)
STUFEN = [4, 4, 4, 5, 5, 5, 4, 5]
WERTE = [s / 6 for s in STUFEN]

ZIEL = Path(__file__).resolve().parent.parent / "public" / "icons"


def punkte(cx, cy, r, anteile=None):
    return [
        (
            cx + math.cos(-math.pi / 2 + i * math.pi / 4) * r * (anteile[i] if anteile else 1),
            cy + math.sin(-math.pi / 2 + i * math.pi / 4) * r * (anteile[i] if anteile else 1),
        )
        for i in range(8)
    ]


def zeichne(n, inhalt=0.68, rund=True, form=None, breite=None):
    """Symbol der Größe n×n (bzw. breite×n). form: "rund" (abgerundetes Quadrat), "quadrat", "kreis" oder "frei"
    (transparenter Grund, für den Vordergrund adaptiver Android-Symbole); ohne Angabe nach rund."""
    s = 4  # Überabtastung für glatte Kanten
    form = form or ("rund" if rund else "quadrat")
    gb, g = (breite or n) * s, n * s
    bild = Image.new("RGBA", (gb, g), (0, 0, 0, 0))
    d = ImageDraw.Draw(bild)
    if form == "rund":
        d.rounded_rectangle([0, 0, gb - 1, g - 1], radius=int(min(gb, g) * 0.2), fill=ORANGE)
    elif form == "quadrat":
        d.rectangle([0, 0, gb, g], fill=ORANGE)
    elif form == "kreis":
        d.ellipse([0, 0, gb - 1, g - 1], fill=ORANGE)
    cx, c, r = gb / 2, g / 2, min(gb, g) * inhalt / 2
    # Strichstärke: bei den Web-Symbolen wie bisher, sonst im Verhältnis zur Radargröße
    w = max(2, int(min(gb, g) * inhalt * 0.019)) if form == "frei" or breite else max(2, int(g * 0.013))
    for k in (1, 2 / 3, 1 / 3):
        d.polygon(punkte(cx, c, r * k), outline=WEISS, width=w)
    for p in punkte(cx, c, r):
        d.line([(cx, c), p], fill=WEISS, width=w)
    innen = punkte(cx, c, r, WERTE)
    d.polygon(innen, fill=BLAU)
    lw = int(w * 2)
    d.line(innen + [innen[0]], fill=WEISS, width=lw, joint="curve")
    for x, y in innen:
        d.ellipse([x - lw / 2, y - lw / 2, x + lw / 2, y + lw / 2], fill=WEISS)
    return bild.resize((breite or n, n), Image.LANCZOS)


def svg():
    c, r = 256, 512 * 0.68 / 2
    sp = lambda ps: " ".join(f"{x:.1f},{y:.1f}" for x, y in ps)
    ringe = "".join(f'<polygon points="{sp(punkte(c, c, r * k))}"/>' for k in (1, 2 / 3, 1 / 3))
    achsen = "".join(f'<line x1="256" y1="256" x2="{x:.1f}" y2="{y:.1f}"/>' for x, y in punkte(c, c, r))
    innen = sp(punkte(c, c, r, WERTE))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>KI-LEAD</title>'
        '<rect width="512" height="512" rx="102" fill="#E75B12"/>'
        f'<g fill="none" stroke="#fff" stroke-width="7">{ringe}{achsen}</g>'
        f'<polygon points="{innen}" fill="#1D4F91" stroke="#fff" stroke-width="13" stroke-linejoin="round"/></svg>'
    )


if __name__ == "__main__":
    ZIEL.mkdir(parents=True, exist_ok=True)
    zeichne(192).save(ZIEL / "icon-192.png")
    zeichne(512).save(ZIEL / "icon-512.png")
    zeichne(512, inhalt=0.54, rund=False).save(ZIEL / "icon-maskable-512.png")
    zeichne(180, rund=False).convert("RGB").save(ZIEL / "apple-touch-icon.png")
    zeichne(48, inhalt=0.76).save(ZIEL / "favicon-48.png")
    (ZIEL / "icon.svg").write_text(svg(), encoding="utf-8")
    print(f"Symbole geschrieben nach {ZIEL}")

    # Native Apps (Capacitor), sofern die Projektordner vorhanden sind
    wurzel = ZIEL.parent.parent
    ios = wurzel / "ios" / "App" / "App" / "Assets.xcassets"
    if ios.exists():
        # App Store verlangt ein Quadrat ohne Transparenz; iOS rundet die Ecken selbst
        zeichne(1024, form="quadrat").convert("RGB").save(ios / "AppIcon.appiconset" / "AppIcon-512@2x.png")
        for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
            zeichne(2732, inhalt=0.3, form="quadrat", breite=2732).convert("RGB").save(ios / "Splash.imageset" / name)
        print(f"iOS-Symbole geschrieben nach {ios}")
    res = wurzel / "android" / "app" / "src" / "main" / "res"
    if res.exists():
        for dichte, groesse in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
            ordner = res / f"mipmap-{dichte}"
            zeichne(groesse, form="rund").save(ordner / "ic_launcher.png")
            zeichne(groesse, inhalt=0.72, form="kreis").save(ordner / "ic_launcher_round.png")
            # Adaptives Symbol: Vordergrund 108 dp, sichtbarer Kern 66 dp; das Radar bleibt darin
            zeichne(int(groesse * 108 / 48), inhalt=0.5, form="frei").save(ordner / "ic_launcher_foreground.png")
        for datei in res.glob("drawable*/splash.png"):
            b, h = Image.open(datei).size
            zeichne(h, inhalt=0.4, form="quadrat", breite=b).convert("RGB").save(datei)
        (res / "values" / "ic_launcher_background.xml").write_text(
            '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#E75B12</color>\n</resources>\n',
            encoding="utf-8",
        )
        print(f"Android-Symbole geschrieben nach {res}")
