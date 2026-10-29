// Bewegung beim Scrollen (seit 0.6.5, TP-2026-W44-14): sanft nur ohne die Systemeinstellung „Bewegung reduzieren“.
// CSS-Übergänge schaltet styles.css bei prefers-reduced-motion ab; scrollIntoView({ behavior: "smooth" }) folgte dem bis
// 0.6.4 nicht.

export function scrollVerhalten(): ScrollBehavior {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  } catch {
    return "auto";
  }
}
