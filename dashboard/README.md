# AR Landmarks - Dashboard

Web-Oberfläche zur Verwaltung der Landmarks. Hier kannst du Sehenswürdigkeiten hinzufügen, bearbeiten, löschen und Daten aus der Zurich Tourism API importieren.

## Voraussetzungen

- **Node.js** Version 18 oder neuer
  - Download: [nodejs.org](https://nodejs.org) (nimm die "LTS"-Version)
  - Prüfe ob installiert: Öffne Terminal und tippe `node --version`
- **Supabase-Projekt** mit eingerichteter Datenbank (siehe [Haupt-README](../README.md#2-supabase-datenbank-einrichten))

## Einrichtung

### Schritt 1: Abhängigkeiten installieren

Öffne das Terminal und navigiere zum Dashboard-Ordner:

```bash
cd dashboard
npm install
```

Das lädt alle benötigten Pakete herunter. Das dauert beim ersten Mal 1-2 Minuten.

### Schritt 2: Umgebungsvariablen konfigurieren

Das Dashboard braucht Zugangsdaten zu deiner Supabase-Datenbank. Diese werden in einer lokalen Datei gespeichert, die nicht ins Git-Repository hochgeladen wird.

1. Erstelle die Konfigurationsdatei:
   ```bash
   cp .env.example .env.local
   ```

2. Öffne `.env.local` mit einem Texteditor und trage deine Daten ein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_KEY=DEIN_SUPABASE_SERVICE_ROLE_KEY
   ```

**Wo finde ich diese Werte?**

1. Gehe zu [supabase.com](https://supabase.com) und öffne dein Projekt
2. Klicke links unten auf das **Zahnrad-Symbol** (Project Settings)
3. Gehe zu **API** (unter Configuration)
4. Dort findest du:

| Wert | Wo in Supabase |
|------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (ganz oben) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys** > `anon` `public` |
| `SUPABASE_SERVICE_KEY` | **Project API keys** > `service_role` `secret` (klicke auf "Reveal") |

**Wichtig:** Der `service_role`-Key hat vollen Zugriff auf die Datenbank. Teile ihn niemals öffentlich und lade ihn nicht ins Git-Repository hoch.

### Schritt 3: Dashboard starten

```bash
npm run dev
```

Öffne deinen Browser und gehe zu [http://localhost:3000](http://localhost:3000).

Du siehst die **Login-Seite**. Erstelle einen Account mit E-Mail und Passwort, oder melde dich mit Google an (falls konfiguriert).

## Funktionen

### Login
- **E-Mail + Passwort**: Erstelle einen Account direkt im Dashboard
- **Google-Login**: Optional, falls Google OAuth in Supabase konfiguriert ist (siehe unten)

### Dashboard-Seite (`/dashboard`)
- **Landmark-Liste**: Zeigt alle Sehenswürdigkeiten mit Name, Koordinaten, Status
- **Suche**: Landmarks nach Name filtern
- **Sortierung**: Nach Name, Änderungsdatum oder Status sortieren
- **Bearbeiten**: Klicke auf das Stift-Symbol um Details zu ändern
- **Löschen**: Klicke auf das Mülleimer-Symbol
- **Sync POIs**: Importiert Sehenswürdigkeiten aus der Zurich Tourism API

## Google-Login einrichten (optional)

Falls du Google-Login im Dashboard nutzen möchtest:

1. **Google Cloud Console**:
   - Gehe zu [console.cloud.google.com](https://console.cloud.google.com)
   - Erstelle ein neues Projekt (oder verwende ein bestehendes)
   - Gehe zu **APIs & Services > Credentials**
   - Klicke **Create Credentials > OAuth client ID**
   - Wähle "Web application"
   - Unter "Authorized redirect URIs" füge hinzu:
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

## Für Fortgeschrittene: Deployment auf Vercel

Falls du das Dashboard online stellen möchtest:

1. Erstelle einen Account auf [vercel.com](https://vercel.com)
2. Verbinde dein GitHub-Repository
3. Setze die folgenden **Environment Variables** in den Vercel-Projekteinstellungen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Vercel baut und deployed das Dashboard automatisch

## Verfügbare Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet den Entwicklungsserver auf [localhost:3000](http://localhost:3000) |
| `npm run build` | Erstellt eine optimierte Version für Produktion |
| `npm start` | Startet die Produktionsversion (nach `npm run build`) |
| `npm run lint` | Prüft den Code auf Fehler |

## Häufige Probleme

### "npm: command not found"
Node.js ist nicht installiert. Lade es von [nodejs.org](https://nodejs.org) herunter (LTS-Version) und installiere es.

### "Missing NEXT_PUBLIC_SUPABASE_URL"
Die `.env.local`-Datei fehlt oder ist nicht korrekt ausgefüllt. Stelle sicher, dass du Schritt 2 ausgeführt hast.

### Login funktioniert nicht
- Prüfe, ob die Supabase-URL und der Anon Key in `.env.local` korrekt sind
- Prüfe auf [supabase.com](https://supabase.com) unter Authentication > Users, ob dein Account existiert
- Falls E-Mail-Bestätigung aktiviert ist: Prüfe dein Postfach

### "Sync POIs" zeigt Fehler
- Der `SUPABASE_SERVICE_KEY` in `.env.local` muss der `service_role`-Key sein (nicht der `anon`-Key)
- Prüfe, ob die Datenbank-Tabellen korrekt erstellt wurden (siehe [Haupt-README](../README.md#2-supabase-datenbank-einrichten))

### Seite lädt, aber zeigt keine Daten
- Prüfe, ob Landmarks in der Datenbank vorhanden sind
- Führe einen "Sync POIs" aus oder erstelle manuell einen Landmark

## Nächste Schritte

- [Hauptseite README](../README.md) - Zurück zur Übersicht
- [iOS App einrichten](../ios/ARLandmarks/README.md) - iOS-App starten
- [ML Training](../ml_training/README.md) - Eigenes Erkennungsmodell trainieren
