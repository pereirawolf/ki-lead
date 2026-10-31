// Einstellungen in Bereichen (seit 0.5.6) im echten Browser: zugängliche Namen in jedem Bereich, Bedienung mit der
// Tastatur, schmale Ansicht (Smartphone) mit waagerechter Bereichsleiste ohne seitliches Scrollen der Seite,
// Bereich bleibt beim Wechsel der Ansicht erhalten, Schlüssel bleibt nach dem Neuladen am bisherigen Ort.
import { expect, test } from "@playwright/test";
import { bereich, forschungEinschalten, netzVorbereiten, oeffnen } from "./hilfen";

const BEREICHE = ["Übersicht", "KI-Anbieter & API", "Modelle & Aufwand", "Testläufe", "Recherche & Grenzen", "Darstellung", "Daten", "Über KI-LEAD"];
const ROLLEN = ["button", "textbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "link", "searchbox", "listbox"];

test.beforeEach(async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  // alle acht Bereiche: Forschungsfunktionen einschalten (Vorgabe aus, seit 0.6.16)
  await forschungEinschalten(page);
});

const leiste = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Bereiche der Einstellungen" });

test("jeder Bereich: genau eine Bereichsüberschrift, alle Bedienelemente mit zugänglichem Namen", async ({ page }) => {
  const muster = new RegExp(`^\\s*- (${ROLLEN.join("|")})(?: \\[[^\\]]*\\])*:?\\s*$`);
  for (const b of BEREICHE) {
    await leiste(page).getByRole("button", { name: b, exact: true }).click();
    await expect(page.locator(".bereich-inhalt h2")).toHaveText([b]);
    await expect(leiste(page).getByRole("button", { name: b, exact: true })).toHaveAttribute("aria-current", "page");
    const baum = await page.locator("body").ariaSnapshot();
    expect(
      baum.split("\n").filter((z) => muster.test(z)),
      b,
    ).toEqual([]);
  }
});

test("Vorgabe: ohne Forschungsfunktionen kein Bereich „Testläufe“; nach dem Einschalten bleibt er nach dem Neuladen", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Forschungsfunktionen anzeigen" }).uncheck();
  await expect(leiste(page).getByRole("button")).toHaveText(BEREICHE.filter((b) => b !== "Testläufe"));
  await page.getByRole("checkbox", { name: "Forschungsfunktionen anzeigen" }).check();
  // Erst neu laden, wenn die Wahl im Gerätespeicher steht (das Schreiben ist asynchron; ohne Warten in der CI unzuverlässig)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((fertig) => {
            const db = indexedDB.open("keyval-store");
            db.onsuccess = () => {
              const g = db.result.transaction("keyval").objectStore("keyval").get("einstellungen");
              g.onsuccess = () => fertig(g.result?.forschung ?? null);
              g.onerror = () => fertig(null);
            };
            db.onerror = () => fertig(null);
          }),
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await bereich(page, "Einstellungen");
  await expect(leiste(page).getByRole("button")).toHaveText(BEREICHE);
});

test("Tastatur: Bereich per Tab erreichen und mit Eingabetaste bzw. Leertaste wechseln", async ({ page }) => {
  const ziel = leiste(page).getByRole("button", { name: "Modelle & Aufwand", exact: true });
  let gefunden = false;
  for (let i = 0; i < 40 && !gefunden; i++) {
    await page.keyboard.press("Tab");
    gefunden = await ziel.evaluate((el) => el === document.activeElement);
  }
  expect(gefunden, "„Modelle & Aufwand“ per Tab erreichbar").toBe(true);
  expect(await ziel.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Modelle & Aufwand"]);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Testläufe"]);
});

test("Smartphone: Bereichsleiste waagerecht über dem Inhalt, Seite ohne seitliches Scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const b of BEREICHE) {
    await leiste(page).getByRole("button", { name: b, exact: true }).click();
    const masse = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Bereiche der Einstellungen"]')!.getBoundingClientRect();
      const inhalt = document.querySelector(".bereich-inhalt")!.getBoundingClientRect();
      const knoepfe = [...document.querySelectorAll('nav[aria-label="Bereiche der Einstellungen"] button')].map((k) => k.getBoundingClientRect().top);
      // Im Fehlerfall die überstehenden Elemente nennen (Diagnose für WebKit in der CI, seit 0.6.5)
      // (ganze Seite: äußerste überstehende Elemente außerhalb scrollender oder zuschneidender Bereiche, mit Breite und
      // position; dazu die Breiten von html und body)
      const breite = window.innerWidth;
      const name = (el: Element) => `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).trim().split(/\s+/).join(".") : ""}`;
      const schneidet = (el: Element) => getComputedStyle(el).overflowX !== "visible";
      const steht = (el: Element) => el.getBoundingClientRect().right > breite + 1 || el.scrollWidth > breite + 1;
      const frei = (el: Element) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (schneidet(p)) return false;
        return true;
      };
      // überstehender Inhalt (auch Text, der nicht umbricht): tiefste Elemente, deren Inhalt breiter ist als ihr Kasten
      const kandidaten = [...document.body.querySelectorAll("*")].filter((el) => steht(el) && frei(el));
      const ueberlauf = kandidaten.filter((el) => el.scrollWidth > el.clientWidth + 1 && !schneidet(el));
      const tiefste = ueberlauf.filter((el) => !ueberlauf.some((k) => k !== el && el.contains(k)));
      const aeusserste = tiefste.length ? tiefste : kandidaten.filter((el) => !kandidaten.some((a) => a !== el && a.contains(el)));
      const zuBreit = [
        `scrollWidth html ${document.documentElement.scrollWidth} px, body ${document.body.scrollWidth} px bei ${breite} px`,
        ...aeusserste.slice(0, 6).map((el) => {
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
          return `${name(el)} in ${el.parentElement ? name(el.parentElement) : ""} (${Math.round(r.left)}–${Math.round(r.right)} px, scrollWidth ${el.scrollWidth}, ${st.position}, overflow-x ${st.overflowX}, display ${st.display}) „${text}“`;
        }),
      ];
      return {
        navOben: nav.bottom <= inhalt.top + 1,
        eineZeile: Math.max(...knoepfe) - Math.min(...knoepfe) < 2,
        seiteBreiter: document.documentElement.scrollWidth > breite,
        zuBreit: document.documentElement.scrollWidth > breite ? zuBreit : [],
      };
    });
    expect(masse, b).toEqual({ navOben: true, eineZeile: true, seiteBreiter: false, zuBreit: [] });
  }
});

test("der gewählte Bereich bleibt beim Wechsel der Ansicht erhalten", async ({ page }) => {
  await leiste(page).getByRole("button", { name: "Recherche & Grenzen", exact: true }).click();
  await bereich(page, "Auswertung");
  await bereich(page, "Einstellungen");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Recherche & Grenzen"]);
});

test("Mistral-Schlüssel: Speichern, Übersicht zeigt ihn als hinterlegt, nach dem Neuladen noch da", async ({ page }) => {
  await leiste(page).getByRole("button", { name: "KI-Anbieter & API", exact: true }).click();
  const feld = page.getByLabel("API-Schlüssel Mistral");
  await feld.fill("mistral-TEST-NICHT-EXPORTIEREN");
  await feld.locator("xpath=ancestor::section[1]").getByRole("button", { name: "Speichern" }).click();
  await leiste(page).getByRole("button", { name: "Übersicht", exact: true }).click();
  await expect(page.getByRole("row", { name: /^Mistral hinterlegt/ })).toBeVisible();
  await page.reload();
  await bereich(page, "Einstellungen");
  await expect(page.getByRole("row", { name: /^Mistral hinterlegt/ })).toBeVisible();
});

// Adresse (seit 0.6.5): Ansicht, Bereich und Reiter stehen im Hash; Neuladen behält sie, Zurück wechselt
test("TP-2026-W44-20: Bereich der Einstellungen und Reiter des Lagebilds stehen in der Adresse", async ({ page }) => {
  await leiste(page).getByRole("button", { name: "Modelle & Aufwand", exact: true }).click();
  await expect(page).toHaveURL(/#\/einstellungen\/modelle$/);
  await page.reload();
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Modelle & Aufwand"]);

  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await page.getByRole("navigation", { name: "Ansichten" }).getByRole("button", { name: "Redaktionscheck" }).click();
  await expect(page).toHaveURL(/#\/lagebild\/redaktion$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/lagebild\/uebersicht$/);
  await page.goBack();
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Modelle & Aufwand"]);
});
