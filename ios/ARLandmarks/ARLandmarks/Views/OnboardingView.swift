//
//  OnboardingView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 18.01.2026.
//

import SwiftUI

struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var currentPage = 0

    private let pages: [OnboardingPage] = [
        OnboardingPage(
            icon: "map.fill",
            title: "Welcome to\nAR Landmarks",
            description: "Discover landmarks around you with the power of Augmented Reality",
            accentColor: .blue
        ),
        OnboardingPage(
            icon: "arkit",
            title: "AR Experience",
            description: "View landmarks in AR and get detailed information about history, architecture and more",
            accentColor: .purple
        ),
        OnboardingPage(
            icon: "camera.viewfinder",
            title: "Two Discovery Modes",
            description: "Use visual recognition or GPS-based view to find landmarks around you",
            accentColor: .green
        ),
        OnboardingPage(
            icon: "location.fill",
            title: "Permissions",
            description: "We need access to camera and location to show you landmarks in AR",
            accentColor: .orange
        ),
        OnboardingPage(
            icon: "checkmark.circle.fill",
            title: "Ready to Start!",
            description: "Begin your journey and discover fascinating landmarks nearby",
            accentColor: .blue
        )
    ]

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    pages[currentPage].accentColor.opacity(0.1),
                    Color(.systemBackground)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentPage)

                VStack(spacing: 24) {
                    pageIndicator

                    actionButton
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 40)
            }
        }
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<pages.count, id: \.self) { index in
                Capsule()
                    .fill(currentPage == index ? pages[currentPage].accentColor : Color.gray.opacity(0.3))
                    .frame(width: currentPage == index ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3), value: currentPage)
            }
        }
    }

    private var actionButton: some View {
        Button {
            if currentPage < pages.count - 1 {
                withAnimation {
                    currentPage += 1
                }
            } else {
                completeOnboarding()
            }
        } label: {
            Text(currentPage < pages.count - 1 ? "Next" : "Let's Go!")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(pages[currentPage].accentColor)
                .cornerRadius(16)
        }
    }

    private func completeOnboarding() {
        withAnimation {
            hasCompletedOnboarding = true
        }
    }
}

struct OnboardingPage {
    let icon: String
    let title: String
    let description: String
    let accentColor: Color
}

struct OnboardingPageView: View {
    let page: OnboardingPage

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            ZStack {
                Circle()
                    .fill(page.accentColor.opacity(0.15))
                    .frame(width: 200, height: 200)

                Circle()
                    .fill(page.accentColor.opacity(0.25))
                    .frame(width: 160, height: 160)

                Image(systemName: page.icon)
                    .font(.system(size: 70, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [page.accentColor, page.accentColor.opacity(0.7)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            VStack(spacing: 16) {
                Text(page.title)
                    .font(.system(size: 32, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.primary, .primary.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )

                Text(page.description)
                    .font(.system(size: 17))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 8)
            }

            Spacer()
        }
        .padding(.horizontal, 32)
    }
}

#Preview {
    OnboardingView()
}
