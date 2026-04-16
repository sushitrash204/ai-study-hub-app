/**
 * Typography Design System for Mobile
 * Provides consistent font sizes, weights, and line heights.
 */

export const TYPOGRAPHY = {
  // Font Sizes
  size: {
    h1: 26,      // Large Titles
    h2: 20,      // Screen Headers
    h3: 16,      // Section Headers / Bold UI Elements
    body: 15,    // Standard readable text (Increased for better readability)
    small: 12,   // Captions / Secondary info
    tiny: 10,    // Metadata / Status labels (use sparingly)
  },

  // Font Weights
  weight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },

  // Line Heights (Relative to size)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  }
};

/**
 * Common Text Styles for quick application
 */
export const TEXT_STYLES = {
  h1: {
    fontSize: TYPOGRAPHY.size.h1,
    fontWeight: TYPOGRAPHY.weight.black,
    color: '#111827',
  },
  h2: {
    fontSize: TYPOGRAPHY.size.h2,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#1F2937',
  },
  body: {
    fontSize: TYPOGRAPHY.size.body,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: '#374151',
    lineHeight: TYPOGRAPHY.size.body * TYPOGRAPHY.lineHeight.normal,
  },
  caption: {
    fontSize: TYPOGRAPHY.size.small,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: '#6B7280',
  },
  label: {
    fontSize: TYPOGRAPHY.size.tiny,
    fontWeight: TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: '#9CA3AF',
  }
};
