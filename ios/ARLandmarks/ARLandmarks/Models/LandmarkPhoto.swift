//
//  LandmarkPhoto.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 19.01.2026.
//

import Foundation

struct LandmarkPhoto: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let landmarkId: String
    let photoUrl: String
    let caption: String?
    let captionEn: String?
    let sortOrder: Int
    let isPrimary: Bool
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case landmarkId = "landmark_id"
        case photoUrl = "photo_url"
        case caption
        case captionEn = "caption_en"
        case sortOrder = "sort_order"
        case isPrimary = "is_primary"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
