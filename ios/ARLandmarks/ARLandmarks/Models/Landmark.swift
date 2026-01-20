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
    let description: String?
    let descriptionEn: String?
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let categoryId: String?
    let imageUrl: String?
    let zurichTourismId: String?
    let isActive: Bool
    let createdAt: String
    let updatedAt: String
    let streetAddress: String?
    let postalCode: String?
    let city: String?
    let phone: String?
    let email: String?
    let websiteUrl: String?
    let openingHours: String?
    let apiSource: String?
    let lastSyncedAt: String?
    let category: Category?

    enum CodingKeys: String, CodingKey {
        case id, name, description, latitude, longitude, altitude, category
        case nameEn = "name_en"
        case descriptionEn = "description_en"
        case categoryId = "category_id"
        case imageUrl = "image_url"
        case zurichTourismId = "zurich_tourism_id"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case streetAddress = "street_address"
        case postalCode = "postal_code"
        case city
        case phone
        case email
        case websiteUrl = "website_url"
        case openingHours = "opening_hours"
        case apiSource = "api_source"
        case lastSyncedAt = "last_synced_at"
    }
}
