//
//  LandmarkRowView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI

struct LandmarkRowView: View {
    let landmark: Landmark

    var body: some View {
        HStack(spacing: 12) {
            if let imageUrl = landmark.imageUrl, !imageUrl.isEmpty {
                AsyncImage(url: URL(string: imageUrl)) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    case .empty:
                        categoryIcon
                    case .failure:
                        categoryIcon
                    @unknown default:
                        categoryIcon
                    }
                }
            } else {
                categoryIcon
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(landmark.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                if let teaser = landmark.textTeaser, !teaser.isEmpty {
                    Text(teaser)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                } else if let category = landmark.category {
                    HStack(spacing: 4) {
                        Text(category.name)
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: category.color))
                    }
                }

                if let apiCategories = landmark.apiCategories, !apiCategories.isEmpty, landmark.textTeaser == nil {
                    HStack(spacing: 4) {
                        ForEach(apiCategories.prefix(2), id: \.self) { cat in
                            Text(cat)
                                .font(.system(size: 10))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(4)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }

    private var categoryIcon: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 56, height: 56)

            Image(systemName: "mappin.and.ellipse")
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(.white)
        }
    }
}