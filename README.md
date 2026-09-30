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

## Noch zu verbinden

- Sanity für redaktionelle Inhalte und die Studio-Verwaltung. Die öffentliche Website darf nur veröffentlichte Inhalte abrufen. Schreibzugänge und Tokens gehören nicht in den Browser oder dieses Repository.
- Web3Forms für das Kontaktformular und Projektvorschläge. Der aktuelle Formularzustand ist ein sichtbarer Entwurf und versendet noch keine Nachricht.
- Die Vereinsdomain, sobald Web- und Mail-DNS geprüft sind.
