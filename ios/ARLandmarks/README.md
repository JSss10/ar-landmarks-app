# AR Landmarks - iOS App

Schritt-fuer-Schritt-Anleitung zum Einrichten und Starten der iOS-App.

## Voraussetzungen

- **Mac** mit macOS 14 (Sonoma) oder neuer
- **Xcode 16** oder neuer (kostenlos im [Mac App Store](https://apps.apple.com/app/xcode/id497799835))
- **iPhone** mit iOS 15 oder neuer (fuer die Kamera-/AR-Funktionen wird ein echtes Geraet benoetigt, der Simulator reicht nicht)
- **Apple Developer Account** (kostenloser Account reicht zum Testen auf dem eigenen Geraet)

## Einrichtung

### Schritt 1: Xcode-Projekt oeffnen

Oeffne das Terminal und fuehre aus:

```bash
open ios/ARLandmarks/ARLandmarks.xcodeproj
```

Oder navigiere im Finder zu `ios/ARLandmarks/` und doppelklicke auf `ARLandmarks.xcodeproj`.

Beim ersten Oeffnen laedt Xcode automatisch die benoetigten Swift Packages herunter. Das kann ein paar Minuten dauern. Du siehst den Fortschritt unten in Xcode.

### Schritt 2: API-Keys konfigurieren

Die App braucht Zugangsdaten fuer Supabase und OpenWeatherMap. Diese werden in einer lokalen Konfigurationsdatei gespeichert, die nicht ins Git-Repository hochgeladen wird.

1. Im Xcode-Projektnavigator (links), finde die Datei `Secrets.example.xcconfig`
2. Rechtsklick > **Show in Finder**
3. Kopiere die Datei im Finder und benenne die Kopie in `Secrets.xcconfig` um
4. Oeffne `Secrets.xcconfig` mit einem Texteditor und trage deine Daten ein:

```
SUPABASE_URL = https://DEIN-PROJEKT-ID.supabase.co
SUPABASE_ANON_KEY = DEIN_SUPABASE_ANON_KEY
OPENWEATHER_API_KEY = DEIN_OPENWEATHER_API_KEY
```

**Wo finde ich diese Werte?**

| Key | Wo zu finden |
|-----|-------------|
| `SUPABASE_URL` | [supabase.com](https://supabase.com) > Dein Projekt > Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) > Dein Projekt > Project Settings > API > Project API keys > `anon` `public` |
| `OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org) > Sign In > API Keys |

### Schritt 3: iPhone verbinden und App starten

1. **iPhone per USB-Kabel mit dem Mac verbinden**
2. In Xcode oben in der Mitte: Klicke auf das Geraet-Dropdown und waehle dein iPhone aus
3. Falls du zum ersten Mal auf dem Geraet entwickelst:
   - Xcode fragt nach deinem **Apple Account** (Xcode > Settings > Accounts > "+" > Apple ID)
   - Auf dem iPhone: Gehe zu **Einstellungen > Allgemein > VPN & Geraeteverwaltung** und vertraue dem Entwicklerzertifikat
4. Klicke auf den **Play-Button** (oben links) oder druecke `Cmd + R`
5. Xcode kompiliert die App und installiert sie auf dem iPhone

### Schritt 4: Berechtigungen auf dem iPhone erlauben

Beim ersten Start fragt die App nach folgenden Berechtigungen:

| Berechtigung | Wofuer | Empfehlung |
|-------------|--------|------------|
| **Kamera** | AR-Ansicht und Landmark-Erkennung | "Erlauben" |
| **Standort** | Sehenswuerdigkeiten in der Naehe finden | "Beim Verwenden der App erlauben" |

## Projektstruktur

```
ARLandmarks/
├── ARLandmarksApp.swift          # App-Einstiegspunkt
├── Info.plist                     # App-Konfiguration und Berechtigungen
├── Secrets.example.xcconfig       # Vorlage fuer API-Keys
├── Models/
│   └── LandmarkClassifier.mlpackage  # ML-Modell fuer Erkennung
├── Services/
│   ├── SupabaseService.swift      # Kommunikation mit der Datenbank
│   ├── VisionService.swift        # ML-Modell und Bilderkennung
│   ├── WeatherService.swift       # Wetterdaten
│   ├── LocationService.swift      # GPS-Standort
│   └── ARPositionCalculator.swift # AR-Positionierung
├── ViewModels/                    # App-Logik und Zustand
├── Views/                         # Bildschirme der App
├── Utilities/                     # Hilfsfunktionen
└── Resources/                     # Bilder, Farben, Assets
```

## Haeufige Probleme

### "Signing for ARLandmarks requires a development team"
Du musst einen Apple-Account in Xcode hinzufuegen:
1. Xcode > **Settings** > **Accounts**
2. Klicke auf "+" unten links
3. Waehle "Apple ID" und melde dich an
4. Gehe zurueck zum Projekt > Signing & Capabilities > Team > Waehle deinen Account

### "Could not launch ARLandmarks - device is not available"
- Stelle sicher, dass das iPhone entsperrt und per USB verbunden ist
- Gehe auf dem iPhone zu Einstellungen > Allgemein > VPN & Geraeteverwaltung und vertraue dem Zertifikat

### "Secrets.xcconfig not found"
Du hast vergessen, die Datei zu erstellen. Kopiere `Secrets.example.xcconfig` und benenne die Kopie in `Secrets.xcconfig` um.

### App startet, aber zeigt keine Landmarks
- Pruefe die Internetverbindung des iPhones
- Pruefe, ob die Supabase-URL und der Key in `Secrets.xcconfig` korrekt sind
- Stelle sicher, dass Landmarks in der Supabase-Datenbank vorhanden sind (importiere sie ueber das Dashboard oder das Sync-Script)

### Kamera zeigt schwarzen Bildschirm
Die App laeuft im Simulator. Die Kamera- und AR-Funktionen benoetigen ein echtes iPhone. Verbinde ein iPhone per USB und waehle es in Xcode als Zielgeraet aus.

### Build-Fehler: "Missing package product"
Xcode hat die Swift Packages nicht geladen. Gehe zu **File > Packages > Resolve Package Versions** und warte, bis der Download abgeschlossen ist.

## Naechste Schritte

- [Hauptseite README](../../README.md) - Zurueck zur Uebersicht
- [Dashboard einrichten](../../dashboard/README.md) - Web-Dashboard starten
- [ML-Modell trainieren](../../ml_training/README.md) - Eigenes Erkennungsmodell trainieren
