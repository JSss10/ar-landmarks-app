//
//  OverviewView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 18.01.2026.
//

import SwiftUI

struct OverviewView: View {
    @StateObject private var viewModel = LandmarkViewModel()
    @State private var showARView = false
    @State private var showLandmarkList = false

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color.blue.opacity(0.1),
                        Color.purple.opacity(0.05),
                        Color(.systemBackground)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 40) {
                    Spacer()

                    headerSection

                    navigationButtons

                    Spacer()
                    Spacer()
                }
                .padding(.horizontal, 32)
            }
            .navigationDestination(isPresented: $showLandmarkList) {
                LandmarkListView()
            }
            .fullScreenCover(isPresented: $showARView) {
                ARLandmarkView(landmarks: viewModel.landmarks)
            }
            .task {
                await viewModel.loadData()
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.blue.opacity(0.15), Color.purple.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 160, height: 160)

                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.blue.opacity(0.25), Color.purple.opacity(0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)

                Image(systemName: "map.fill")
                    .font(.system(size: 60, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            VStack(spacing: 12) {
                Text("AR Landmarks")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.primary, .primary.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )

                Text("Discover landmarks with Augmented Reality")
                    .font(.system(size: 17))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private var navigationButtons: some View {
        VStack(spacing: 16) {
            Button {
                showARView = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "arkit")
                        .font(.system(size: 22, weight: .semibold))
                    Text("Start AR Experience")
                        .font(.system(size: 18, weight: .semibold))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(16)
                .shadow(color: Color.blue.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .disabled(viewModel.landmarks.isEmpty)

            Button {
                showLandmarkList = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 20, weight: .medium))
                    Text("Browse All Landmarks")
                        .font(.system(size: 17, weight: .medium))
                }
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                )
            }
            .disabled(viewModel.landmarks.isEmpty)

            if viewModel.isLoading {
                ProgressView("Loading landmarks...")
                    .padding(.top, 8)
            } else if viewModel.errorMessage != nil {
                Text("Unable to load landmarks")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 8)
            }
        }
    }
}

#Preview {
    OverviewView()
}
