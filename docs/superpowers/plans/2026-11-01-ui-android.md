# Morula UI refresh and local Android verification

**User brief:** Refresh the existing app using the supplied medical-app reference while retaining Morula character; set up Android SDK/emulator where feasible and test actual native API mode locally.

**Approach:** Keep existing Expo 58 / RN 0.88.1 and five-tab patient workflow. Use the reference's airy white cards, compact hierarchy, rounded surfaces and clear appointment rows, with Morula orange/peach/plum/sage. Existing safety, synthetic-data and API behaviors remain binding. Native tooling uses official downloads and user-scoped installation; a compatible Expo Go is preferred if supported by actual packages. No paid cloud/signing/publishing or global security changes.

**Ownership:** UI agent owns `mobile/App.tsx`, `mobile/src/**`, `docs/UI_REFRESH.md`; Android agent owns user-scoped SDK/JDK/emulator setup, `scripts/android*`, `docs/ANDROID_SETUP.md`. Main owns verification screenshots, shared documentation and coordination. Changes to package/config/native directories require coordination. Preserve existing source/data and locked dependencies.

- [x] Inspect reference, existing UI and Android host readiness; capture before screenshot.
- [x] Restyle all five screens, shared controls and detail sheets; retain accessible names/roles and API/error semantics.
- [x] Install official local Android SDK tools and compatible runtime; verify hardware acceleration and resource readiness.
- [x] Typecheck and run existing web flow suite; inspect screenshots at narrow/wide viewports and fix visible issues.
- [x] Run native app in API mode using emulator/device where possible; verify actual native interactions and save evidence, or record exact host blocker and remaining manual step.
- [x] Independent review, final source/runtime checks and current setup/progress documentation.

**Resource ledger:** One heavy browser/build/emulator operation at a time. Initial Windows free RAM is under 1 GiB; never stop unrelated processes/containers or change global hypervisor/security settings. Main captured baseline Edge screenshot before UI changes. SDK downloads/installation may proceed during source editing; emulator launch waits for UI freeze and main allocation.

**Acceptance:** Morula visual identity retained; reference affects visual language, not introduction of doctor marketplace/payments/health scores/prescription/video features. Released-only embryo results, request-versus-appointment distinction, clinical chatbot boundary, disabled delivery/partner sharing and explicit API failure remain intact. Browser evidence is separate from native evidence. Services remain local and synthetic.
