// Lagenradar als PNG (Daten-URL) für die Kopiervorlage: Word übernimmt eingefügtes SVG nicht zuverlässig.

import type { RadarDef } from "../kern/typen";

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
  const werte = def.achsen.map((a) => (Number.isInteger(wert?.[a.key]) ? (wert![a.key] as number) : null));
  if (werte.some((v) => v !== null)) {
    ctx.beginPath();
    werte.forEach((v, i) => {
      const [x, y] = punkt(i, (rMax * (v ?? 0)) / def.max);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(31,79,130,0.2)";
    ctx.fill();
    ctx.strokeStyle = "#1f4f82";
    ctx.lineWidth = groesse / 110;
    ctx.stroke();
  }
  werte.forEach((v, i) => {
    const [x, y] = punkt(i, (rMax * (v ?? 0)) / def.max);
    ctx.beginPath();
    ctx.arc(x, y, groesse / 50, 0, Math.PI * 2);
    ctx.fillStyle = v === null ? "#c5cec9" : "#1f4f82";
    ctx.fill();
  });
  return canvas.toDataURL("image/png");
}
