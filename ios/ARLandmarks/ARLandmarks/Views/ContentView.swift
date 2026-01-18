//
//  ContentView.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI

struct ContentView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    var body: some View {
        Group {
            if hasCompletedOnboarding {
                LandmarkListView()
            } else {
                OnboardingView()
            }
        }
    }
}

#Preview {
    ContentView()
}
