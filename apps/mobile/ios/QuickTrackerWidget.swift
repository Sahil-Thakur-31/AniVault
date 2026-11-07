import WidgetKit
import SwiftUI
import AppIntents

/**
 * iOS WidgetKit implementation with interactive AppIntents (iOS 17+).
 * Direct interactive buttons on home-screen without launching main application.
 */
struct QuickTrackerEntry: TimelineEntry {
    let date: Date
    let title: String
    let currentEpisode: Int
    let totalEpisodes: Int
    let progressPercentage: Double
}

struct QuickTrackerWidgetView: View {
    var entry: QuickTrackerEntry

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text("Episode \(entry.currentEpisode) of \(entry.totalEpisodes)")
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "94A3B8"))

                // Progress Bar
                ProgressView(value: entry.progressPercentage, total: 100.0)
                    .tint(Color(hex: "6366F1"))
            }

            Spacer()

            // Interactive +1 Episode Button
            Button(intent: IncrementProgressIntent(delta: 1)) {
                Text("+1")
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 38, height: 38)
                    .background(Color(hex: "6366F1"))
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .padding()
        .containerBackground(Color(hex: "131B2E"), for: .widget)
    }
}

@available(iOS 17.0, *)
struct IncrementProgressIntent: AppIntent {
    static var title: LocalizedStringResource = "Increment Episode Progress"
    
    @Parameter(title: "Delta")
    var delta: Int

    init() { self.delta = 1 }
    init(delta: Int) { self.delta = delta }

    func perform() async throws -> some IntentResult {
        // 1. Write optimistic update to shared AppGroup container (group.com.anivault.shared)
        // 2. Request WidgetCenter.shared.reloadTimelines(ofKind: "QuickTrackerWidget")
        // 3. Dispatch background network sync task
        return .result()
    }
}

