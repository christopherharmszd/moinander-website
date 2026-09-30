# Moinander e.V. Website

Der öffentliche Webauftritt ist eine React/Vite Website mit eigenen Seiten für Verein, Projekte, Termine, Partner, Mitmachen und Kontakt.

## Lokal ansehen

```sh
npm ci
npm run dev
```

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` baut die Website bei Änderungen auf `main` und veröffentlicht `dist/client` über GitHub Pages. Die Build-Basis übernimmt er aus der Pages-Konfiguration. Dadurch funktionieren Links unter einer `github.io/Repository/`-Adresse und unter einer später verbundenen eigenen Domain.

Im Repository muss unter **Settings → Pages** als Quelle **GitHub Actions** ausgewählt sein. Eine eigene Domain wird dort erst nach Abstimmung und Prüfung der DNS-Einträge eingerichtet.

## Inhalte und Formulare

- Projekte, Termine, Partner und Vorstand werden aus dem Sanity-Projekt `nqq96vbs` geladen. Nur veröffentlichte Dokumente erscheinen öffentlich. Die Redaktion läuft im [eigenen Cloudflare Worker](https://moinander-studio.christopher-harms.workers.dev/) und verlangt eine Sanity-Anmeldung. Ihre Konfiguration liegt unter `studio/`.
- Web3Forms für Kontakt und Projektvorschläge ist mit dem Moinander-Formular und dem Empfänger `info@moinander.de` verbunden. Die Formulare zeigen Erfolg erst nach einer bestätigten Antwort des Dienstes.
- Die Vereinsdomain `moinander.de` wird nach Prüfung der Web- und Mail-DNS-Einträge verbunden.
