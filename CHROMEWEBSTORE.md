# Chrome Web Store Listing Metadata

## Basic Information

- **Extension Name**: Gemini Responsive Layout
- **Version**: 0.1.0
- **Summary**: Responsive wide layout for Google Gemini conversations on widescreen displays.
- **Category**: Productivity / Accessibility
- **Default Language**: en

## Detailed Description

Gemini Responsive Layout optimizes the Google Gemini (gemini.google.com) user interface for widescreen and ultra-wide monitors.

### Key Features
- **Adaptive Canvas**: Expands conversation width dynamically according to your browser window size (up to 1680px).
- **Readability First**: Keeps standard prose (paragraphs, lists) at comfortable reading widths (1200px - 1400px).
- **Wide Block Expansion**: Gives code snippets, data tables, images, and math blocks the full canvas width to eliminate cramped horizontal scrolling.
- **Consistent Alignment**: Aligns the model response and the bottom composer input box cleanly.
- **User Bubble Integrity**: Preserves the natural bubble styling and right-alignment for user prompts.
- **Quick Toggle**: Turn the custom layout on or off at any time from the extension popup.

### Privacy & Data Use
- Operates exclusively on `https://gemini.google.com/*`.
- Only requests the `storage` permission to save your ON/OFF toggle preference.
- No analytics, no telemetry, and no external network requests.
- Never reads, stores, or transmits your conversations, prompts, personal data, or cookies.

## Permissions Justification

| Permission / Host | Justification |
|---|---|
| `storage` | Required to store user preference (enabled/disabled state) across browser sessions locally. |
| `https://gemini.google.com/*` | Required to inspect DOM elements and apply layout classes and CSS styles specifically to Gemini conversations. |

## Privacy Policy Summary

Gemini Responsive Layout does not collect, store, or transmit any user data. All configuration settings are stored locally on the user's device using `chrome.storage.local`. No external servers are contacted.

## Version History

- **0.1.0** (2026-09-07): Initial release providing responsive wide layout, text/wide block separation, and popup toggle for Google Gemini.
