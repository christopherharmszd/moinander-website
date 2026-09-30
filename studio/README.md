# Moinander Redaktion

Dieses Studio verwendet das Sanity-Projekt `nqq96vbs` und den öffentlichen Datensatz `production`. Redakteure melden sich mit ihrem eigenen Sanity-Konto an. Schreib-Tokens werden weder in diesem Studio noch in der öffentlichen Website gespeichert.

```sh
npm ci
npm run dev
npm run build
```

Ein veröffentlichter Datensatz ist noch kein veröffentlichter Beitrag: Nur in Sanity veröffentlichte Dokumente erscheinen auf der Website. Bis zur Veröffentlichung eigener Einträge zeigt die Website ihre vorhandenen Einführungstexte.

Die Redaktion ist unter `https://moinander-studio.christopher-harms.workers.dev/` veröffentlicht. `npm run deploy` baut das Studio und veröffentlicht die statischen Dateien erneut als eigenen Cloudflare Worker. Für die Bearbeitung genügt die Sanity-Anmeldung des berechtigten Mitglieds. Ein zusätzlicher API-Token wäre nur für eine eigene serverseitige Schreib-API nötig.
