# AR Landmarks App

Eine iOS-App, die Sehenswuerdigkeiten in Echtzeit ueber die Kamera erkennt und Informationen als AR-Overlay anzeigt. Dazu gehoert ein Web-Dashboard zur Verwaltung der Landmarks und eine ML-Pipeline zum Trainieren des Erkennungsmodells.

## Uebersicht

Das Projekt besteht aus drei Teilen:

| Teil | Beschreibung | Technologie |
|------|-------------|-------------|
| **iOS App** | AR-Kamera-App mit Landmark-Erkennung | Swift, SwiftUI, Core ML, ARKit |
| **Dashboard** | Web-Oberflaeche zur Verwaltung der Landmarks | Next.js, React, TypeScript |
| **ML Training** | Pipeline zum Trainieren des Erkennungsmodells | Python, PyTorch, Core ML Tools |

## Was du brauchst

Bevor du loslegst, stelle sicher, dass du folgende Accounts und Programme hast:

### Accounts (kostenlos)

1. **Supabase** - Datenbank und Authentifizierung
   - Erstelle einen Account auf [supabase.com](https://supabase.com)
   - Erstelle ein neues Projekt
   - Notiere dir die **Project URL** und den **Anon Key** (findest du unter Project Settings > API)
   - Notiere dir auch den **Service Role Key** (brauchst du fuer das Dashboard)

2. **OpenWeatherMap** - Wetterdaten in der App
   - Erstelle einen Account auf [openweathermap.org](https://openweathermap.org/api)
   - Gehe zu "API Keys" und kopiere deinen Key

3. **Google Cloud Console** (optional, fuer Google-Login im Dashboard)
   - Erstelle OAuth-Zugangsdaten auf [console.cloud.google.com](https://console.cloud.google.com)
   - Konfiguriere den Google-Provider in deinem Supabase-Projekt unter Authentication > Providers

### Programme

| Programm | Wofuer | Download |
|----------|--------|----------|
| **Xcode** (Version 16+) | iOS-App bauen und testen | Mac App Store |
| **Node.js** (Version 18+) | Dashboard starten | [nodejs.org](https://nodejs.org) |
| **Python** (Version 3.8+) | ML-Modell trainieren | [python.org](https://python.org) |
| **Git** | Code herunterladen | [git-scm.com](https://git-scm.com) |

## Schnellstart

### 1. Projekt herunterladen

Oeffne das **Terminal** (auf dem Mac: Programme > Dienstprogramme > Terminal) und fuehre folgendes aus:

```bash
git clone https://github.com/JSss10/ar-landmarks-app.git
cd ar-landmarks-app
```

### 2. Supabase-Datenbank einrichten

Die App braucht eine Datenbank. Erstelle folgende Tabellen in deinem Supabase-Projekt:

1. Gehe zu [supabase.com](https://supabase.com) und oeffne dein Projekt
2. Klicke links auf **SQL Editor**
3. Fuehre folgendes SQL aus:

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

-- Landmarks-Tabelle (Sehenswuerdigkeiten)
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
  city TEXT DEFAULT 'Zuerich',
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

-- Landmark-Kategorien (Verknuepfung)
CREATE TABLE IF NOT EXISTS landmark_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landmark_id UUID REFERENCES landmarks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(landmark_id, category_id)
);
```

4. Aktiviere **Row Level Security (RLS)** fuer die Tabellen und erstelle Policies fuer Lesezugriff:

```sql
-- RLS aktivieren
ALTER TABLE landmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE landmark_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE landmark_categories ENABLE ROW LEVEL SECURITY;

-- Lesezugriff fuer alle (fuer die iOS-App)
CREATE POLICY "Landmarks sind oeffentlich lesbar" ON landmarks FOR SELECT USING (true);
CREATE POLICY "Kategorien sind oeffentlich lesbar" ON categories FOR SELECT USING (true);
CREATE POLICY "Fotos sind oeffentlich lesbar" ON landmark_photos FOR SELECT USING (true);
CREATE POLICY "Landmark-Kategorien sind oeffentlich lesbar" ON landmark_categories FOR SELECT USING (true);

-- Schreibzugriff nur fuer authentifizierte User (Dashboard)
CREATE POLICY "Auth users koennen Landmarks bearbeiten" ON landmarks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users koennen Kategorien bearbeiten" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users koennen Fotos bearbeiten" ON landmark_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users koennen Verknuepfungen bearbeiten" ON landmark_categories FOR ALL USING (auth.role() = 'authenticated');
```

### 3. iOS-App einrichten

Die vollstaendige Anleitung findest du in der [iOS README](ios/ARLandmarks/README.md). Hier die Kurzfassung:

```bash
# 1. Oeffne das Xcode-Projekt
open ios/ARLandmarks/ARLandmarks.xcodeproj
```

2. Kopiere `Secrets.example.xcconfig` zu `Secrets.xcconfig` (im Xcode-Projekt unter ARLandmarks)
3. Trage deine Keys ein:
   ```
   SUPABASE_URL = https://DEIN-PROJEKT.supabase.co
   SUPABASE_ANON_KEY = DEIN_ANON_KEY
   OPENWEATHER_API_KEY = DEIN_OPENWEATHER_KEY
   ```
4. Waehle dein iPhone als Zielgeraet und klicke auf **Run** (Play-Button)

### 4. Dashboard einrichten

Die vollstaendige Anleitung findest du in der [Dashboard README](dashboard/README.md). Hier die Kurzfassung:

```bash
# 1. In den Dashboard-Ordner wechseln
cd dashboard

# 2. Abhaengigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env.local
```

4. Oeffne `.env.local` und trage deine Supabase-Daten ein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   SUPABASE_SERVICE_KEY=DEIN_SERVICE_ROLE_KEY
   ```

5. Dashboard starten:
   ```bash
   npm run dev
   ```

6. Oeffne [http://localhost:3000](http://localhost:3000) im Browser

### 5. Landmarks importieren (optional)

Um Sehenswuerdigkeiten aus der Zurich Tourism API zu importieren:

```bash
# 1. In den Scripts-Ordner wechseln
cd scripts

# 2. Abhaengigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren
cp .env.example .env
```

4. Oeffne `.env` und trage ein:
   ```
   SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   SUPABASE_SERVICE_KEY=DEIN_SERVICE_ROLE_KEY
   ```

5. Sync ausfuehren:
   ```bash
   npm run sync
   ```

Alternativ kannst du den Sync auch direkt im Dashboard ueber den **"Sync POIs"**-Button starten.

### 6. ML-Modell trainieren (optional)

Falls du das Erkennungsmodell selbst trainieren moechtest, findest du die vollstaendige Anleitung in der [ML Training README](ml_training/README.md). Es gibt auch eine [Schnellstart-Anleitung fuer 3 Landmarks](ml_training/START_WITH_3_LANDMARKS.md).

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
| [iOS App Setup](ios/ARLandmarks/README.md) | Schritt-fuer-Schritt iOS-App einrichten |
| [Dashboard Setup](dashboard/README.md) | Dashboard lokal starten und deployen |
| [ML Training](ml_training/README.md) | Eigenes Erkennungsmodell trainieren |
| [ML Schnellstart](ml_training/START_WITH_3_LANDMARKS.md) | In 30 Minuten mit 3 Landmarks starten |
| [Testing Guide](ml_training/TESTING_GUIDE.md) | Modell testen und verbessern |

## Haeufige Probleme

### "npm: command not found"
Node.js ist nicht installiert. Lade es von [nodejs.org](https://nodejs.org) herunter und installiere die LTS-Version.

### "python3: command not found"
Python ist nicht installiert. Lade es von [python.org](https://python.org) herunter. Auf dem Mac kannst du auch `brew install python3` verwenden, falls Homebrew installiert ist.

### "Xcode-Projekt laesst sich nicht oeffnen"
Stelle sicher, dass Xcode installiert ist (Mac App Store). Die App kann nur auf einem Mac entwickelt werden.

### "Dashboard zeigt Fehler beim Starten"
Pruefe, ob die `.env.local`-Datei korrekt ausgefuellt ist und ob der Supabase-Key stimmt.

### "iOS-App verbindet sich nicht mit Supabase"
Pruefe, ob `Secrets.xcconfig` korrekt ausgefuellt ist (nicht `Secrets.example.xcconfig`).
