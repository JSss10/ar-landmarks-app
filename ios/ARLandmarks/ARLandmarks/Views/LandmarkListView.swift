//
//  LandmarkListView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI

enum SortOption: String, CaseIterable {
    case nameAZ = "Name (A-Z)"
    case nameZA = "Name (Z-A)"
    case recentlyAdded = "Recently Added"
    case oldest = "Oldest First"

    var icon: String {
        switch self {
        case .nameAZ: return "textformat.abc"
        case .nameZA: return "textformat.abc"
        case .recentlyAdded: return "clock"
        case .oldest: return "clock.arrow.circlepath"
        }
    }
}

struct LandmarkListView: View {
    @StateObject private var viewModel = LandmarkViewModel()
    @State private var selectedCategories: Set<String> = []
    @State private var sortOption: SortOption = .nameAZ
    @State private var showingSortOptions = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else if let error = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 40))
                            .foregroundColor(.red)
                        Text(error)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Try Again") {
                            Task { await viewModel.loadData() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    VStack(spacing: 0) {
                        if !uniqueCategories.isEmpty {
                            categoryFilterBar
                        }

                        List(sortedAndFilteredLandmarks) { landmark in
                            LandmarkRowView(landmark: landmark)
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("AR Landmarks")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            Button {
                                sortOption = option
                            } label: {
                                HStack {
                                    Text(option.rawValue)
                                    if sortOption == option {
                                        Spacer()
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down")
                    }
                }
            }
            .task {
                await viewModel.loadData()
            }
            .refreshable {
                await viewModel.loadData()
            }
        }
    }

    private var uniqueCategories: [Category] {
        var seen = Set<String>()
        var result: [Category] = []

        for category in viewModel.categories.sorted(by: { $0.sortOrder < $1.sortOrder }) {
            if !seen.contains(category.name) {
                seen.insert(category.name)
                result.append(category)
            }
        }

        return result
    }

    private var categoryFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button {
                    selectedCategories.removeAll()
                } label: {
                    HStack(spacing: 4) {
                        Text("All")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(selectedCategories.isEmpty ? Color.blue : Color.gray.opacity(0.2))
                    .foregroundColor(selectedCategories.isEmpty ? .white : .primary)
                    .cornerRadius(20)
                }

                ForEach(uniqueCategories) { category in
                    Button {
                        toggleCategory(category.name)
                    } label: {
                        HStack(spacing: 4) {
                            if let icon = category.icon, !icon.isEmpty {
                                Text(icon)
                                    .font(.system(size: 12))
                            }
                            Text(category.name)
                                .font(.system(size: 14, weight: .medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(selectedCategories.contains(category.name) ?
                            Color(hex: category.color) : Color.gray.opacity(0.2))
                        .foregroundColor(selectedCategories.contains(category.name) ? .white : .primary)
                        .cornerRadius(20)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(UIColor.systemBackground))
    }

    private var sortedAndFilteredLandmarks: [Landmark] {
        var result = viewModel.landmarks

        if !selectedCategories.isEmpty {
            result = result.filter { landmark in
                
                if let category = landmark.category, selectedCategories.contains(category.name) {
                    return true
                }

                if let apiCategories = landmark.apiCategories {
                    for apiCategory in apiCategories {
                        if selectedCategories.contains(apiCategory) {
                            return true
                        }
                    }
                }
                return false
            }
        }

        switch sortOption {
        case .nameAZ:
            result.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        case .nameZA:
            result.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedDescending }
        case .recentlyAdded:
            result.sort { $0.createdAt > $1.createdAt }
        case .oldest:
            result.sort { $0.createdAt < $1.createdAt }
        }

        return result
    }

    private func toggleCategory(_ categoryName: String) {
        if selectedCategories.contains(categoryName) {
            selectedCategories.remove(categoryName)
        } else {
            selectedCategories.insert(categoryName)
        }
    }
}

#Preview {
    LandmarkListView()
}