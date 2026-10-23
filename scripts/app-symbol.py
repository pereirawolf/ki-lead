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


def zeichne(n, inhalt=0.68, rund=True):
    s = 4  # Überabtastung für glatte Kanten
    g = n * s
    bild = Image.new("RGBA", (g, g), (0, 0, 0, 0))
    d = ImageDraw.Draw(bild)
    if rund:
        d.rounded_rectangle([0, 0, g - 1, g - 1], radius=int(g * 0.2), fill=ORANGE)
    else:
        d.rectangle([0, 0, g, g], fill=ORANGE)
    c, r = g / 2, g * inhalt / 2
    w = max(2, int(g * 0.013))
    for k in (1, 2 / 3, 1 / 3):
        d.polygon(punkte(c, c, r * k), outline=WEISS, width=w)
    for p in punkte(c, c, r):
        d.line([(c, c), p], fill=WEISS, width=w)
    innen = punkte(c, c, r, WERTE)
    d.polygon(innen, fill=BLAU)
    lw = int(w * 2)
    d.line(innen + [innen[0]], fill=WEISS, width=lw, joint="curve")
    for x, y in innen:
        d.ellipse([x - lw / 2, y - lw / 2, x + lw / 2, y + lw / 2], fill=WEISS)
    return bild.resize((n, n), Image.LANCZOS)


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
