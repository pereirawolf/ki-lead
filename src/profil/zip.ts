// Import und Export von Profilpaketen als ZIP (Endung .leadprofil oder .zip) bzw. als Dateiauswahl.

import JSZip from "jszip";

const TEXT = /\.(json|md|txt|yaml|yml)$/i;

export async function ausZip(daten: ArrayBuffer | Blob): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(daten);
  const out: Record<string, string> = {};
  const eintraege = Object.values(zip.files).filter((f) => !f.dir && TEXT.test(f.name));
  for (const f of eintraege) out[f.name] = await f.async("string");
  return out;
}

export async function ausDateiliste(liste: FileList | File[]): Promise<Record<string, string>> {
  const dateien = Array.from(liste);
  const einzige = dateien.length === 1 ? dateien[0] : undefined;
  if (einzige && /\.(zip|leadprofil)$/i.test(einzige.name)) {
    return ausZip(await einzige.arrayBuffer());
  }
  const out: Record<string, string> = {};
  for (const f of dateien) {
    if (!TEXT.test(f.name)) continue;
    const pfad = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    out[pfad] = await f.text();
  }
  return out;
}

export async function alsZip(dateien: Record<string, string>, ordner: string): Promise<Blob> {
  const zip = new JSZip();
  const wurzel = zip.folder(ordner)!;
  for (const [pfad, text] of Object.entries(dateien)) wurzel.file(pfad, text);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
