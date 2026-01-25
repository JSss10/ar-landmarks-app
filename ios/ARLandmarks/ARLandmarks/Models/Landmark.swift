//
//  Landmark.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import Foundation

struct Category: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let name: String
    let nameEn: String?
    let icon: String?
    let color: String
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, name, icon, color
        case nameEn = "name_en"
        case sortOrder = "sort_order"
    }
}

struct Landmark: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let name: String
    let nameEn: String?
    let disambiguatingDescription: String?
    let description: String?
    let descriptionEn: String?
    let titleTeaser: String?
    let textTeaser: String?
    let detailedInformation: [String]?
    let zurichCardDescription: String?
    let zurichCard: Bool?
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let categoryId: String?
    let apiCategories: [String]?
    let imageUrl: String?
    let imageCaption: String?
    let price: String?
    let zurichTourismId: String?
    let isActive: Bool
    let createdAt: String
    let updatedAt: String
    let dateModified: String?
    let opens: String?
    let openingHours: String?
    let openingHoursSpecification: [String: Any]?
    let specialOpeningHours: String?
    let addressCountry: String?
    let streetAddress: String?
    let postalCode: String?
    let city: String?
    let phone: String?
    let email: String?
    let websiteUrl: String?
    let place: String?
    let photo0Url: String?
    let photo0Caption: String?
    let photo1Url: String?
    let photo1Caption: String?
    let photo2Url: String?
    let photo2Caption: String?
    let apiSource: String?
    let lastSyncedAt: String?
    let category: Category?

    enum CodingKeys: String, CodingKey {
        case id, name, description, latitude, longitude, altitude, category, price, opens, city, phone, email, place
        case nameEn = "name_en"
        case disambiguatingDescription = "disambiguating_description"
        case descriptionEn = "description_en"
        case titleTeaser = "title_teaser"
        case textTeaser = "text_teaser"
        case detailedInformation = "detailed_information"
        case zurichCardDescription = "zurich_card_description"
        case zurichCard = "zurich_card"
        case categoryId = "category_id"
        case apiCategories = "api_categories"
        case imageUrl = "image_url"
        case imageCaption = "image_caption"
        case zurichTourismId = "zurich_tourism_id"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case dateModified = "date_modified"
        case openingHours = "opening_hours"
        case openingHoursSpecification = "opening_hours_specification"
        case specialOpeningHours = "special_opening_hours"
        case addressCountry = "address_country"
        case streetAddress = "street_address"
        case postalCode = "postal_code"
        case websiteUrl = "website_url"
        case photo0Url = "photo_0_url"
        case photo0Caption = "photo_0_caption"
        case photo1Url = "photo_1_url"
        case photo1Caption = "photo_1_caption"
        case photo2Url = "photo_2_url"
        case photo2Caption = "photo_2_caption"
        case apiSource = "api_source"
        case lastSyncedAt = "last_synced_at"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        latitude = try container.decode(Double.self, forKey: .latitude)
        longitude = try container.decode(Double.self, forKey: .longitude)
        altitude = try container.decode(Double.self, forKey: .altitude)
        isActive = try container.decode(Bool.self, forKey: .isActive)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)

        nameEn = try? container.decodeIfPresent(String.self, forKey: .nameEn)
        description = try? container.decodeIfPresent(String.self, forKey: .description)
        descriptionEn = try? container.decodeIfPresent(String.self, forKey: .descriptionEn)
        categoryId = try? container.decodeIfPresent(String.self, forKey: .categoryId)
        imageUrl = try? container.decodeIfPresent(String.self, forKey: .imageUrl)
        zurichTourismId = try? container.decodeIfPresent(String.self, forKey: .zurichTourismId)
        openingHours = try? container.decodeIfPresent(String.self, forKey: .openingHours)
        streetAddress = try? container.decodeIfPresent(String.self, forKey: .streetAddress)
        postalCode = try? container.decodeIfPresent(String.self, forKey: .postalCode)
        city = try? container.decodeIfPresent(String.self, forKey: .city)
        phone = try? container.decodeIfPresent(String.self, forKey: .phone)
        email = try? container.decodeIfPresent(String.self, forKey: .email)
        websiteUrl = try? container.decodeIfPresent(String.self, forKey: .websiteUrl)
        apiSource = try? container.decodeIfPresent(String.self, forKey: .apiSource)
        lastSyncedAt = try? container.decodeIfPresent(String.self, forKey: .lastSyncedAt)
        category = try? container.decodeIfPresent(Category.self, forKey: .category)

        disambiguatingDescription = try? container.decodeIfPresent(String.self, forKey: .disambiguatingDescription)
        titleTeaser = try? container.decodeIfPresent(String.self, forKey: .titleTeaser)
        textTeaser = try? container.decodeIfPresent(String.self, forKey: .textTeaser)
        detailedInformation = try? container.decodeIfPresent([String].self, forKey: .detailedInformation)
        zurichCardDescription = try? container.decodeIfPresent(String.self, forKey: .zurichCardDescription)
        zurichCard = try? container.decodeIfPresent(Bool.self, forKey: .zurichCard)
        apiCategories = try? container.decodeIfPresent([String].self, forKey: .apiCategories)
        imageCaption = try? container.decodeIfPresent(String.self, forKey: .imageCaption)
        price = try? container.decodeIfPresent(String.self, forKey: .price)
        dateModified = try? container.decodeIfPresent(String.self, forKey: .dateModified)
        opens = try? container.decodeIfPresent(String.self, forKey: .opens)
        specialOpeningHours = try? container.decodeIfPresent(String.self, forKey: .specialOpeningHours)
        addressCountry = try? container.decodeIfPresent(String.self, forKey: .addressCountry)
        place = try? container.decodeIfPresent(String.self, forKey: .place)
        photo0Url = try? container.decodeIfPresent(String.self, forKey: .photo0Url)
        photo0Caption = try? container.decodeIfPresent(String.self, forKey: .photo0Caption)
        photo1Url = try? container.decodeIfPresent(String.self, forKey: .photo1Url)
        photo1Caption = try? container.decodeIfPresent(String.self, forKey: .photo1Caption)
        photo2Url = try? container.decodeIfPresent(String.self, forKey: .photo2Url)
        photo2Caption = try? container.decodeIfPresent(String.self, forKey: .photo2Caption)

        openingHoursSpecification = nil
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(nameEn, forKey: .nameEn)
        try container.encodeIfPresent(disambiguatingDescription, forKey: .disambiguatingDescription)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encodeIfPresent(descriptionEn, forKey: .descriptionEn)
        try container.encodeIfPresent(titleTeaser, forKey: .titleTeaser)
        try container.encodeIfPresent(textTeaser, forKey: .textTeaser)
        try container.encodeIfPresent(detailedInformation, forKey: .detailedInformation)
        try container.encodeIfPresent(zurichCardDescription, forKey: .zurichCardDescription)
        try container.encodeIfPresent(zurichCard, forKey: .zurichCard)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
        try container.encode(altitude, forKey: .altitude)
        try container.encodeIfPresent(categoryId, forKey: .categoryId)
        try container.encodeIfPresent(apiCategories, forKey: .apiCategories)
        try container.encodeIfPresent(imageUrl, forKey: .imageUrl)
        try container.encodeIfPresent(imageCaption, forKey: .imageCaption)
        try container.encodeIfPresent(price, forKey: .price)
        try container.encodeIfPresent(zurichTourismId, forKey: .zurichTourismId)
        try container.encode(isActive, forKey: .isActive)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
        try container.encodeIfPresent(dateModified, forKey: .dateModified)
        try container.encodeIfPresent(opens, forKey: .opens)
        try container.encodeIfPresent(openingHours, forKey: .openingHours)
        try container.encodeIfPresent(specialOpeningHours, forKey: .specialOpeningHours)
        try container.encodeIfPresent(addressCountry, forKey: .addressCountry)
        try container.encodeIfPresent(streetAddress, forKey: .streetAddress)
        try container.encodeIfPresent(postalCode, forKey: .postalCode)
        try container.encodeIfPresent(city, forKey: .city)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encodeIfPresent(email, forKey: .email)
        try container.encodeIfPresent(websiteUrl, forKey: .websiteUrl)
        try container.encodeIfPresent(place, forKey: .place)
        try container.encodeIfPresent(photo0Url, forKey: .photo0Url)
        try container.encodeIfPresent(photo0Caption, forKey: .photo0Caption)
        try container.encodeIfPresent(photo1Url, forKey: .photo1Url)
        try container.encodeIfPresent(photo1Caption, forKey: .photo1Caption)
        try container.encodeIfPresent(photo2Url, forKey: .photo2Url)
        try container.encodeIfPresent(photo2Caption, forKey: .photo2Caption)
        try container.encodeIfPresent(apiSource, forKey: .apiSource)
        try container.encodeIfPresent(lastSyncedAt, forKey: .lastSyncedAt)
        try container.encodeIfPresent(category, forKey: .category)
    }

    var photoUrls: [String] {
        [photo0Url, photo1Url, photo2Url].compactMap { $0 }.filter { !$0.isEmpty }
    }

    var photos: [(url: String, caption: String?)] {
        var result: [(url: String, caption: String?)] = []
        if let url = photo0Url, !url.isEmpty {
            result.append((url: url, caption: photo0Caption))
        }
        if let url = photo1Url, !url.isEmpty {
            result.append((url: url, caption: photo1Caption))
        }
        if let url = photo2Url, !url.isEmpty {
            result.append((url: url, caption: photo2Caption))
        }
        return result
    }

    var formattedOpeningHours: String? {
        if let special = specialOpeningHours, !special.isEmpty {
            return special
        }

        guard let hours = openingHours, !hours.isEmpty else { return nil }

        if hours.contains("\n") { return hours }

        let dayMap: [String: String] = [
            "Su": "Sunday",
            "Mo": "Monday",
            "Tu": "Tuesday",
            "We": "Wednesday",
            "Th": "Thursday",
            "Fr": "Friday",
            "Sa": "Saturday"
        ]

        let parts = hours.split(separator: " ")
        if parts.count == 2 {
            let days = parts[0].split(separator: ",").map(String.init)
            var timeRange = String(parts[1])

            timeRange = timeRange
                .replacingOccurrences(of: ":00-", with: "-")
                .replacingOccurrences(of: ":00$", with: "", options: .regularExpression)

            let timePattern = "(\\d{2}:\\d{2}):\\d{2}"
            if let regex = try? NSRegularExpression(pattern: timePattern) {
                let range = NSRange(timeRange.startIndex..., in: timeRange)
                timeRange = regex.stringByReplacingMatches(in: timeRange, range: range, withTemplate: "$1")
            }

            let formattedDays = days.map { day -> String in
                let fullDay = dayMap[day] ?? day
                return "\(fullDay): \(timeRange)"
            }

            return formattedDays.joined(separator: "\n")
        }

        return hours
    }

    var formattedDateModified: String? {
        guard let dateString = dateModified else { return nil }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate, .withTime, .withColonSeparatorInTime]

        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.locale = Locale(identifier: "en_US")
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }

        let simpleFormatter = DateFormatter()
        simpleFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm"
        if let date = simpleFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.locale = Locale(identifier: "en_US")
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }

        return dateString
    }

    var formattedPrice: String? {
        guard let priceValue = price else { return nil }
        let trimmed = priceValue.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed.lowercased() == "null" {
            return nil
        }
        return trimmed
    }

    static func == (lhs: Landmark, rhs: Landmark) -> Bool {
        lhs.id == rhs.id
    }
}