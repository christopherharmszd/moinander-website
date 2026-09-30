# Moinander e.V. Website

Der öffentliche Webauftritt ist eine React/Vite Website mit eigenen Seiten für Verein, Projekte, Termine, Partner, Mitmachen und Kontakt.

## Lokal ansehen

```sh
npm ci
npm run dev
```

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` baut die Website bei Änderungen auf `main` und veröffentlicht `dist/client` über GitHub Pages. Die Build-Basis übernimmt er aus der Pages-Konfiguration. Der öffentliche Auftritt liegt auf `https://moinander.de/`.

Unter **Settings → Pages** ist **GitHub Actions** als Quelle ausgewählt. Die Domain ist bereits verbunden.

## Inhalte und Formulare

- Projekte, Termine, Partner und Vorstand werden aus dem Sanity-Projekt `nqq96vbs` geladen. Nur veröffentlichte Dokumente erscheinen öffentlich. Die eigene Redaktion ist über [moinander.de/studio/](https://moinander.de/studio/) erreichbar und leitet zur Anmeldeseite des Cloudflare Workers weiter. Redakteure brauchen keinen Sanity-Zugang. Die Implementierung liegt unter `studio/`.
- Web3Forms für Kontakt und Projektvorschläge ist mit dem Moinander-Formular und dem Empfänger `info@moinander.de` verbunden. Die Formulare zeigen Erfolg erst nach einer bestätigten Antwort des Dienstes.
- Die Vereinsdomain `moinander.de` ist mit GitHub Pages verbunden. Die Mail-DNS-Einträge bleiben davon unabhängig.
