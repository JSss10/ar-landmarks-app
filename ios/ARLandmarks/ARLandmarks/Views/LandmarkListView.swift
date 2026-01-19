//
//  LandmarkListView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI

struct LandmarkListView: View {
    @StateObject private var viewModel = LandmarkViewModel()
    @State private var selectedCategories: Set<String> = []

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Laden...")
                } else if let error = viewModel.errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 40))
                            .foregroundColor(.red)
                        Text(error)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Erneut versuchen") {
                            Task { await viewModel.loadData() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                } else {
                    VStack(spacing: 0) {
                        if !viewModel.categories.isEmpty {
                            categoryFilterBar
                        }

                        List(filteredLandmarks) { landmark in
                            LandmarkRowView(landmark: landmark)
                        }
                        .listStyle(.plain)
                    }
                }
            }
            .navigationTitle("AR Landmarks")
            .task {
                await viewModel.loadData()
            }
            .refreshable {
                await viewModel.loadData()
            }
        }
    }

    private var categoryFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button {
                    selectedCategories.removeAll()
                } label: {
                    HStack(spacing: 4) {
                        Text("Alle")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(selectedCategories.isEmpty ? Color.blue : Color.gray.opacity(0.2))
                    .foregroundColor(selectedCategories.isEmpty ? .white : .primary)
                    .cornerRadius(20)
                }

                ForEach(viewModel.categories) { category in
                    Button {
                        toggleCategory(category.id)
                    } label: {
                        HStack(spacing: 4) {
                            Text(category.icon ?? "")
                                .font(.system(size: 12))
                            Text(category.name)
                                .font(.system(size: 14, weight: .medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(selectedCategories.contains(category.id) ?
                            Color(hex: category.color) : Color.gray.opacity(0.2))
                        .foregroundColor(selectedCategories.contains(category.id) ? .white : .primary)
                        .cornerRadius(20)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(UIColor.systemBackground))
    }

    private var filteredLandmarks: [Landmark] {
        if selectedCategories.isEmpty {
            return viewModel.landmarks
        }
        return viewModel.landmarks.filter { landmark in
            if let categoryId = landmark.categoryId {
                return selectedCategories.contains(categoryId)
            }
            return false
        }
    }

    private func toggleCategory(_ categoryId: String) {
        if selectedCategories.contains(categoryId) {
            selectedCategories.remove(categoryId)
        } else {
            selectedCategories.insert(categoryId)
        }
    }
}

#Preview {
    LandmarkListView()
}
