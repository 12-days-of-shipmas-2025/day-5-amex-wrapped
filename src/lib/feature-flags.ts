/**
 * Feature Flags Configuration
 *
 * Toggle features on/off to control functionality and reduce bundle size.
 * When disabled, related dependencies won't be loaded and UI won't be shown.
 */

export const FEATURE_FLAGS = {
  /**
   * Video Export Feature
   * When false:
   * - Export button is hidden in StoryMode
   * - FFmpeg and html-to-image are not loaded
   * - No video recording/encoding functionality
   */
  VIDEO_EXPORT_ENABLED: false,

  /**
   * Audio/Music Feature
   * When false:
   * - Music controls are hidden in StoryMode
   * - Lo-fi music generator is not loaded
   * - No background audio playback
   * - Magenta.js is not loaded
   */
  AUDIO_ENABLED: false,
} as const;

// Type for feature flag keys
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// Helper to check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}
