# AR Landmarks App - Diagramme

Diese Datei enthält Mermaid-Diagramme zur Dokumentation der Architektur, Abläufe und Meilensteine des Projekts.

---

## 1. Systemarchitektur (Strukturdiagramm)

Zeigt die drei Hauptkomponenten des Projekts und deren Verbindungen.

```mermaid
graph TB
    subgraph iOS["iOS App (Swift/SwiftUI)"]
        Views["Views<br/>(SwiftUI Screens)"]
        VMs["ViewModels<br/>(State Management)"]
        Services["Services"]
        ML["Core ML Modell<br/>(MobileNetV3)"]

        Views --> VMs
        VMs --> Services
        Services --> ML
    end

    subgraph Dashboard["Web Dashboard (Next.js)"]
        UI["React UI<br/>(Tailwind CSS)"]
        API["API Routes<br/>(Server-Side)"]
        AuthUI["Auth Komponenten"]

        UI --> API
        UI --> AuthUI
    end

    subgraph MLPipeline["ML Training Pipeline (Python)"]
        Fetch["Landmarks abrufen"]
        Train["Modell trainieren<br/>(PyTorch)"]
        Convert["Core ML Export<br/>(coremltools)"]
        Deploy["Deploy nach Xcode"]

        Fetch --> Train
        Train --> Convert
        Convert --> Deploy
    end

    subgraph Backend["Backend Services"]
        Supabase["Supabase<br/>(PostgreSQL + Auth)"]
        Weather["OpenWeatherMap<br/>API"]
        ZurichAPI["Zurich Tourism<br/>API"]
    end

    Services -->|"REST API<br/>(Landmarks, Fotos)"| Supabase
    Services -->|"Wetterdaten"| Weather
    API -->|"CRUD + Sync"| Supabase
    AuthUI -->|"Login/OAuth"| Supabase
    API -->|"POI Import"| ZurichAPI
    Fetch -->|"Landmark-Daten"| Supabase
    Deploy -.->|".mlpackage"| ML

    style iOS fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style Dashboard fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style MLPipeline fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style Backend fill:#0F2D44,stroke:#38BDF8,color:#fff
```

---

## 2. AR-Erkennungs-Ablauf (Sequenzdiagramm)

Beschreibt den Ablauf der Landmark-Erkennung in der iOS-App von der Kameraaufnahme bis zur AR-Anzeige.

```mermaid
sequenceDiagram
    participant User as Benutzer
    participant AR as ARLandmarkView
    participant Vision as VisionService
    participant CoreML as Core ML Modell
    participant Supa as SupabaseService
    participant Weather as WeatherService
    participant Calc as ARPositionCalculator

    User->>AR: Kamera auf Landmark richten
    AR->>Vision: Kamerabild (CMSampleBuffer)
    Vision->>CoreML: Bild klassifizieren (224x224)

    alt Confidence >= 90%
        CoreML-->>Vision: Ergebnis (Name, Confidence)
        Vision-->>AR: RecognitionResult
        AR->>AR: Scannen stoppen
        AR->>Supa: Landmark-Details abrufen (ID)
        Supa-->>AR: Landmark-Daten (Name, Beschreibung, Koordinaten)
        AR->>Weather: Wetter abrufen (Koordinaten)
        Weather-->>AR: WeatherData (Temperatur, Icon)
        AR->>Calc: AR-Position berechnen (GPS + Kompass)
        Calc-->>AR: 3D-Position
        AR->>User: AR-Overlay anzeigen (Info-Card)
    else Confidence < 90%
        CoreML-->>Vision: Confidence zu niedrig
        Vision-->>AR: Kein Ergebnis
        AR->>AR: Weiter scannen
    end

    User->>AR: Info-Button antippen
    AR->>User: LandmarkDetailSheet anzeigen
```

---

## 3. User Journey (Benutzer-Ablauf)

Zeigt den vollständigen Benutzerfluss durch die iOS-App.

```mermaid
flowchart TD
    Start([App starten]) --> Launch[Splash Screen<br/>mit Animation]
    Launch --> Check{Erster<br/>Start?}

    Check -->|Ja| Onboarding[Onboarding<br/>3 Screens]
    Onboarding --> Overview
    Check -->|Nein| Overview[Hauptmenu<br/>OverviewView]

    Overview --> ARMode["AR Modus<br/>(Kamera)"]
    Overview --> ListMode["Landmarks<br/>durchsuchen"]

    ARMode --> Scan{Landmark<br/>erkannt?}
    Scan -->|Ja| AROverlay["AR-Overlay<br/>(Name, Distanz, Wetter)"]
    Scan -->|Nein| ARMode
    AROverlay --> Detail1["Detail-Ansicht<br/>(Sheet)"]

    ListMode --> Filter["Filter nach<br/>Kategorie"]
    Filter --> Select["Landmark<br/>auswählen"]
    Select --> Detail2["Detail-Ansicht<br/>(Sheet)"]

    Detail1 --> Info["Infos anzeigen:<br/>Beschreibung, Fotos,<br/>Öffnungszeiten, Wetter"]
    Detail2 --> Info

    Info --> Back["Zurück"]
    Back --> Overview

    style Start fill:#38BDF8,stroke:#0EA5E9,color:#000
    style AROverlay fill:#10B981,stroke:#059669,color:#000
    style Info fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style Onboarding fill:#F59E0B,stroke:#D97706,color:#000
```

---

## 4. Dashboard-Ablauf (Web)

Zeigt den Ablauf im Web-Dashboard zur Verwaltung der Landmarks.

```mermaid
flowchart TD
    Start([Dashboard öffnen]) --> Auth{Eingeloggt?}

    Auth -->|Nein| Login[Login-Seite]
    Login --> Method{Login-Methode}
    Method -->|Email| Email[Email + Passwort]
    Method -->|Google| Google[Google OAuth]
    Method -->|Registrieren| Register[Account erstellen]
    Email --> Verify{Verifiziert?}
    Google --> Dashboard
    Register --> MailConfirm[Email bestätigen]
    MailConfirm --> Verify
    Verify -->|Ja| Dashboard
    Verify -->|Nein| Login

    Auth -->|Ja| Dashboard[Dashboard<br/>Landmark-Übersicht]

    Dashboard --> Search[Suchen & Sortieren]
    Dashboard --> Edit[Landmark bearbeiten]
    Dashboard --> Delete[Landmark löschen]
    Dashboard --> Sync[POIs synchronisieren]

    Edit --> Modal[Edit Modal<br/>Alle Felder bearbeiten]
    Modal --> Save[Speichern]
    Save --> Dashboard

    Sync --> ZurichAPI["Zurich Tourism API<br/>abrufen"]
    ZurichAPI --> Conflict{Konflikte?}
    Conflict -->|Ja| Confirm[Bestätigung<br/>manuell bearbeiteter<br/>Landmarks]
    Conflict -->|Nein| Import[Daten importieren]
    Confirm --> Import
    Import --> Dashboard

    style Start fill:#38BDF8,stroke:#0EA5E9,color:#000
    style Dashboard fill:#10B981,stroke:#059669,color:#000
    style ZurichAPI fill:#F59E0B,stroke:#D97706,color:#000
```

---

## 5. ML-Training-Pipeline (Ablaufdiagramm)

Beschreibt den vollständigen Prozess zum Trainieren und Deployen des Erkennungsmodells.

```mermaid
flowchart LR
    subgraph Vorbereitung["1. Vorbereitung"]
        A1["Landmarks aus<br/>Supabase abrufen<br/>(fetch_landmarks.py)"]
        A2["Trainingsbilder sammeln<br/>(20-50 pro Landmark)"]
        A3["Bilder in Ordner<br/>sortieren<br/>(data/train/)"]
    end

    subgraph Training["2. Training"]
        B1["MobileNetV3-Small<br/>laden"]
        B2["Transfer Learning<br/>(Feature Extraction)"]
        B3["Trainieren<br/>(train_model.py)"]
        B4["Validierung &<br/>Metriken"]
    end

    subgraph Export["3. Export & Deploy"]
        C1["PyTorch zu Core ML<br/>konvertieren<br/>(convert_to_coreml.py)"]
        C2[".mlpackage nach<br/>Xcode kopieren"]
        C3["VisionService.swift<br/>Class-Mapping<br/>aktualisieren"]
    end

    A1 --> A2 --> A3 --> B1
    B1 --> B2 --> B3 --> B4
    B4 --> C1 --> C2 --> C3

    style Vorbereitung fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style Training fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style Export fill:#1E3A5F,stroke:#60A5FA,color:#fff
```

---

## 6. Datenmodell (Entity-Relationship-Diagramm)

Zeigt die Datenbankstruktur in Supabase (PostgreSQL).

```mermaid
erDiagram
    LANDMARKS {
        uuid id PK
        text name
        text name_en
        text description
        text description_en
        float latitude
        float longitude
        uuid category_id FK
        text image_url
        text image_caption
        boolean is_active
        text zurich_tourism_id UK
        text opening_hours
        jsonb opening_hours_specification
        text street_address
        text postal_code
        text city
        text phone
        text email
        text website_url
        text price
        boolean zurich_card
        jsonb api_raw_data
        timestamptz created_at
        timestamptz updated_at
    }

    CATEGORIES {
        uuid id PK
        text name
        text name_en
        text icon
        text color
        int sort_order
        timestamptz created_at
    }

    LANDMARK_PHOTOS {
        uuid id PK
        uuid landmark_id FK
        text photo_url
        text caption_en
        int sort_order
        boolean is_primary
        timestamptz created_at
    }

    LANDMARK_CATEGORIES {
        uuid id PK
        uuid landmark_id FK
        uuid category_id FK
        timestamptz created_at
    }

    LANDMARKS ||--o{ LANDMARK_PHOTOS : "hat Fotos"
    LANDMARKS ||--o{ LANDMARK_CATEGORIES : "hat Kategorien"
    CATEGORIES ||--o{ LANDMARK_CATEGORIES : "wird zugeordnet"
    CATEGORIES ||--o{ LANDMARKS : "Hauptkategorie"
```

---

## 7. Datenfluss zwischen Komponenten

Zeigt wie Daten zwischen allen Systemkomponenten fliessen.

```mermaid
flowchart TB
    subgraph External["Externe Datenquellen"]
        ZurichAPI["Zurich Tourism API"]
        WeatherAPI["OpenWeatherMap API"]
    end

    subgraph Supabase["Supabase Backend"]
        DB[(PostgreSQL<br/>Datenbank)]
        Auth["Auth Service<br/>(Email + Google)"]
        RLS["Row Level Security"]
    end

    subgraph DashboardApp["Dashboard (Next.js)"]
        SyncRoute["API: /sync-pois"]
        CRUD["Landmark CRUD"]
        AuthFlow["Login / OAuth"]
    end

    subgraph iOSApp["iOS App"]
        SupaService["SupabaseService"]
        VisionSvc["VisionService"]
        WeatherSvc["WeatherService"]
        LocationSvc["LocationService"]
        CoreMLModel["Core ML Modell"]
        ARView["AR View"]
    end

    subgraph MLPipe["ML Pipeline"]
        TrainScript["train_model.py"]
        ExportScript["convert_to_coreml.py"]
    end

    ZurichAPI -->|"JSON POI-Daten"| SyncRoute
    SyncRoute -->|"Upsert Landmarks"| DB
    CRUD -->|"Create/Update/Delete"| DB
    AuthFlow -->|"Login-Tokens"| Auth
    Auth -->|"JWT"| RLS

    DB -->|"Landmarks + Fotos"| SupaService
    SupaService --> ARView
    WeatherAPI -->|"Wetterdaten"| WeatherSvc
    WeatherSvc --> ARView
    LocationSvc -->|"GPS-Koordinaten"| ARView
    VisionSvc -->|"Klassifikation"| ARView
    CoreMLModel --> VisionSvc

    DB -->|"Landmark-Liste"| TrainScript
    ExportScript -->|".mlpackage"| CoreMLModel

    style External fill:#D97706,stroke:#F59E0B,color:#000
    style Supabase fill:#059669,stroke:#10B981,color:#fff
    style DashboardApp fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style iOSApp fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style MLPipe fill:#7C3AED,stroke:#8B5CF6,color:#fff
```

---

## 8. iOS App - Architektur (MVVM)

Detaillierte Darstellung der iOS-App-Schichten nach dem MVVM-Muster.

```mermaid
graph TB
    subgraph Views["Views (SwiftUI)"]
        ContentView["ContentView"]
        OverviewView["OverviewView"]
        ARLandmarkView["ARLandmarkView"]
        LandmarkListView["LandmarkListView"]
        LandmarkDetailSheet["LandmarkDetailSheet"]
        OnboardingView["OnboardingView"]
        LaunchScreenView["LaunchScreenView"]

        ContentView --> LaunchScreenView
        ContentView --> OnboardingView
        ContentView --> OverviewView
        OverviewView --> ARLandmarkView
        OverviewView --> LandmarkListView
        LandmarkListView --> LandmarkDetailSheet
        ARLandmarkView --> LandmarkDetailSheet
    end

    subgraph ViewModels["ViewModels"]
        LandmarkVM["LandmarkViewModel<br/>- landmarks: [Landmark]<br/>- selectedCategory<br/>- fetchLandmarks()"]
        ARManager["ARModeManager<br/>- isARMode: Bool<br/>- recognitionResult"]
    end

    subgraph ServicesLayer["Services"]
        SupaSvc["SupabaseService<br/>- fetchLandmarks()<br/>- fetchPhotos()"]
        VisionSvc2["VisionService<br/>- classifyImage()<br/>- loadModel()"]
        WeatherSvc2["WeatherService<br/>- fetchWeather()"]
        LocationSvc2["LocationService<br/>- currentLocation<br/>- heading"]
        ARCalc["ARPositionCalculator<br/>- calculatePosition()"]
    end

    subgraph Frameworks["Apple Frameworks"]
        ARKit["ARKit"]
        CoreML2["Core ML / Vision"]
        CoreLocation["CoreLocation"]
    end

    Views --> ViewModels
    ViewModels --> ServicesLayer
    SupaSvc --> Supabase2["Supabase REST API"]
    VisionSvc2 --> CoreML2
    WeatherSvc2 --> OWM["OpenWeatherMap"]
    LocationSvc2 --> CoreLocation
    ARLandmarkView --> ARKit
    ARCalc --> CoreLocation

    style Views fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style ViewModels fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style ServicesLayer fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style Frameworks fill:#374151,stroke:#6B7280,color:#fff
```

---

## 9. Projekt-Meilensteine (Gantt-Diagramm)

Zeigt die zeitliche Entwicklung des Projekts basierend auf der Git-Historie.

```mermaid
gantt
    title AR Landmarks App - Entwicklungszeitplan
    dateFormat YYYY-MM-DD
    axisFormat %d.%m

    section iOS App Grundlagen
    Onboarding & Overview Screen        :done, ios1, 2026-01-18, 1d
    Zurich API Integration               :done, ios2, 2026-01-19, 1d
    Landmark-Details & Fotos             :done, ios3, 2026-01-19, 2d
    UI Redesign (Detail Sheet)           :done, ios4, 2026-01-20, 1d

    section ML & Erkennung
    Core ML Training Pipeline            :done, ml1, 2026-01-21, 1d
    Modell trainieren (3 Landmarks)      :done, ml2, 2026-01-21, 1d
    VisionService Integration            :done, ml3, 2026-01-21, 1d
    Modell-Verbesserung & Threshold      :done, ml4, 2026-02-11, 1d

    section Dashboard
    CRUD & Datenfeld-Mapping             :done, dash1, 2026-01-25, 1d
    Toast Notifications & Spinner        :done, dash2, 2026-01-25, 1d
    Modal Redesign & Responsiveness      :done, dash3, 2026-01-25, 3d
    Auth (Google OAuth + Email)          :done, dash4, 2026-01-28, 1d
    Suche & Sortierung                   :done, dash5, 2026-01-30, 1d
    Sync-Konflikte & Öffnungszeiten      :done, dash6, 2026-02-13, 1d

    section iOS AR Features
    AR Marker & POI-Anzeige              :done, ar1, 2026-01-31, 1d
    Info-Cards & Detail-Buttons          :done, ar2, 2026-01-31, 1d
    Code-Übersetzung (DE zu EN)          :done, ar3, 2026-02-01, 1d
    Core ML Bugfixes                     :done, ar4, 2026-02-01, 1d
    Scan-Stopp nach Erkennung            :done, ar5, 2026-02-02, 1d

    section Polish & Deployment
    App Icon & Launch Screen             :done, pol1, 2026-02-11, 1d
    App Umbenennung "AR Landmarks"       :done, pol2, 2026-02-12, 1d
    README & Dokumentation               :done, pol3, 2026-02-12, 1d
    Splash Animationen & Gradients       :done, pol4, 2026-02-13, 1d
    Email-Verifizierung & Favicon        :done, pol5, 2026-02-13, 1d
    Cleanup & finale Korrekturen         :done, pol6, 2026-02-13, 2d
```

---

## 10. Deployment-Architektur

Zeigt die Deployment-Infrastruktur des Projekts.

```mermaid
graph LR
    subgraph Entwicklung["Entwicklungsumgebung"]
        Xcode["Xcode<br/>(macOS)"]
        VSCode["VS Code / Terminal<br/>(Dashboard)"]
        Python["Python<br/>(ML Training)"]
    end

    subgraph VCS["Versionskontrolle"]
        GitHub["GitHub Repository<br/>JSss10/ar-landmarks-app"]
    end

    subgraph Hosting["Hosting & Deployment"]
        Vercel["Vercel<br/>(Dashboard)"]
        AppStore["App Store<br/>(iOS App)"]
    end

    subgraph CloudServices["Cloud Services"]
        Supabase3["Supabase<br/>PostgreSQL + Auth"]
        OWM2["OpenWeatherMap"]
        ZurichAPI2["Zurich Tourism API"]
    end

    subgraph Endgeraete["Endgeräte"]
        iPhone["iPhone<br/>(iOS 15+)"]
        Browser["Web Browser"]
    end

    Xcode -->|"git push"| GitHub
    VSCode -->|"git push"| GitHub
    Python -->|"git push"| GitHub

    GitHub -->|"Auto-Deploy"| Vercel
    Xcode -->|"Archive & Upload"| AppStore

    Vercel --> Browser
    AppStore --> iPhone

    iPhone --> Supabase3
    iPhone --> OWM2
    Browser --> Supabase3
    Vercel --> ZurichAPI2

    style Entwicklung fill:#1E3A5F,stroke:#60A5FA,color:#fff
    style VCS fill:#374151,stroke:#6B7280,color:#fff
    style Hosting fill:#059669,stroke:#10B981,color:#fff
    style CloudServices fill:#D97706,stroke:#F59E0B,color:#000
    style Endgeraete fill:#7C3AED,stroke:#8B5CF6,color:#fff
```

---

## Hinweise

- Alle Diagramme sind im [Mermaid](https://mermaid.js.org/)-Format erstellt.
- Sie können direkt auf GitHub gerendert werden (GitHub unterstützt Mermaid nativ).
- Zur lokalen Vorschau kann der [Mermaid Live Editor](https://mermaid.live/) verwendet werden.
- Alternativ können VS Code Extensions wie "Markdown Preview Mermaid Support" genutzt werden.
