# AR Landmarks App

Eine iOS-App, die Sehenswürdigkeiten in Echtzeit über die Kamera erkennt und Informationen als AR-Overlay anzeigt. Dazu gehört ein Web-Dashboard zur Verwaltung der Landmarks und eine ML-Pipeline zum Trainieren des Erkennungsmodells.

## Übersicht

Das Projekt besteht aus drei Teilen:

| Teil | Beschreibung | Technologie |
|------|-------------|-------------|
| **iOS App** | AR-Kamera-App mit Landmark-Erkennung | Swift, SwiftUI, Core ML, ARKit |
| **Dashboard** | Web-Oberfläche zur Verwaltung der Landmarks | Next.js, React, TypeScript |
| **ML Training** | Pipeline zum Trainieren des Erkennungsmodells | Python, PyTorch, Core ML Tools |

## Was du brauchst

Bevor du loslegst, stelle sicher, dass du folgende Accounts und Programme hast:

### Accounts (kostenlos)

1. **Supabase** - Datenbank und Authentifizierung
   - Erstelle einen Account auf [supabase.com](https://supabase.com)
   - Erstelle ein neues Projekt
   - Notiere dir die **Project URL** und den **Anon Key** (findest du unter Project Settings > API)
   - Notiere dir auch den **Service Role Key** (brauchst du für das Dashboard)

2. **OpenWeatherMap** - Wetterdaten in der App
   - Erstelle einen Account auf [openweathermap.org](https://openweathermap.org/api)
   - Gehe zu "API Keys" und kopiere deinen Key

3. **Google Cloud Console** (optional, für Google-Login im Dashboard)
   - Erstelle OAuth-Zugangsdaten auf [console.cloud.google.com](https://console.cloud.google.com)
   - Konfiguriere den Google-Provider in deinem Supabase-Projekt unter Authentication > Providers

### Programme

| Programm | Wofür | Download |
|----------|--------|----------|
| **Xcode** (Version 16+) | iOS-App bauen und testen | Mac App Store |
| **Node.js** (Version 18+) | Dashboard starten | [nodejs.org](https://nodejs.org) |
| **Python** (Version 3.8+) | ML-Modell trainieren | [python.org](https://python.org) |
| **Git** | Code herunterladen | [git-scm.com](https://git-scm.com) |

## Schnellstart

### 1. Projekt herunterladen

Öffne das **Terminal** (auf dem Mac: Programme > Dienstprogramme > Terminal) und führe folgendes aus:

```bash
git clone https://github.com/JSss10/ar-landmarks-app.git
cd ar-landmarks-app
```

### 2. Supabase-Datenbank einrichten

Die App braucht eine Datenbank. Erstelle folgende Tabellen in deinem Supabase-Projekt:

1. Gehe zu [supabase.com](https://supabase.com) und öffne dein Projekt
2. Klicke links auf **SQL Editor**
3. Führe folgendes SQL aus:

```sql
-- Kategorien-Tabelle
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Landmarks-Tabelle (Sehenswürdigkeiten)
CREATE TABLE IF NOT EXISTS landmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  disambiguating_description TEXT,
  description TEXT,
  description_en TEXT,
  title_teaser TEXT,
  text_teaser TEXT,
  detailed_information JSONB,
  zurich_card_description TEXT,
  zurich_card BOOLEAN,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 47.3769,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 8.5417,
  category_id UUID REFERENCES categories(id),
  api_categories TEXT[],
  image_url TEXT,
  image_caption TEXT,
  price TEXT,
  zurich_tourism_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  date_modified TEXT,
  opens TEXT,
  opening_hours TEXT,
  opening_hours_specification JSONB,
  special_opening_hours TEXT,
  address_country TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT DEFAULT 'Zürich',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  place TEXT,
  photo_0_url TEXT,
  photo_0_caption TEXT,
  photo_1_url TEXT,
  photo_1_caption TEXT,
  photo_2_url TEXT,
  photo_2_caption TEXT,
  api_source TEXT,
  api_raw_data JSONB,
  last_synced_at TIMESTAMPTZ
);

-- Landmark-Fotos
CREATE TABLE IF NOT EXISTS landmark_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landmark_id UUID REFERENCES landmarks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  caption_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Landmark-Kategorien (Verknüpfung)
CREATE TABLE IF NOT EXISTS landmark_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landmark_id UUID REFERENCES landmarks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(landmark_id, category_id)
);
```

4. Aktiviere **Row Level Security (RLS)** für die Tabellen und erstelle Policies für Lesezugriff:

```sql
-- RLS aktivieren
ALTER TABLE landmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE landmark_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE landmark_categories ENABLE ROW LEVEL SECURITY;

-- Lesezugriff für alle (für die iOS-App)
CREATE POLICY "Landmarks sind öffentlich lesbar" ON landmarks FOR SELECT USING (true);
CREATE POLICY "Kategorien sind öffentlich lesbar" ON categories FOR SELECT USING (true);
CREATE POLICY "Fotos sind öffentlich lesbar" ON landmark_photos FOR SELECT USING (true);
CREATE POLICY "Landmark-Kategorien sind öffentlich lesbar" ON landmark_categories FOR SELECT USING (true);

-- Schreibzugriff nur für authentifizierte User (Dashboard)
CREATE POLICY "Auth users können Landmarks bearbeiten" ON landmarks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users können Kategorien bearbeiten" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users können Fotos bearbeiten" ON landmark_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users können Verknüpfungen bearbeiten" ON landmark_categories FOR ALL USING (auth.role() = 'authenticated');
```

### 3. iOS-App einrichten

Die vollständige Anleitung findest du in der [iOS README](ios/ARLandmarks/README.md). Hier die Kurzfassung:

```bash
# 1. Öffne das Xcode-Projekt
open ios/ARLandmarks/ARLandmarks.xcodeproj
```

2. Kopiere `Secrets.example.xcconfig` zu `Secrets.xcconfig` (im Xcode-Projekt unter ARLandmarks)
3. Trage deine Keys ein:
   ```
   SUPABASE_URL = https://DEIN-PROJEKT.supabase.co
   SUPABASE_ANON_KEY = DEIN_ANON_KEY
   OPENWEATHER_API_KEY = DEIN_OPENWEATHER_KEY
   ```
4. Wähle dein iPhone als Zielgerät und klicke auf **Run** (Play-Button)

### 4. Dashboard einrichten

> **Live-Demo:** Das Dashboard ist deployed unter [ar-landmarks-app.vercel.app](https://ar-landmarks-app.vercel.app/)

Die vollständige Anleitung findest du in der [Dashboard README](dashboard/README.md). Hier die Kurzfassung:

```bash
# 1. In den Dashboard-Ordner wechseln
cd dashboard

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
```

4. Öffne `.env.local` und trage deine Supabase-Daten ein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   SUPABASE_SERVICE_KEY=DEIN_SERVICE_ROLE_KEY
   ```

5. Dashboard starten:
   ```bash
   npm run dev
   ```

6. Öffne [http://localhost:3000](http://localhost:3000) im Browser

### 5. Landmarks importieren (optional)

Um Sehenswürdigkeiten aus der Zurich Tourism API zu importieren:

```bash
# 1. In den Scripts-Ordner wechseln
cd scripts

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env
```

4. Öffne `.env` und trage ein:
   ```
   SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   SUPABASE_SERVICE_KEY=DEIN_SERVICE_ROLE_KEY
   ```

5. Sync ausführen:
   ```bash
   npm run sync
   ```

Alternativ kannst du den Sync auch direkt im Dashboard über den **"Sync POIs"**-Button starten.

### 6. ML-Modell trainieren (optional)

Falls du das Erkennungsmodell selbst trainieren möchtest, findest du die vollständige Anleitung in der [ML Training README](ml_training/README.md). Es gibt auch eine [Schnellstart-Anleitung für 3 Landmarks](ml_training/START_WITH_3_LANDMARKS.md).

Ein vortrainiertes Modell ist bereits im Projekt enthalten.

## Projektstruktur

```
ar-landmarks-app/
├── ios/                          # iOS-App (Swift/SwiftUI)
│   └── ARLandmarks/
│       └── ARLandmarks/
│           ├── Models/           # Core ML Modell + Datenmodelle
│           ├── Services/         # API-Services (Supabase, Wetter, Vision)
│           ├── ViewModels/       # App-Logik
│           ├── Views/            # UI-Screens
│           └── Utilities/        # Hilfsfunktionen
├── dashboard/                    # Web-Dashboard (Next.js)
│   └── src/app/
│       ├── api/                  # Backend API-Routes
│       ├── components/           # React-Komponenten
│       └── dashboard/            # Dashboard-Seite
├── ml_training/                  # ML-Pipeline (Python/PyTorch)
│   ├── scripts/                  # Training-Scripts
│   ├── data/                     # Trainingsdaten
│   └── models/                   # Trainierte Modelle
└── scripts/                      # Daten-Sync Scripts
```

## Detaillierte Anleitungen

| Anleitung | Beschreibung |
|-----------|-------------|
| [iOS App Setup](ios/ARLandmarks/README.md) | Schritt-für-Schritt iOS-App einrichten |
| [Dashboard Setup](dashboard/README.md) | Dashboard lokal starten und deployen |
| [ML Training](ml_training/README.md) | Eigenes Erkennungsmodell trainieren |
| [ML Schnellstart](ml_training/START_WITH_3_LANDMARKS.md) | In 30 Minuten mit 3 Landmarks starten |
| [Testing Guide](ml_training/TESTING_GUIDE.md) | Modell testen und verbessern |

## Häufige Probleme

### "npm: command not found"
Node.js ist nicht installiert. Lade es von [nodejs.org](https://nodejs.org) herunter und installiere die LTS-Version.

### "python3: command not found"
Python ist nicht installiert. Lade es von [python.org](https://python.org) herunter. Auf dem Mac kannst du auch `brew install python3` verwenden, falls Homebrew installiert ist.

### "Xcode-Projekt lässt sich nicht öffnen"
Stelle sicher, dass Xcode installiert ist (Mac App Store). Die App kann nur auf einem Mac entwickelt werden.

### "Dashboard zeigt Fehler beim Starten"
Prüfe, ob die `.env.local`-Datei korrekt ausgefüllt ist und ob der Supabase-Key stimmt.

### "iOS-App verbindet sich nicht mit Supabase"
Prüfe, ob `Secrets.xcconfig` korrekt ausgefüllt ist (nicht `Secrets.example.xcconfig`).
