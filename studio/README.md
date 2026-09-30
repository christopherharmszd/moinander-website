# Moinander Redaktion

Die eigene Redaktionsoberfläche läuft im Cloudflare Worker `moinander-studio`. Der Einstieg auf der öffentlichen Website ist `https://moinander.de/studio/`; er leitet zur Worker-Anmeldeseite weiter. Redakteure pflegen Projekte und Beiträge, Termine, Partner und Sponsoren sowie den Vorstand in einfachen Formularen. Entwürfe bleiben intern; veröffentlichte Inhalte werden über Sanity auf der Website angezeigt.

Sanity-Projekt: `nqq96vbs`, Datensatz: `production`. Die Redaktion nutzt **keine Sanity-Anmeldung**. Der Worker greift serverseitig mit einem Editor-Token auf Sanity zu. Das Token und die Anmeldedaten gehören ausschließlich in verschlüsselte Worker-Secrets und niemals in Browser-Code, `.env`-Dateien oder Git.

## Lokal und Deployment

Vom Repository-Stamm:

```sh
npm ci
npm run build:studio
npm run test:studio
```

Im Verzeichnis `studio/`:

```sh
npm ci
npm run dev
npm run deploy
```

Benötigte Worker-Secrets sind `STUDIO_ADMIN_ACCOUNTS` (PBKDF2-Verifier, siehe `auth.js`), `STUDIO_SESSION_SECRET` und `SANITY_WRITE_TOKEN`. Das konfigurierte `LOGIN_LIMITER`-Binding begrenzt Anmeldeversuche. Bei einer neuen Deployment-Umgebung müssen die Secrets separat eingerichtet werden; sie sind nicht im Repository enthalten.

Der Worker darf nur Inhalte der vier freigegebenen Typen bearbeiten. Für Projektbeiträge lassen sich drei Startseitenplätze auswählen; der nächste veröffentlichte Termin wird auf der Website automatisch ermittelt. Bilder werden über den Worker direkt nach Sanity hochgeladen.

Projektbeiträge bestehen aus frei sortierbaren Absätzen, Überschriften und Bildblöcken. Bildblöcke können eine Bildunterschrift, barrierefreie Beschreibung und einen Nachweis enthalten. Leere Bildplätze lassen sich als Entwurf speichern; für eine Veröffentlichung müssen alle eingefügten Bildblöcke ein hochgeladenes Bild enthalten. Bestehende reine Textbeiträge werden beim Öffnen in Textblöcke übernommen.

Für neue Projektbeiträge stehen die Vorlagen **Kurzer Beitrag**, **Bildbericht** und **Ausführlicher Artikel** bereit. Sie unterscheiden sich durch ihre Startblöcke und die Lesebreite der öffentlichen Artikelseite. Nach der Auswahl bleiben alle Blöcke frei bearbeitbar. Ein Wechsel der Vorlage erhält bereits geschriebene Inhalte; ältere Beiträge nutzen zunächst die ausführliche Darstellung.
