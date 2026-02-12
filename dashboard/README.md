# AR Landmarks - Dashboard

Web-Oberflaeche zur Verwaltung der Landmarks. Hier kannst du Sehenswuerdigkeiten hinzufuegen, bearbeiten, loeschen und Daten aus der Zurich Tourism API importieren.

## Voraussetzungen

- **Node.js** Version 18 oder neuer
  - Download: [nodejs.org](https://nodejs.org) (nimm die "LTS"-Version)
  - Pruefe ob installiert: Oeffne Terminal und tippe `node --version`
- **Supabase-Projekt** mit eingerichteter Datenbank (siehe [Haupt-README](../README.md#2-supabase-datenbank-einrichten))

## Einrichtung

### Schritt 1: Abhaengigkeiten installieren

Oeffne das Terminal und navigiere zum Dashboard-Ordner:

```bash
cd dashboard
npm install
```

Das laedt alle benoetigten Pakete herunter. Das dauert beim ersten Mal 1-2 Minuten.

### Schritt 2: Umgebungsvariablen konfigurieren

Das Dashboard braucht Zugangsdaten zu deiner Supabase-Datenbank. Diese werden in einer lokalen Datei gespeichert, die nicht ins Git-Repository hochgeladen wird.

1. Erstelle die Konfigurationsdatei:
   ```bash
   cp .env.example .env.local
   ```

2. Oeffne `.env.local` mit einem Texteditor und trage deine Daten ein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_KEY=DEIN_SUPABASE_SERVICE_ROLE_KEY
   ```

**Wo finde ich diese Werte?**

1. Gehe zu [supabase.com](https://supabase.com) und oeffne dein Projekt
2. Klicke links unten auf das **Zahnrad-Symbol** (Project Settings)
3. Gehe zu **API** (unter Configuration)
4. Dort findest du:

| Wert | Wo in Supabase |
|------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (ganz oben) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys** > `anon` `public` |
| `SUPABASE_SERVICE_KEY` | **Project API keys** > `service_role` `secret` (klicke auf "Reveal") |

**Wichtig:** Der `service_role`-Key hat vollen Zugriff auf die Datenbank. Teile ihn niemals oeffentlich und lade ihn nicht ins Git-Repository hoch.

### Schritt 3: Dashboard starten

```bash
npm run dev
```

Oeffne deinen Browser und gehe zu [http://localhost:3000](http://localhost:3000).

Du siehst die **Login-Seite**. Erstelle einen Account mit E-Mail und Passwort, oder melde dich mit Google an (falls konfiguriert).

## Funktionen

### Login
- **E-Mail + Passwort**: Erstelle einen Account direkt im Dashboard
- **Google-Login**: Optional, falls Google OAuth in Supabase konfiguriert ist (siehe unten)

### Dashboard-Seite (`/dashboard`)
- **Landmark-Liste**: Zeigt alle Sehenswuerdigkeiten mit Name, Koordinaten, Status
- **Suche**: Landmarks nach Name filtern
- **Sortierung**: Nach Name, Aenderungsdatum oder Status sortieren
- **Bearbeiten**: Klicke auf das Stift-Symbol um Details zu aendern
- **Loeschen**: Klicke auf das Muelleimer-Symbol
- **Sync POIs**: Importiert Sehenswuerdigkeiten aus der Zurich Tourism API

## Google-Login einrichten (optional)

Falls du Google-Login im Dashboard nutzen moechtest:

1. **Google Cloud Console**:
   - Gehe zu [console.cloud.google.com](https://console.cloud.google.com)
   - Erstelle ein neues Projekt (oder verwende ein bestehendes)
   - Gehe zu **APIs & Services > Credentials**
   - Klicke **Create Credentials > OAuth client ID**
   - Waehle "Web application"
   - Unter "Authorized redirect URIs" fuege hinzu:
     ```
     https://DEIN-PROJEKT-ID.supabase.co/auth/v1/callback
     ```
   - Notiere dir die **Client ID** und das **Client Secret**

2. **Supabase**:
   - Gehe zu deinem Projekt auf [supabase.com](https://supabase.com)
   - Klicke links auf **Authentication** > **Providers**
   - Aktiviere **Google**
   - Trage die Client ID und das Client Secret ein
   - Speichern

## Fuer Fortgeschrittene: Deployment auf Vercel

Falls du das Dashboard online stellen moechtest:

1. Erstelle einen Account auf [vercel.com](https://vercel.com)
2. Verbinde dein GitHub-Repository
3. Setze die folgenden **Environment Variables** in den Vercel-Projekteinstellungen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Vercel baut und deployed das Dashboard automatisch

## Verfuegbare Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet den Entwicklungsserver auf [localhost:3000](http://localhost:3000) |
| `npm run build` | Erstellt eine optimierte Version fuer Produktion |
| `npm start` | Startet die Produktionsversion (nach `npm run build`) |
| `npm run lint` | Prueft den Code auf Fehler |

## Haeufige Probleme

### "npm: command not found"
Node.js ist nicht installiert. Lade es von [nodejs.org](https://nodejs.org) herunter (LTS-Version) und installiere es.

### "Missing NEXT_PUBLIC_SUPABASE_URL"
Die `.env.local`-Datei fehlt oder ist nicht korrekt ausgefuellt. Stelle sicher, dass du Schritt 2 ausgefuehrt hast.

### Login funktioniert nicht
- Pruefe, ob die Supabase-URL und der Anon Key in `.env.local` korrekt sind
- Pruefe auf [supabase.com](https://supabase.com) unter Authentication > Users, ob dein Account existiert
- Falls E-Mail-Bestaetigung aktiviert ist: Pruefe dein Postfach

### "Sync POIs" zeigt Fehler
- Der `SUPABASE_SERVICE_KEY` in `.env.local` muss der `service_role`-Key sein (nicht der `anon`-Key)
- Pruefe, ob die Datenbank-Tabellen korrekt erstellt wurden (siehe [Haupt-README](../README.md#2-supabase-datenbank-einrichten))

### Seite laedt, aber zeigt keine Daten
- Pruefe, ob Landmarks in der Datenbank vorhanden sind
- Fuehre einen "Sync POIs" aus oder erstelle manuell einen Landmark

## Naechste Schritte

- [Hauptseite README](../README.md) - Zurueck zur Uebersicht
- [iOS App einrichten](../ios/ARLandmarks/README.md) - iOS-App starten
- [ML Training](../ml_training/README.md) - Eigenes Erkennungsmodell trainieren
