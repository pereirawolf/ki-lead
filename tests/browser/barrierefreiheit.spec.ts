// Barrierefreiheit im echten Browser: zugängliche Namen aller Bedienelemente (berechnet vom Browser),
// Bedienung der Navigation mit der Tastatur und sichtbarer Fokus, erzwungene Farben (Windows-Kontrastmodus, nur
// Chromium), axe-core je Bereich (seit 0.6.5).
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { bereich, netzVorbereiten, oeffnen, S1_VORSCHLAG, schluesselSetzen } from "./hilfen";

const BEREICHE = ["Meldung", "KI-Erfassung", "Lagebild", "Profile", "Einstellungen"] as const;
const ROLLEN = ["button", "textbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "link", "searchbox", "listbox"];

/** Bedienelemente ohne zugänglichen Namen aus dem Barrierebaum, den Chromium berechnet */
async function ohneNamen(page: Page): Promise<string[]> {
  const baum = await page.locator("body").ariaSnapshot();
  const muster = new RegExp(`^\\s*- (${ROLLEN.join("|")})(?: \\[[^\\]]*\\])*:?\\s*$`);
  return baum.split("\n").filter((z) => muster.test(z));
}

test.beforeEach(async ({ page }, info) => {
  // Der Test zur Eindeutigkeit der Namen (frühere Läufe) und die axe-Prüfung der Bestätigung brauchen eine Antwort von S1
  const s1 = info.title.startsWith("TP-2026-W44-14") || info.titlePath.some((t) => t.startsWith("TP-2026-W44-22"));
  await netzVorbereiten(page, () => (s1 ? JSON.stringify(S1_VORSCHLAG) : "haengen"));
  await oeffnen(page);
});

for (const b of BEREICHE) {
  test(`${b}: alle Bedienelemente haben einen zugänglichen Namen`, async ({ page }) => {
    await bereich(page, b);
    if (b === "Lagebild") {
      await page.getByRole("button", { name: /Beispiel laden:/ }).click();
      await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
    }
    expect(await ohneNamen(page)).toEqual([]);
  });
}

// Befunde KP-2026-W43-61, -62 und -64 (Prüfung der Eingabemaske vom 25.10.2026): Hilfetexte als zugängliche
// Beschreibung, nicht als Teil des Namens; sichtbarer Name der Stichtagsgruppe gleich dem zugänglichen
test("KI-Erfassung: Hilfetexte der Auftragsfelder sind zugängliche Beschreibungen (KP-2026-W43-61, -62, -64)", async ({ page }) => {
  await bereich(page, "KI-Erfassung");
  const gegenstand = page.getByRole("textbox", { name: "Untersuchungsgegenstand und Erkenntnisinteresse", exact: true });
  await expect(gegenstand).toHaveAccessibleDescription(/^Welche Lage oder welches Ereignis soll die KI-Recherche erfassen/);
  await expect(gegenstand).toHaveValue("");
  const ausgang = page.getByRole("textbox", { name: "Ausgangsinformationen und Stichworte", exact: true });
  await expect(ausgang).toHaveAccessibleDescription(/^Welche Informationen liegen bereits vor\?/);
  await expect(ausgang).toHaveValue("");
  await expect(page.getByRole("group", { name: "Stichtag der Meldung", exact: true })).toHaveAccessibleDescription(
    /^Für welchen Tag soll die Meldung gelten\?/,
  );
});

test("Navigation mit der Tastatur: Fokus ist sichtbar, Eingabetaste wechselt den Bereich", async ({ page }) => {
  const ziel = page.getByRole("button", { name: "Lagebild", exact: true });
  let gefunden = false;
  for (let i = 0; i < 30 && !gefunden; i++) {
    await page.keyboard.press("Tab");
    gefunden = await ziel.evaluate((el) => el === document.activeElement);
  }
  expect(gefunden, "„Lagebild“ per Tab erreichbar").toBe(true);
  const fokus = await ziel.evaluate((el) => {
    const s = getComputedStyle(el);
    return { matches: el.matches(":focus-visible"), outline: s.outlineStyle, breite: parseFloat(s.outlineWidth), schatten: s.boxShadow };
  });
  expect(fokus.matches).toBe(true);
  expect((fokus.outline !== "none" && fokus.breite >= 2) || fokus.schatten !== "none", JSON.stringify(fokus)).toBe(true);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /Beispiel laden:/ })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Gegenstand bestimmen (S1)" })).toBeVisible();
});

test("Erzwungene Farben: aktive Auswahl in Systemfarben, Marken mit Kontur", async ({ page, browserName }) => {
  // forced-colors lässt sich nur in Chromium nachbilden (Windows-Kontrastmodus); seit 0.6.5 läuft die Datei auch in WebKit
  test.skip(browserName !== "chromium", "forced-colors nur in Chromium emulierbar");
  await page.emulateMedia({ forcedColors: "active" });
  await bereich(page, "Lagebild");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();

  const werte = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "forced-color-adjust:none;background:Highlight;color:HighlightText";
    document.body.appendChild(probe);
    const sys = getComputedStyle(probe);
    const nav = document.querySelector(".nav.aktiv")!;
    const n = getComputedStyle(nav);
    const marke = document.querySelector(".lb-marke, .lb-flag");
    const m = marke ? getComputedStyle(marke) : null;
    return {
      highlight: sys.backgroundColor,
      highlightText: sys.color,
      navHintergrund: n.backgroundColor,
      navText: n.color,
      markeKontur: m ? `${m.borderTopStyle} ${m.borderTopWidth}` : null,
    };
  });
  expect(werte.navHintergrund).toBe(werte.highlight);
  expect(werte.navText).toBe(werte.highlightText);
  expect(werte.markeKontur).toMatch(/^solid [1-9]/);
});

// Laufanzeige (seit 0.6.5): Die Uhr zählt sichtbar weiter, liegt aber in keiner Live-Region; angesagt werden nur der
// Wechsel der Stufe und neue Protokolleinträge über eine eigene Statusregion.
test("TP-2026-W44-12: während eines Laufs enthält keine Live-Region den Sekundenzähler", async ({ page }) => {
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  const zaehler = page.locator('[role="timer"]');
  await expect(zaehler).toHaveText(/^\d+ s$/);
  // Mindestens ein Takt der Uhr, damit ein angesagter Zähler auffiele
  await expect(zaehler).not.toHaveText("0 s");
  const live = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]')].map((el) => ({
      text: el.textContent || "",
      mitZaehler: !!el.querySelector('[role="timer"]'),
    })),
  );
  expect(live.filter((l) => l.mitZaehler)).toEqual([]);
  expect(live.filter((l) => /\b\d+ s\b/.test(l.text))).toEqual([]);
  expect(await zaehler.evaluate((el) => !!el.closest('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]'))).toBe(false);
  // Die Statusregion nennt die Stufe
  await expect(page.locator('.laeuft [role="status"]')).toHaveText("Stufe S1: Gegenstand und SOP-Auswahl");
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
});

/**
 * Listen mit Einträgen, die jeweils eigene Bedienelemente tragen: Liste und Eintrag als Selektor. Geprüft werden die
 * zugänglichen Namen (von Chromium berechnet) der Schaltflächen und Links aller Einträge einer Liste.
 */
const LISTEN = [
  { liste: "ul, ol", eintrag: ":scope > li" },
  { liste: "tbody", eintrag: ":scope > tr" },
  { liste: ".liste", eintrag: ":scope > section > .element-kopf, :scope > .element > .element-kopf" },
  { liste: ".lb-karten", eintrag: ":scope > article > footer" },
];

/** Namen, die innerhalb einer Liste mehr als einmal vorkommen („Liste: Rolle Name“) */
async function doppelteNamen(page: Page): Promise<string[]> {
  const out: string[] = [];
  for (const { liste, eintrag } of LISTEN) {
    const listen = page.locator(liste);
    for (let i = 0; i < (await listen.count()); i++) {
      const l = listen.nth(i);
      if (!(await l.isVisible())) continue;
      const eintraege = l.locator(eintrag);
      const namen: string[] = [];
      for (let j = 0; j < (await eintraege.count()); j++) {
        const baum = await eintraege.nth(j).ariaSnapshot();
        namen.push(...[...baum.matchAll(/- (button|link) "([^"]+)"/g)].map((m) => `${m[1]} „${m[2]}“`));
      }
      for (const n of new Set(namen.filter((x, k) => namen.indexOf(x) !== k))) out.push(`${liste}: ${n}`);
    }
  }
  return out;
}

// Seit 0.6.5: Schaltflächen wie „Entfernen“, „Übernehmen“, „Protokoll“ und „Löschen“ nennen in Listen ihren Eintrag
test("TP-2026-W44-14: zugängliche Namen der Bedienelemente sind je Liste eindeutig", async ({ page }) => {
  // Meldung mit zwei Sachverhalten
  await page
    .getByRole("button", { name: /Sachverhalte/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Sachverhalt hinzufügen/ }).click();
  expect(await doppelteNamen(page)).toEqual([]);

  // KI-Erfassung mit zwei Dateien und zwei früheren Läufen
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.locator('.ki input[type="file"]').setInputFiles([
    { name: "notiz-a.txt", mimeType: "text/plain", buffer: Buffer.from("Erste Notiz") },
    { name: "notiz-b.txt", mimeType: "text/plain", buffer: Buffer.from("Zweite Notiz") },
  ]);
  await expect(page.locator(".materialliste li")).toHaveCount(2);
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
    await page.getByRole("button", { name: "Zurück zum Auftrag" }).click();
  }
  await page.getByText("Frühere Läufe mit diesem Profil (2)").click();
  expect(await doppelteNamen(page)).toEqual([]);

  // Lagebild mit Beispiel: Übersicht (Meldestatus), Meldungen, Kopiervorlage
  await bereich(page, "Lagebild");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  for (const reiter of ["Übersicht", "Meldungen", "Kopiervorlage"]) {
    await page.getByRole("navigation", { name: "Ansichten" }).getByRole("button", { name: reiter }).click();
    expect(await doppelteNamen(page), reiter).toEqual([]);
  }
});

// Automatische Prüfung mit axe-core (seit 0.6.5): Regeln zu WCAG 2.0, 2.1 und 2.2, Stufen A und AA, je Bereich mit allen
// Schritten, Reitern und Bereichen der Einstellungen; breit und hell, schmal und dunkel (Systemvorgabe, Farbschema
// „Neutral“). Ausnahmen gibt es keine; käme eine hinzu, stünde sie mit Begründung in docs/BARRIEREFREIHEIT.md und hier
// als disableRules/exclude.
const AXE_REGELN = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const VARIANTEN = [
  { breite: 1280, schema: "light" },
  { breite: 390, schema: "dark" },
] as const;

/** Verstöße der aktuellen Seite als lesbare Zeilen („Zustand: Regel × Anzahl: Elemente“) */
async function axeVerstoesse(page: Page, zustand: string): Promise<string[]> {
  // Übergänge abwarten (etwa Farbe des KI-Chips nach dem Wechsel auf dunkel, 0,3 s), sonst misst axe Zwischenfarben;
  // endlose Animationen (Puls des KI-Chips) ändern keine Farben von Text oder Fläche
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity));
  const erg = await new AxeBuilder({ page }).withTags(AXE_REGELN).analyze();
  return erg.violations.map((v) => `${zustand}: ${v.id} × ${v.nodes.length}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

/** Prüft je Variante die Zustände, die `durchlaufen` herstellt (es ruft pruefen(name) für jeden auf) */
async function jeVariante(page: Page, durchlaufen: (pruefen: (name: string) => Promise<void>) => Promise<void>): Promise<string[]> {
  const verstoesse: string[] = [];
  for (const { breite, schema } of VARIANTEN) {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.emulateMedia({ colorScheme: schema });
    // Erst messen, wenn die App das Schema angewandt hat (sie wechselt per JavaScript); sonst findet die Wartefunktion
    // in axeVerstoesse noch keinen laufenden Übergang, und axe misst mitten im Farbwechsel (CI, 27.10.2026)
    const modus = schema === "dark" ? "dunkel" : "hell";
    await page.waitForFunction((m) => document.documentElement.dataset.farbmodus === m, modus);
    await durchlaufen(async (name) => void verstoesse.push(...(await axeVerstoesse(page, `${breite}px ${schema} ${name}`))));
  }
  return verstoesse;
}

test.describe("TP-2026-W44-22: axe-core je Bereich ohne Verstöße gegen WCAG 2.2 A und AA", () => {
  test.describe.configure({ timeout: 120_000 });

  test("Meldung: alle Schritte", async ({ page }) => {
    const schritte = page.getByRole("navigation", { name: "Schritte" }).getByRole("button");
    const v = await jeVariante(page, async (pruefen) => {
      for (let i = 0; i < (await schritte.count()); i++) {
        await schritte.nth(i).click();
        await pruefen(`Meldung, Schritt ${i + 1}`);
      }
    });
    expect(v).toEqual([]);
  });

  test("KI-Erfassung: Auftrag und Bestätigung des Gegenstands", async ({ page }) => {
    await schluesselSetzen(page);
    await bereich(page, "KI-Erfassung");
    await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
    await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
    const v = await jeVariante(page, (pruefen) => pruefen("KI-Erfassung, Auftrag"));
    await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Gegenstand bestätigen" })).toBeVisible();
    v.push(...(await jeVariante(page, (pruefen) => pruefen("KI-Erfassung, Bestätigung"))));
    expect(v).toEqual([]);
  });

  test("Lagebild: alle Reiter mit Beispiel und Übergabedialog", async ({ page }) => {
    await bereich(page, "Lagebild");
    await page.getByRole("button", { name: /Beispiel laden:/ }).click();
    await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
    const reiter = page.getByRole("navigation", { name: "Ansichten" }).getByRole("button");
    const v = await jeVariante(page, async (pruefen) => {
      for (let i = 0; i < (await reiter.count()); i++) {
        await reiter.nth(i).click();
        await pruefen(`Lagebild, Reiter ${i + 1}`);
      }
      await page.getByRole("button", { name: "An KI-Verdichtung übergeben" }).click();
      await pruefen("Lagebild, Übergabe");
      await page.keyboard.press("Escape");
    });
    expect(v).toEqual([]);
  });

  test("Profile", async ({ page }) => {
    await bereich(page, "Profile");
    expect(await jeVariante(page, (pruefen) => pruefen("Profile"))).toEqual([]);
  });

  test("Einstellungen: alle Bereiche", async ({ page }) => {
    await bereich(page, "Einstellungen");
    const bereiche = page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button");
    const v = await jeVariante(page, async (pruefen) => {
      for (let i = 0; i < (await bereiche.count()); i++) {
        await bereiche.nth(i).click();
        await pruefen(`Einstellungen, Bereich ${i + 1}`);
      }
    });
    expect(v).toEqual([]);
  });
});
