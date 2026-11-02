# Morula Care · React Native mobile concept

The current UI uses a compact Morula orange/peach/plum/sage system with near-white surfaces, four dashboard shortcuts, date-led appointments and grouped profile settings. See [UI refresh](../docs/UI_REFRESH.md) for screenshots and verification, and [local Android setup](../docs/ANDROID_SETUP.md) for the verified SDK/AVD and Expo Go API-mode workflow. The dependency lock and API/data contract remain unchanged.

Executable patient app built with React Native, Expo, and TypeScript. The same source targets Android and iOS; Expo web is included to review the flows on a desktop browser. This is a synthetic demonstration, not a deployed clinical application.

## What works

- Five tabs: **Beranda, Perjalanan, Janji, Asisten, Profil**.
- Program timeline, released embryo cards and detail sheets with observation time, release time, releasing team and source.
- Clinical activity history with filters, details and recorded instructions.
- Upcoming appointments and appointment history from the data adapter; appointment change **requests** do not change the source schedule.
- Rule-based assistant for the demo dataset, explicit clinical handoff and general emergency direction. No LLM call is made.
- Care-request simulation with a receipt, per-request idempotency and a clear notice that nothing is sent to the hospital.
- Reminder acknowledgements and privacy preferences; the local adapter keeps these in memory. The API's explicit PostgreSQL storage mode retains care requests, preferences and reminder acknowledgements across service restarts.
- Optional integration with the included Java demo API, with loading, failed-connection, delayed-sync and refresh states. API failures never switch to synthetic local data silently.

## Quick start

Requirements: Node.js compatible with Expo SDK 58 (official SDK matrix says 22.13.x minimum), npm, and a connected Android/iOS simulator or device for native runs. Verified authoring environment used Node 24.22.1.

```sh
npm ci
npm start
```

Then follow Expo's terminal instructions for Android or iOS. To review in a browser:

```sh
npm run web
```

The default is **Demo lokal** and uses only the versioned fixture `src/demo-overview.json`. This fixture is identical to the backend fixture when delivered. Dates are a fixed **31 October 2026** snapshot, not relative to the device's current date.

### Connect to the Java demo API

Start the Java backend with its explicit demo profile, then create a local `.env` file from `.env.example`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_DEMO_AUTH=true
```

Restart Expo after editing environment variables. In a browser or iOS simulator on the same machine, localhost can address the local backend. Android emulator generally uses `http://10.0.2.2:8080`; a physical phone must use the developer machine's reachable LAN address. Use HTTPS for a deployed API. Native platform network policies may require a development-only HTTP allowance; do not ship a relaxed network policy in a production app.

`EXPO_PUBLIC_*` values are public build-time configuration, not secret storage. The fixed bearer string is intentionally a demo-only identity accepted by the Java **demo profile**. Setting an API URL without `EXPO_PUBLIC_DEMO_AUTH=true` shows an error instead of pretending a production login exists. Production requires a real OIDC login/session design and secure token handling.

CORS is relevant to Expo web: the included backend permits localhost ports 8081 and 19006. Do not widen production CORS to `*` for authenticated clinical APIs.

## Review builds

```sh
npm run typecheck
npx expo install --check
npx expo export --platform web --output-dir dist
npx expo export --platform all --output-dir dist-all
```

An exported web bundle can be served with a static server; it is not an Android APK or iOS IPA. JavaScript export for all platforms confirms that bundling resolves; it does not replace physical-device testing or signed native compilation.

Native binaries require the relevant Android SDK/JDK or macOS/Xcode environment. `npx expo run:android` and `npx expo run:ios` generate local native projects; iOS compilation requires macOS. The supplied `eas.json` contains optional internal-demo profiles only. EAS builds require the user's own Expo account/project and platform signing configuration. No cloud build, signing, store upload or paid service was started.

## Demo constraints

- No OTP, account linking, biometrics, partner consent or real patient authentication has been implemented.
- No live EMR/LIS/TERAmedik/Qiscus connection, push delivery, automation worker, medical alert service or payment gateway is included in this mobile UI.
- Profile toggles simulate preferences; notification delivery is not active. Partner sharing is disabled until separate verified consent exists.
- Clinical examples remain in application memory. No AsyncStorage/localStorage persistence is used for patient data, messages, requests or preferences. The synthetic fixture itself is bundled as demonstration content.
- In local mode, requests and checkbox state reset when the demo restarts. API mode with PostgreSQL persists mutable synthetic state on the server; it does not write clinical data to mobile storage. This app is not a durable record of clinical consent, medication adherence or appointment confirmation.
- No dose adjustment, diagnosis, image interpretation or embryo success scoring. The demo keyword router is only a demonstration of routing; it is not an adequate clinical safety system for production.
- Only the IVF synthetic journey is implemented. The product blueprint covers additional programs; implementing them requires validated source data and workflows.
- Brand name and visual identity are a concept for review, not a claim of official Morula approval.

## Structure

```text
App.tsx                  App shell, loading/error states, tabs
src/api.ts               Explicit local/API adapters and demo request handling
src/demo-overview.json    Shared synthetic fixture
src/types.ts              Frontend contract
src/ui.tsx                Design tokens and accessible UI primitives
src/HomeScreen.tsx        Care overview and reminders
src/JourneyScreen.tsx     Program, embryo reports, clinical history
src/AppointmentsScreen.tsx
src/AssistantScreen.tsx
src/ProfileScreen.tsx
src/DetailModal.tsx       Details and care-request forms
```

## References checked during implementation

- [Expo SDK compatibility](https://docs.expo.dev/versions/latest/): cross-package React / React Native mapping.
- [Expo web workflow](https://docs.expo.dev/workflow/web/).
- [Expo local app compilation](https://docs.expo.dev/guides/local-app-development/).
- Installed `expo/bundledNativeModules.json`: exact SDK 58 compatibility recommendations; package lock freezes actual installed versions.

Use the repository-level verification report for actual test results and remaining native-device gates.
