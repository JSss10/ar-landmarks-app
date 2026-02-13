//
//  ARLandmarkView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI
import ARKit

struct ARLandmarkView: View {
    let landmarks: [Landmark]
    @StateObject private var modeManager = ARModeManager()
    @State private var selectedLandmark: Landmark?
    @State private var showingDetail = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            ARViewContainer(
                landmarks: landmarks,
                selectedLandmark: $selectedLandmark,
                modeManager: modeManager,
                currentMode: modeManager.currentMode
            )
            .ignoresSafeArea()

            VStack {
                topBar

                Spacer()

                if let landmark = selectedLandmark ?? modeManager.recognizedLandmark {
                    landmarkInfoCard(landmark)
                }

                modeSwitcher
            }
            .padding()
        }
        .onAppear {
            modeManager.startSession()
            modeManager.updateNearbyLandmarks(allLandmarks: landmarks)
        }
        .onDisappear {
            modeManager.stopSession()
        }
        .sheet(isPresented: $showingDetail) {
            if let landmark = selectedLandmark ?? modeManager.recognizedLandmark {
                LandmarkDetailSheet(
                    landmark: landmark,
                    weather: modeManager.weather
                )
            }
        }
    }

    // MARK: - Computed Properties

    private var displayedLandmarks: [Landmark] {
        switch modeManager.currentMode {
        case .visualRecognition:
            if let recognized = modeManager.recognizedLandmark {
                return [recognized]
            }
            return []
        case .geoBased:
            return modeManager.nearbyLandmarks
        }
    }

    // MARK: - View Components

    private var topBar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .fontWeight(.medium)
                    .foregroundStyle(.black)
                    .frame(width: 44, height: 44)
                    .background(.ultraThinMaterial, in: Circle())
            }

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: "mappin.and.ellipse")
                Text("\(landmarks.count) Landmarks")
            }
            .font(.subheadline)
            .fontWeight(.medium)
            .padding(.horizontal, 16)
            .frame(height: 44)
            .background(.ultraThinMaterial)
            .cornerRadius(22)

            if let weather = modeManager.weather {
                HStack(spacing: 4) {
                    Text(weather.iconEmoji)
                    Text(weather.temperatureFormatted)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .padding(.horizontal, 16)
                .frame(height: 44)
                .background(.ultraThinMaterial)
                .cornerRadius(22)
            }
        }
    }

    private func landmarkInfoCard(_ landmark: Landmark) -> some View {
        ZStack(alignment: .topTrailing) {
            VStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    if let imageUrl = landmark.imageUrl, !imageUrl.isEmpty {
                        AsyncImage(url: URL(string: imageUrl)) { phase in
                            switch phase {
                            case .empty:
                                GradientImagePlaceholder(height: 180)
                                    .frame(height: 180)
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(height: 180)
                                    .clipped()
                            case .failure:
                                EmptyView()
                            @unknown default:
                                EmptyView()
                            }
                        }
                        .padding(.bottom, 16)
                        .onTapGesture {
                            showingDetail = true
                        }
                    }

                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(landmark.name)
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)

                            HStack(spacing: 4) {
                                if let category = landmark.category {
                                    Text(category.name)
                                        .font(.system(size: 15))
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            showingDetail = true
                        }

                        HStack(spacing: 12) {
                            Button {
                                openDirections(to: landmark)
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: "figure.walk.circle.fill")
                                        .font(.system(size: 24))
                                    Text("Directions")
                                        .font(.system(size: 12, weight: .medium))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    LinearGradient(
                                        colors: [.blue, .cyan],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }

                            if landmark.phone != nil {
                                Button {
                                    if let phone = landmark.phone {
                                        callPhone(phone)
                                    }
                                } label: {
                                    VStack(spacing: 4) {
                                        Image(systemName: "phone.circle.fill")
                                            .font(.system(size: 24))
                                        Text("Call")
                                            .font(.system(size: 12, weight: .medium))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(Color(uiColor: .secondarySystemFill))
                                    .foregroundColor(.blue)
                                    .cornerRadius(12)
                                }
                            }

                            if landmark.websiteUrl != nil {
                                Button {
                                    if let urlString = landmark.websiteUrl,
                                       let url = URL(string: urlString) {
                                        openWebsite(url)
                                    }
                                } label: {
                                    VStack(spacing: 4) {
                                        Image(systemName: "safari.fill")
                                            .font(.system(size: 24))
                                        Text("Website")
                                            .font(.system(size: 12, weight: .medium))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(Color(uiColor: .secondarySystemFill))
                                    .foregroundColor(.blue)
                                    .cornerRadius(12)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 24)
                    }
                }
                .padding(.bottom, 8)
            }
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: -5)

            Button {
                showingDetail = true
            } label: {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(.ultraThinMaterial, in: Circle())
                    .environment(\.colorScheme, .dark)
            }
            .padding(12)
        }
    }

    private func photoCarousel(photos: [(url: String, caption: String?)]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(photos.indices, id: \.self) { index in
                    AsyncImage(url: URL(string: photos[index].url)) { phase in
                        switch phase {
                        case .empty:
                            GradientImagePlaceholder(height: 180, width: 280, cornerRadius: 16)
                                .frame(width: 280, height: 180)
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 280, height: 180)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        case .failure:
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.gray.opacity(0.15))
                                    .frame(width: 280, height: 180)
                                Image(systemName: "photo")
                                    .font(.system(size: 40))
                                    .foregroundColor(.secondary)
                            }
                        @unknown default:
                            EmptyView()
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func openDirections(to landmark: Landmark) {
        let coordinate = "\(landmark.latitude),\(landmark.longitude)"
        if let url = URL(string: "maps://?daddr=\(coordinate)&dirflg=w") {
            UIApplication.shared.open(url, options: [:])
        }
    }

    private func callPhone(_ phone: String) {
        if let url = URL(string: "tel://\(phone.filter { $0.isNumber })") {
            UIApplication.shared.open(url, options: [:])
        }
    }

    private func openWebsite(_ url: URL) {
        UIApplication.shared.open(url, options: [:])
    }

    private var modeSwitcher: some View {
            HStack(spacing: 12) {
                ForEach(ARModeManager.ARMode.allCases, id: \.self) { mode in
                    Button {
                        withAnimation {
                            if mode == .visualRecognition {
                                modeManager.switchToVisualMode()
                            } else {
                                modeManager.switchToGeoMode()
                            }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: mode.icon)
                            if modeManager.currentMode == mode {
                                Text(mode.rawValue)
                                    .font(.caption)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(
                            modeManager.currentMode == mode
                                ? AnyShapeStyle(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
                                : AnyShapeStyle(Color.clear)
                        )
                        .foregroundColor(modeManager.currentMode == mode ? .white : .primary)
                        .cornerRadius(20)
                    }
                }
            }
            .padding(4)
            .background(.ultraThinMaterial)
            .cornerRadius(24)
        }

    // MARK: - Helpers

    private func formatDistance(_ meters: Double) -> String {
        if meters < 1000 {
            return "\(Int(meters)) m"
        } else {
            return String(format: "%.1f km", meters / 1000)
        }
    }

    private func decodeHTMLEntities(_ text: String) -> String {
        var result = text

        let entities: [String: String] = [
            "&ndash;": "–",
            "&mdash;": "—",
            "&rsquo;": "'",
            "&lsquo;": "'",
            "&rdquo;": "\u{201D}",
            "&ldquo;": "\u{201C}",
            "&quot;": "\"",
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&nbsp;": " ",
            "&uuml;": "ü",
            "&ouml;": "ö",
            "&auml;": "ä",
            "&Uuml;": "Ü",
            "&Ouml;": "Ö",
            "&Auml;": "Ä",
            "&szlig;": "ß",
            "&#39;": "'",
            "&apos;": "'"
        ]

        for (entity, replacement) in entities {
            result = result.replacingOccurrences(of: entity, with: replacement)
        }

        let pattern = "&#(\\d+);"
        if let regex = try? NSRegularExpression(pattern: pattern) {
            let nsString = result as NSString
            let matches = regex.matches(in: result, range: NSRange(location: 0, length: nsString.length))

            for match in matches.reversed() {
                if match.numberOfRanges > 1 {
                    let numberRange = match.range(at: 1)
                    let numberString = nsString.substring(with: numberRange)
                    if let number = Int(numberString),
                       let scalar = UnicodeScalar(number) {
                        let character = String(Character(scalar))
                        let fullRange = match.range
                        result = (result as NSString).replacingCharacters(in: fullRange, with: character)
                    }
                }
            }
        }

        return result
    }

    private func stripHTMLTags(_ text: String) -> String {
        var result = text

        // Replace block-level tags with newlines
        let blockPattern = "<\\s*/?(br|p|div|li|tr|h[1-6])[^>]*\\s*/?>|</\\s*(ul|ol|table)\\s*>"
        if let blockRegex = try? NSRegularExpression(pattern: blockPattern, options: [.caseInsensitive]) {
            result = blockRegex.stringByReplacingMatches(
                in: result,
                range: NSRange(location: 0, length: result.utf16.count),
                withTemplate: "\n"
            )
        }

        // Remove remaining HTML tags
        let tagPattern = "<[^>]+>"
        if let regex = try? NSRegularExpression(pattern: tagPattern, options: [.caseInsensitive]) {
            result = regex.stringByReplacingMatches(
                in: result,
                range: NSRange(location: 0, length: result.utf16.count),
                withTemplate: " "
            )
        }

        result = decodeHTMLEntities(result)

        // Clean up multiple spaces on the same line
        let lines = result.components(separatedBy: "\n").map { line in
            var cleaned = line
            while cleaned.contains("  ") {
                cleaned = cleaned.replacingOccurrences(of: "  ", with: " ")
            }
            return cleaned.trimmingCharacters(in: .whitespaces)
        }.filter { !$0.isEmpty }

        result = lines.joined(separator: "\n")
        result = result.trimmingCharacters(in: .whitespacesAndNewlines)

        return result
    }
}

#Preview {
    ARLandmarkView(landmarks: [])
}