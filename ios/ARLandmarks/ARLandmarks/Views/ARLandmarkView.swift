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
                modeManager: modeManager
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
            if let landmark = selectedLandmark {
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
            HStack(spacing: 8) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.backward")
                    .foregroundStyle(.white)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .cornerRadius(20)

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: "mappin.and.ellipse")
                Text("\(landmarks.count) Landmarks")
            }
            .font(.subheadline)
            .fontWeight(.medium)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .cornerRadius(20)

            if let weather = modeManager.weather {
                HStack(spacing: 4) {
                Text(weather.iconEmoji)
                Text(weather.temperatureFormatted)
                    .font(.subheadline)
                    .fontWeight(.medium)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial)
                .cornerRadius(20)
            }
        }
    }

    private func landmarkInfoCard(_ landmark: Landmark) -> some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 0) {
                if let imageUrl = landmark.imageUrl, !imageUrl.isEmpty {
                    AsyncImage(url: URL(string: imageUrl)) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
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
                            .background(Color.blue)
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
    }

    private func photoCarousel(photos: [(url: String, caption: String?)]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(photos.indices, id: \.self) { index in
                    AsyncImage(url: URL(string: photos[index].url)) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
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
                        .background(modeManager.currentMode == mode ? Color.blue : Color.clear)
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

        let tagPattern = "<[^>]+>"
        if let regex = try? NSRegularExpression(pattern: tagPattern, options: [.caseInsensitive]) {
            result = regex.stringByReplacingMatches(
                in: result,
                range: NSRange(location: 0, length: result.utf16.count),
                withTemplate: " "
            )
        }

        result = decodeHTMLEntities(result)

        while result.contains("  ") {
            result = result.replacingOccurrences(of: "  ", with: " ")
        }

        result = result.trimmingCharacters(in: .whitespacesAndNewlines)

        return result
    }
}

// MARK: - Landmark Detail Sheet

struct LandmarkDetailSheet: View {
    let landmark: Landmark
    let weather: Weather?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    if let imageUrl = landmark.imageUrl, !imageUrl.isEmpty {
                        AsyncImage(url: URL(string: imageUrl)) { phase in
                            switch phase {
                            case .empty:
                                ProgressView()
                                    .frame(height: 240)
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(height: 240)
                                    .clipped()
                            case .failure:
                                EmptyView()
                            @unknown default:
                                EmptyView()
                            }
                        }
                        .padding(.bottom, 24)
                    }

                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(landmark.name)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.primary)

                            HStack(spacing: 8) {
                                if let category = landmark.category {
                                    HStack(spacing: 4) {
                                        Text(category.icon ?? "📍")
                                            .font(.system(size: 14))
                                        Text(category.name)
                                            .font(.system(size: 16))
                                            .foregroundColor(.secondary)
                                    }
                                }

                                if let apiCategories = landmark.apiCategories, !apiCategories.isEmpty {
                                    ForEach(apiCategories.prefix(3), id: \.self) { cat in
                                        Text(cat)
                                            .font(.system(size: 12))
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.blue.opacity(0.1))
                                            .foregroundColor(.blue)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 28)

                        if hasContactInfo {
                            actionButtonsSection
                                .padding(.bottom, 32)
                        }

                        if let description = landmark.description {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("About")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.primary)

                                Text(decodeHTMLEntities(description))
                                    .font(.system(size: 16))
                                    .foregroundColor(.primary)
                                    .lineSpacing(5)
                            }
                            .padding(.horizontal, 20)
                            .padding(.bottom, 32)
                        }

                        if !landmark.photos.isEmpty {
                            photoGallery
                                .padding(.bottom, 32)
                        }

                        if let highlights = landmark.detailedInformation, !highlights.isEmpty {
                            highlightsSection(highlights: highlights)
                                .padding(.bottom, 32)
                        }

                        if let price = landmark.formattedPrice {
                            priceSection(price: price)
                                .padding(.bottom, 32)
                        }

                        if let hours = landmark.formattedOpeningHours {
                            openingHoursSection(hours: hours)
                                .padding(.bottom, 32)
                        }

                        locationDetailsSection
                            .padding(.bottom, 32)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDragIndicator(.visible)
    }

    // MARK: - Highlights Section (Full Width)

    private func highlightsSection(highlights: [String]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Highlights")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 20)

            VStack(alignment: .leading, spacing: 12) {
                ForEach(highlights, id: \.self) { highlight in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.yellow)
                            .frame(width: 20)

                        Text(highlight)
                            .font(.system(size: 16))
                            .foregroundColor(.primary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(Color(uiColor: .secondarySystemFill))
            .cornerRadius(12)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Price Section

    private func priceSection(price: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Admission")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 20)

            HStack(alignment: .top, spacing: 16) {
                Image(systemName: "banknote.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.green)
                    .frame(width: 24)

                Text(stripHTMLTags(price))
                    .font(.system(size: 16))
                    .foregroundColor(.primary)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(Color(uiColor: .secondarySystemFill))
            .cornerRadius(12)
            .padding(.horizontal, 20)
        }
    }

    private var actionButtonsSection: some View {
        VStack(spacing: 12) {
            if let phone = landmark.phone {
                Button {
                    if let url = URL(string: "tel:\(phone)") {
                        UIApplication.shared.open(url, options: [:])
                    }
                } label: {
                    HStack {
                        Image(systemName: "phone.fill")
                            .font(.system(size: 18))
                        Text("Call")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                        Text(phone)
                            .font(.system(size: 16))
                            .foregroundColor(.secondary)
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(Color(uiColor: .secondarySystemFill))
                    .cornerRadius(12)
                }
            }

            if let email = landmark.email {
                Button {
                    if let url = URL(string: "mailto:\(email)") {
                        UIApplication.shared.open(url, options: [:])
                    }
                } label: {
                    HStack {
                        Image(systemName: "envelope.fill")
                            .font(.system(size: 18))
                        Text("Email")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                        Text(email)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(Color(uiColor: .secondarySystemFill))
                    .cornerRadius(12)
                }
            }

            if let website = landmark.websiteUrl {
                Button {
                    if let url = URL(string: website) {
                        UIApplication.shared.open(url, options: [:])
                    }
                } label: {
                    HStack {
                        Image(systemName: "safari.fill")
                            .font(.system(size: 18))
                        Text("Website")
                            .font(.system(size: 16, weight: .semibold))
                        Spacer()
                        Image(systemName: "arrow.up.forward")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(Color(uiColor: .secondarySystemFill))
                    .cornerRadius(12)
                }
            }
        }
        .padding(.horizontal, 20)
    }

    private var locationDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Location Details")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 20)

            VStack(spacing: 0) {
                detailRow(
                    icon: "location.fill",
                    title: "Coordinates",
                    value: String(format: "%.4f°N, %.4f°E", landmark.latitude, landmark.longitude)
                )

                if landmark.altitude > 0 {
                    Divider()
                        .padding(.leading, 52)

                    detailRow(
                        icon: "arrow.up",
                        title: "Altitude",
                        value: "\(Int(landmark.altitude)) m"
                    )
                }

                if let address = landmark.streetAddress, !address.isEmpty {
                    Divider()
                        .padding(.leading, 52)

                    let fullAddress = [
                        address,
                        landmark.postalCode,
                        landmark.city
                    ].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")

                    detailRow(
                        icon: "mappin.circle.fill",
                        title: "Address",
                        value: fullAddress
                    )
                }

                if let place = landmark.place, !place.isEmpty {
                    Divider()
                        .padding(.leading, 52)

                    detailRow(
                        icon: "building.2.fill",
                        title: "Place",
                        value: place
                    )
                }

                if let dateModified = landmark.formattedDateModified {
                    Divider()
                        .padding(.leading, 52)

                    detailRow(
                        icon: "calendar",
                        title: "Last Updated",
                        value: dateModified
                    )
                }
            }
            .background(Color(uiColor: .secondarySystemFill))
            .cornerRadius(12)
            .padding(.horizontal, 20)
        }
    }

    private var photoGallery: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                ForEach(landmark.photos.indices, id: \.self) { index in
                    let photo = landmark.photos[index]
                    AsyncImage(url: URL(string: photo.url)) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                                .frame(width: 320, height: 240)
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 320, height: 240)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        case .failure:
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.gray.opacity(0.15))
                                    .frame(width: 320, height: 240)
                                Image(systemName: "photo")
                                    .font(.system(size: 48))
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

    private var hasContactInfo: Bool {
        landmark.phone != nil || landmark.email != nil || landmark.websiteUrl != nil
    }

    private func openingHoursSection(hours: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Hours")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 20)

            VStack(spacing: 0) {
                HStack(alignment: .top, spacing: 16) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 18))
                        .foregroundColor(.blue)
                        .frame(width: 24)

                    Text(stripHTMLTags(hours))
                        .font(.system(size: 16))
                        .foregroundColor(.primary)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .background(Color(uiColor: .secondarySystemFill))
            .cornerRadius(12)
            .padding(.horizontal, 20)
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

        let tagPattern = "<[^>]+>"
        if let regex = try? NSRegularExpression(pattern: tagPattern, options: [.caseInsensitive]) {
            result = regex.stringByReplacingMatches(
                in: result,
                range: NSRange(location: 0, length: result.utf16.count),
                withTemplate: " "
            )
        }

        result = decodeHTMLEntities(result)

        while result.contains("  ") {
            result = result.replacingOccurrences(of: "  ", with: " ")
        }

        result = result.trimmingCharacters(in: .whitespacesAndNewlines)

        return result
    }

    private func detailRow(icon: String, title: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.blue)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.system(size: 16))
                    .foregroundColor(.primary)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
}

#Preview {
    ARLandmarkView(landmarks: [])
}