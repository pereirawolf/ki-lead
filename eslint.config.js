// ESLint für KI-LEAD (seit 0.6.2, TP-2026-W44-08): typescript-eslint mit Typinformationen, React-Hooks, schwebende
// Promises und vollständige switch-Anweisungen. `no-explicit-any` ist eine Warnung (Maßgabe des Herausgebers), damit
// die vorhandenen Stellen schrittweise abgebaut werden können; die CI scheitert nur an Fehlern.
//
// typescript-eslint braucht die TypeScript-API, die TypeScript 7 (Go) nicht mehr bietet. Deshalb zeigt `typescript` in
// package.json auf das Kompatibilitätspaket @typescript/typescript6 (API und `tsc6`), und `@typescript/native` liefert
// TypeScript 7 als `tsc` für Typprüfung und Build (empfohlener Weg der TypeScript-Ankündigung 7.0).

import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "android/**",
      "ios/**",
      "playwright-report/**",
      "test-results/**",
      "privat/**",
      "public/**",
      "src/pwa/sw-vorlage.js",
    ],
  },
  // Quellcode: streng, mit Typinformationen aus tsconfig.json
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: {
      // React-Hooks: die beiden klassischen Regeln. Die Regeln des React-Compilers (set-state-in-effect, purity, refs …)
      // aus eslint-plugin-react-hooks 7 verlangen einen Umbau der großen Komponenten und gehören zur Frontend-Tranche
      // (TP-2026-W44-17); sie bleiben hier aus.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
      // Async-Ereignisbehandler in JSX (onClick={async () => …}) sind in React üblich; Rückgabewerte werden dort verworfen
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false, properties: false, arguments: false } }],
      // Der Code arbeitet bewusst viel mit any und unknown (Rohantworten der Anbieter, Meldungen beliebiger Profile,
      // String(x || "") als Normalisierung); diese Folgeregeln meldeten Hunderte Stellen und werden mit dem Abbau von any
      // wieder angeschaltet
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowAny: true, allowBoolean: true, allowNullish: true, allowNumber: true, allowRegExp: true, allowNever: true },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
  // Tests, Konfiguration und Skripte: ohne Typinformationen, großzügiger
  {
    files: ["tests/**/*.ts", "vite.config.ts", "playwright.config.ts", "playwright.probe.config.ts", "scripts/**/*.mjs"],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
  },
);
