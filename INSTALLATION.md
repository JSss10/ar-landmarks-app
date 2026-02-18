# AR Landmarks – Installationsanleitung

Diese Anleitung erklärt Schritt für Schritt, wie Sie das Projekt lokal auf Ihrem Computer
starten können. Es sind **keine Programmierkenntnisse** notwendig – folgen Sie einfach den
Schritten in der Reihenfolge, wie sie aufgeführt sind.

---

## Was ist dieses Projekt?

AR Landmarks ist eine iOS-App, die Sehenswürdigkeiten in Zürich mithilfe von Augmented
Reality (AR) anzeigt. Wenn man die Kamera auf ein bekanntes Gebäude richtet, erscheint eine
Info-Karte direkt im Kamerabild. Ein begleitendes Web-Dashboard erlaubt es, die Orte zu
verwalten.

Das Projekt besteht aus zwei Teilen, die separat gestartet werden können:

| Teil | Was ist es? | Benötigt |
|---|---|---|
| **Web-Dashboard** | Website zur Verwaltung der Sehenswürdigkeiten | Beliebiger Computer |
| **iOS App** | Die eigentliche AR-App fürs iPhone | Mac-Computer + iPhone |

---

## Separat mitgelieferte Dateien (nicht im GitHub-Repo)

API-Schlüssel dürfen aus Sicherheitsgründen nicht öffentlich auf GitHub liegen. Diese Dateien
werden deshalb **separat** (z. B. per E-Mail oder USB-Stick) mitgeliefert:

| Datei | Wohin kopieren | Für was |
|---|---|---|
| `Secrets.xcconfig` | `ios/ARLandmarks/ARLandmarks/` | iOS App (API-Schlüssel) |
| `.env.local` | `dashboard/` | Web-Dashboard (Datenbank-Zugang) |

> **Wichtig:** Ohne diese zwei Dateien startet das Projekt nicht. Bitte stellen Sie sicher,
> dass Sie beide Dateien erhalten haben, bevor Sie weitermachen.

---

## Teil 1: Web-Dashboard starten

Das Dashboard ist die einfachste Möglichkeit, das Projekt zu sehen. Es läuft im
Webbrowser und braucht keinen Mac.

### Voraussetzungen

- Einen Computer (Windows, Mac oder Linux)
- **Node.js** (kostenlos, Version 18 oder neuer)
  → Download: [nodejs.org](https://nodejs.org) – bitte die Version „LTS" wählen
- Die mitgelieferte Datei **`.env.local`**

### Schritt-für-Schritt

**1. Node.js installieren**

Öffnen Sie [nodejs.org](https://nodejs.org), laden Sie die LTS-Version herunter und
installieren Sie sie wie ein normales Programm (Doppelklick auf den Installer, dann „Weiter"
klicken).

**2. Projekt-Ordner herunterladen**

Falls noch nicht geschehen: Klicken Sie auf GitHub oben rechts auf den grünen Knopf
„Code" → „Download ZIP", entpacken Sie die ZIP-Datei an einem beliebigen Ort.

**3. Die mitgelieferte `.env.local`-Datei einfügen**

Kopieren Sie die mitgelieferte Datei `.env.local` in den Ordner `dashboard/` des Projekts.

```
ar-landmarks-app/
└── dashboard/
    └── .env.local   ← diese Datei hier einfügen
```

**4. Terminal öffnen**

- **Windows:** Drücken Sie `Windows + R`, tippen Sie `cmd`, drücken Sie Enter.
- **Mac:** Öffnen Sie „Spotlight" (Cmd + Leertaste), tippen Sie „Terminal", drücken Sie Enter.

**5. In den Dashboard-Ordner wechseln**

Tippen Sie im Terminal folgenden Befehl und drücken Sie Enter. Passen Sie den Pfad
an den Ort an, wo Sie das Projekt entpackt haben:

```
cd /Pfad/zum/Projekt/dashboard
```

*Beispiel auf Windows:*
```
cd C:\Users\IhrName\Downloads\ar-landmarks-app\dashboard
```

*Beispiel auf Mac:*
```
cd ~/Downloads/ar-landmarks-app/dashboard
```

**6. Abhängigkeiten installieren**

```
npm install
```

*(Dieser Befehl lädt automatisch alle benötigten Bibliotheken herunter. Einmalig, dauert
ca. 1–2 Minuten.)*

**7. Dashboard starten**

```
npm run dev
```

**8. Im Browser öffnen**

Öffnen Sie einen Webbrowser (Chrome, Firefox, Safari) und gehen Sie zu:

```
http://localhost:3000
```

Sie sehen jetzt das Dashboard. Melden Sie sich mit den Zugangsdaten an, die separat
mitgeliefert wurden.

**Dashboard stoppen:** Drücken Sie im Terminal `Ctrl + C`.

---

## Teil 2: iOS App starten

Die iOS-App ist nur auf einem **Mac-Computer** lauffähig, weil man dazu Xcode braucht
(Apples Entwicklungsumgebung, nur für Mac verfügbar). Außerdem wird ein **echtes iPhone**
benötigt – der Simulator unterstützt keine Kamera für die AR-Funktion.

### Voraussetzungen

- **Mac-Computer** (macOS 14 oder neuer empfohlen)
- **Xcode 16** oder neuer (kostenlos im Mac App Store)
  → Suchen Sie im App Store nach „Xcode" und installieren Sie es (ca. 10 GB)
- **iPhone** (iOS 17 oder neuer) mit USB-Kabel oder WLAN
- Die mitgelieferte Datei **`Secrets.xcconfig`**

### Schritt-für-Schritt

**1. Xcode installieren**

Öffnen Sie den Mac App Store, suchen Sie nach „Xcode" und klicken Sie auf „Laden". Die
Installation dauert je nach Internetverbindung 15–30 Minuten. Starten Sie Xcode einmal, um
die Zusatzkomponenten zu installieren (Xcode wird Sie automatisch dazu auffordern).

**2. Die mitgelieferte `Secrets.xcconfig`-Datei einfügen**

Kopieren Sie die Datei `Secrets.xcconfig` in folgenden Ordner:

```
ar-landmarks-app/
└── ios/
    └── ARLandmarks/
        └── ARLandmarks/
            └── Secrets.xcconfig   ← diese Datei hier einfügen
```

**3. Xcode-Projekt öffnen**

Doppelklicken Sie auf diese Datei:

```
ar-landmarks-app/ios/ARLandmarks/ARLandmarks.xcodeproj
```

Xcode öffnet sich automatisch mit dem Projekt.

**4. iPhone verbinden**

Verbinden Sie das iPhone per USB-Kabel mit dem Mac. Auf dem iPhone erscheint die Frage
„Diesem Computer vertrauen?" – tippen Sie auf „Vertrauen" und geben Sie Ihren iPhone-Code
ein.

**5. iPhone als Zielgerät auswählen**

Klicken Sie oben links in Xcode auf das Dropdown-Menü neben dem App-Namen
(„ARLandmarks"). Wählen Sie dort Ihr iPhone aus der Liste aus.

**6. App starten**

Klicken Sie auf den dreieckigen „Play"-Knopf (▶) oben links in Xcode. Xcode baut die App
und installiert sie auf dem iPhone. Das dauert beim ersten Mal ca. 2–5 Minuten.

**7. App auf dem iPhone erlauben**

Beim ersten Start erscheint auf dem iPhone möglicherweise eine Sicherheitswarnung.

Gehen Sie auf dem iPhone zu:
**Einstellungen → Allgemein → VPN und Geräteverwaltung**

Tippen Sie auf den Eintrag mit dem Namen der Entwicklerin und wählen Sie „Vertrauen".

**8. App testen**

Starten Sie die App auf dem iPhone. Erlauben Sie den Zugriff auf Standort und Kamera.
Gehen Sie (oder simulieren Sie in Xcode einen Standort in Zürich) in die Nähe einer
Zürcher Sehenswürdigkeit und richten Sie die Kamera darauf.

---

## Häufige Probleme

| Problem | Lösung |
|---|---|
| „Cannot find module" im Terminal | `npm install` im `dashboard/`-Ordner erneut ausführen |
| Dashboard zeigt „Error: missing env variable" | `.env.local`-Datei fehlt oder ist falsch platziert |
| Xcode: „No account" Fehler | Xcode → Preferences → Accounts → Apple-ID hinzufügen |
| App startet nicht auf dem iPhone | Schritt 7 (Geräteverwaltung) wiederholen |
| AR-Kamera zeigt nichts | Echtes iPhone verwenden; iPhone-Simulator unterstützt keine Kamera |
| Dashboard-Login schlägt fehl | Zugangsdaten erneut prüfen (separat mitgeliefert) |

---

## Projektstruktur (zur Orientierung)

```
ar-landmarks-app/
├── ios/               iOS-App (Swift/SwiftUI + ARKit)
├── dashboard/         Web-Dashboard (Next.js / React)
├── ml_training/       ML-Modell-Training (Python, nur für Entwicklung)
├── scripts/           Daten-Sync mit Zürich Tourismus API
└── INSTALLATION.md    Diese Datei
```

Das ML-Modell (`LandmarkClassifier.mlpackage`) ist bereits trainiert und im Repository
enthalten. Sie müssen es **nicht** neu trainieren.

---

## Kontakt

Bei Fragen zur Installation wenden Sie sich bitte an die Projektautorin.
