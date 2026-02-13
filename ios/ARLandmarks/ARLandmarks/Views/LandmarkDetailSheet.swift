//
//  LandmarkDetailSheet.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI

// MARK: - Section Header Component

struct SectionHeader: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(.system(size: 22, weight: .bold))
            .foregroundColor(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
    }
}

// MARK: - Skeleton Loading View

struct SkeletonView: View {
    @State private var isAnimating = false
    let width: CGFloat?
    let height: CGFloat
    let cornerRadius: CGFloat

    init(width: CGFloat? = nil, height: CGFloat, cornerRadius: CGFloat = 8) {
        self.width = width
        self.height = height
        self.cornerRadius = cornerRadius
    }

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.blue.opacity(0.08),
                        Color.cyan.opacity(0.15),
                        Color.blue.opacity(0.08)
                    ]),
                    startPoint: isAnimating ? .leading : .trailing,
                    endPoint: isAnimating ? .trailing : .leading
                )
            )
            .frame(width: width, height: height)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                Color.white.opacity(0.2),
                                .clear
                            ],
                            startPoint: isAnimating ? .leading : .trailing,
                            endPoint: isAnimating ? .trailing : .leading
                        )
                    )
            )
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 1.5)
                    .repeatForever(autoreverses: true)
                ) {
                    isAnimating = true
                }
            }
    }
}

// MARK: - Parallax Hero Image

struct ParallaxHeroImage: View {
    let imageUrl: String?
    let height: CGFloat

    var body: some View {
        GeometryReader { geometry in
            let minY = geometry.frame(in: .global).minY
            let isScrollingUp = minY > 0

            if let imageUrl = imageUrl, !imageUrl.isEmpty {
                AsyncImage(url: URL(string: imageUrl)) { phase in
                    switch phase {
                    case .empty:
                        SkeletonView(height: height, cornerRadius: 0)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(
                                width: geometry.size.width,
                                height: height + (isScrollingUp ? minY : 0)
                            )
                            .clipped()
                            .offset(y: isScrollingUp ? -minY : 0)
                    case .failure:
                        ZStack {
                            Color.gray.opacity(0.15)
                            Image(systemName: "photo")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)
                        }
                        .frame(height: height)
                    @unknown default:
                        EmptyView()
                    }
                }
            }
        }
        .frame(height: height)
    }
}

// MARK: - Photo Gallery with Pagination

struct PhotoGalleryView: View {
    let photos: [(url: String, caption: String?)]
    @State private var currentIndex = 0

    var body: some View {
        VStack(spacing: 16) {
            SectionHeader("Photos")

            TabView(selection: $currentIndex) {
                ForEach(photos.indices, id: \.self) { index in
                    let photo = photos[index]
                    AsyncImage(url: URL(string: photo.url)) { phase in
                        switch phase {
                        case .empty:
                            SkeletonView(height: 240, cornerRadius: 16)
                                .padding(.horizontal, 20)
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(maxWidth: .infinity)
                                .frame(height: 240)
                                .clipped()
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .padding(.horizontal, 20)
                        case .failure:
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.gray.opacity(0.15))
                                    .frame(height: 240)
                                Image(systemName: "photo")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 20)
                        @unknown default:
                            EmptyView()
                        }
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 260)
        }
    }
}

// MARK: - Landmark Detail Sheet

struct LandmarkDetailSheet: View {
    let landmark: Landmark
    let weather: Weather?
    @Environment(\.dismiss) private var dismiss

    private let heroImageHeight: CGFloat = 280

    var body: some View {
        NavigationView {
            ZStack(alignment: .bottom) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        if landmark.imageUrl != nil {
                            ParallaxHeroImage(
                                imageUrl: landmark.imageUrl,
                                height: heroImageHeight
                            )
                            .padding(.bottom, 24)
                        }

                        titleSection
                            .padding(.bottom, 28)

                        if hasContactInfo {
                            actionButtonsSection
                                .padding(.bottom, 32)
                        }

                        if let description = landmark.description {
                            aboutSection(description: description)
                                .padding(.bottom, 32)
                        }

                        if !landmark.photos.isEmpty {
                            PhotoGalleryView(photos: landmark.photos)
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
                            .padding(.bottom, 120)
                    }
                }

                stickyDirectionsButton
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDragIndicator(.visible)
    }

    // MARK: - Title Section

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(landmark.name)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)

                if let category = landmark.category {
                    HStack(spacing: 4) {
                        Text(category.icon ?? "📍")
                            .font(.system(size: 14))
                        Text(category.name)
                            .font(.system(size: 16))
                            .foregroundColor(.secondary)
                    }
                }
            }

            if let apiCategories = landmark.apiCategories, !apiCategories.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(apiCategories.prefix(5), id: \.self) { cat in
                            Text(cat)
                                .font(.system(size: 12, weight: .medium))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(8)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 20)
    }

    // MARK: - About Section

    private func aboutSection(description: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader("About")

            Text(decodeHTMLEntities(description))
                .font(.system(size: 16))
                .foregroundColor(.primary)
                .lineSpacing(5)
                .padding(.horizontal, 20)
        }
    }

    // MARK: - Highlights Section

    private func highlightsSection(highlights: [String]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader("Highlights")

            VStack(alignment: .leading, spacing: 12) {
                ForEach(highlights, id: \.self) { highlight in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.blue)
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
            SectionHeader("Admission")

            HStack(alignment: .top, spacing: 16) {
                Image(systemName: "banknote.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.blue)
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

    // MARK: - Opening Hours Section

    private func openingHoursSection(hours: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader("Hours")

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

    // MARK: - Action Buttons Section

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

    // MARK: - Location Details Section

    private var locationDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader("Location Details")

            VStack(spacing: 0) {
                detailRow(
                    icon: "location.fill",
                    title: "Coordinates",
                    value: String(format: "%.4f°N, %.4f°E", landmark.latitude, landmark.longitude)
                )

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

    // MARK: - Sticky Directions Button

    private var stickyDirectionsButton: some View {
        VStack(spacing: 0) {
            LinearGradient(
                colors: [.clear, Color(uiColor: .systemBackground)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 20)

            Button {
                openDirections()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "figure.walk.circle.fill")
                        .font(.system(size: 22))
                    Text("Get Directions")
                        .font(.system(size: 17, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
            .background(Color(uiColor: .systemBackground))
        }
    }

    // MARK: - Helper Properties

    private var hasContactInfo: Bool {
        landmark.phone != nil || landmark.email != nil || landmark.websiteUrl != nil
    }

    // MARK: - Helper Functions

    private func openDirections() {
        let coordinate = "\(landmark.latitude),\(landmark.longitude)"
        if let url = URL(string: "maps://?daddr=\(coordinate)&dirflg=w") {
            UIApplication.shared.open(url, options: [:])
        }
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

// MARK: - Preview Helper

private extension Landmark {
    static var preview: Landmark {
        let json = """
        {
            "id": "preview-1",
            "name": "Sample Landmark",
            "latitude": 47.3769,
            "longitude": 8.5417,
            "description": "A beautiful sample landmark with a long description that spans multiple lines to test the layout and scrolling behavior.",
            "is_active": true,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
        """.data(using: .utf8)!
        return try! JSONDecoder().decode(Landmark.self, from: json)
    }
}

#Preview {
    LandmarkDetailSheet(
        landmark: .preview,
        weather: nil
    )
}