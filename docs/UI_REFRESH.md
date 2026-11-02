# Morula Care UI refresh — 1 November 2026

## Direction

Use the supplied healthcare-app reference for its compact hierarchy, airy white surfaces, rounded cards, clear date blocks, grouped settings and quiet bottom navigation. Retain Morula Care's orange, peach, plum and sage identity. Keep the existing five-tab patient-companion flow and all clinical/demo boundaries. The reference's doctor marketplace, ratings, payments, prescribing and video consultation are outside this product.

## Tokens and layout

- Canvas `#F7F8FA`, white surfaces `#FFFFFF`, plum text `#32253C`, muted text `#6D6875`, deep orange action `#BC4416`, peach `#FFF0E5`, sage `#267A63`. The deeper action shade keeps both white button labels and orange-on-peach text readable.
- Existing system sans typography; compact 25/32 screen headings, 17/24 section headings, 14/21 body text. No downloaded font dependency.
- One prominent peach program panel on home; white information cards have subtle borders/shadows. Four tinted shortcut tiles lead to existing journeys, appointments and assistant.
- Appointment cards use a clear date column and a quiet time/location footer. Perjalanan preserves the clinical timeline, source release information and readable activity filters. Profile uses grouped icon rows and clear privacy settings. Chat uses a white composer and warm user bubbles, with its clinical boundary always visible.
- Touch controls remain at least 44 points. Existing roles, accessibility labels, error states, refresh behavior and request/appointment distinction remain intact. Source clinical records and API contracts are unchanged.

## Implementation and verification

UI changes are limited to `mobile/App.tsx` and the seven screen/style components `ui.tsx`, `HomeScreen.tsx`, `JourneyScreen.tsx`, `AppointmentsScreen.tsx`, `ProfileScreen.tsx`, `AssistantScreen.tsx`, and `DetailModal.tsx`. Existing React Native primitives are retained for the pinned Expo version and web/native parity; no package/lockfile changes or native module installation is required.

Strict TypeScript passed after the UI edits and again after review fixes. The API browser suite passed with two added touch-size checks: **15 checks, zero page errors**. It verifies the normal five-tab flows, immutable appointment requests, assistant boundaries, error/no-fallback behavior, sticky synchronization warning/recovery and empty released results. Review identified small section actions/retry/dismiss controls; those now have centered minimum 44×44 targets. Browser checks measure the section and retry targets, rather than inferring their size from source.

`scripts/capture-ui.py` captures all five tabs at widths 360, 390 and 1280; 15 captures had no horizontal page overflow or page errors. Extra scrolled screenshots cover lower content. Evidence: `docs/evidence/current-ui-visual.json`, `current-web-smoke.json`, `ui-before-home.png` and `ui-after-*.png`. Source checksum checks confirmed the API adapter, types, fixture, package and lockfile were unchanged. Final native Android acceptance separately passed 10 checks in Expo Go on Android 15/API 35, including keyboard-open submit and font 1.3; see ANDROID_SETUP/PROGRESS and `android-native-smoke.json`. Web screenshots are not used as native proof.

Home prioritizes the actual clinical program status rather than a tall marketing heading, bringing the next-visit card closer to the first fold. Screen intros use concise titles without repetitive uppercase eyebrows. Fonts are explicitly Arial on web, system on iOS and sans-serif on Android; no font loading or platform-specific layout fork is introduced. Final primary `#BC4416` has approximately 5.28:1 contrast with white and 4.74:1 on the peach surface, meeting normal-text AA for these combinations. This final token adjustment improves the secondary-button/pill text while retaining the Morula orange direction.

## Native keyboard follow-up

Actual Android testing exposed keyboard overlap in the request modal: the IME began around screen y=1430 while the original ScrollView extended to y=2207 and its submit action sat below the keyboard. The keyboard-avoiding container had no Android behavior and only wrapped the bottom-aligned sheet. It now fills the modal window outside the overlay and uses Android `height` / iOS `padding`, so the bottom-aligned sheet receives the remaining keyboard-free space and its body can scroll. This follows the [React Native 0.88 keyboard layout guidance](https://github.com/react/react-native-website/blob/main/website/versioned_docs/version-0.88/keyboardavoidingview.md) and was checked against installed RN 0.88.1 source. TypeScript passed after the fix; the targeted native regression is recorded with the Android results.

The targeted Android regression passed: the actual IME inset began at y=1428 and the scrolled submit action occupied y=1077–1215, fully above it. The action was tapped without dismissing the keyboard; a real API receipt rendered and official appointments stayed unchanged (`android-keyboard-smoke.json`, `android-request-keyboard-submit.png`). Android's fullscreen input-method window is not the same as its visible IME inset, so the harness uses `InsetsSource ime` geometry. Font-scale 1.3 home/profile screenshots were also checked after waiting for actual patient data; the tested 393dp section heading/action row stayed within content bounds. These checks cover the owned emulator, not a physical-device/iOS matrix.
