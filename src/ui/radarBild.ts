// Lagenradar als PNG (Daten-URL) für die Kopiervorlage: Word übernimmt eingefügtes SVG nicht zuverlässig.

import type { RadarDef } from "../kern/typen";
import { radarWerte } from "../kern/ui";
import { radarForm } from "../kern/radarGeometrie";

export function radarPng(def: RadarDef, wert: Record<string, number | null> | undefined, groesse = 340): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = groesse;
  canvas.height = groesse;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const n = def.achsen.length;
  const c = groesse / 2;
  const rMax = groesse * 0.36;
  const winkel = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const punkt = (i: number, r: number) => [c + r * Math.cos(winkel(i)), c + r * Math.sin(winkel(i))] as const;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, groesse, groesse);
  for (let s = 1; s <= def.max; s++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const [x, y] = punkt(i % n, (rMax * s) / def.max);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = s === def.max ? "#9fb0a8" : "#d5ddd9";
    ctx.lineWidth = groesse / 220;
    ctx.stroke();
  }
  ctx.font = `${Math.round(groesse / 18)}px Arial`;
  ctx.fillStyle = "#556270";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  def.achsen.forEach((a, i) => {
    const [x, y] = punkt(i, rMax);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#c5cec9";
    ctx.stroke();
    const [lx, ly] = punkt(i, rMax + groesse / 14);
    ctx.fillText(a.label.match(/^(D\d+)\b/)?.[1] ?? a.label.split(/\s+/)[0] ?? "", lx, ly);
  });
  const stufen = radarWerte(wert);
  const werte = def.achsen.map((a) => stufen[a.key] ?? null);
  // Seit UX-2026-W45-17: Fläche nur bei vollständigem Radar, offene Achse als hohler Ring am Rand (radarGeometrie.ts)
  const form = radarForm(werte);
  ctx.strokeStyle = "#1f4f82";
  ctx.lineWidth = groesse / 110;
  if (form.voll) {
    ctx.beginPath();
    werte.forEach((v, i) => {
      const [x, y] = punkt(i, (rMax * (v ?? 0)) / def.max);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(31,79,130,0.2)";
    ctx.fill();
    ctx.stroke();
  } else
    for (const [i, j] of form.kanten) {
      const [x1, y1] = punkt(i, (rMax * werte[i]!) / def.max);
      const [x2, y2] = punkt(j, (rMax * werte[j]!) / def.max);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  werte.forEach((v, i) => {
    ctx.beginPath();
    if (v === null) {
      const [x, y] = punkt(i, rMax);
      ctx.arc(x, y, groesse / 50, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#7a8a83";
      ctx.lineWidth = groesse / 200;
      ctx.stroke();
      return;
    }
    const [x, y] = punkt(i, (rMax * v) / def.max);
    ctx.arc(x, y, groesse / 50, 0, Math.PI * 2);
    ctx.fillStyle = "#1f4f82";
    ctx.fill();
  });
  return canvas.toDataURL("image/png");
}
