# Local Android setup and native acceptance

## Location-capable Google APIs emulator follow-up

Automatic location through Expo Location requires Google Play Services on Android. The original AOSP image can test the UI/manual facility search but its fused location request fails with `LocationServices.API ... SERVICE_INVALID`. A separate official **Android35 Google APIs x86_64 revision9** image and Pixel4a AVD **MorulaCare_Google_API_35** were installed without replacing the old AVD. Repository archive SHA1: `0103e6dab21290c4b9d16550a3ce99476f884eef`; official SDK manager validated/installed it and removed the ZIP, so no independent retained-ZIP checksum is claimed.

Use the location-capable AVD from the project root:

```powershell
node.exe scripts/android-local.mjs run --google --visible
```

Both owned AVD variants use serial `emulator-5580`, so run only one at a time. The helper verifies the selected AVD name before controlling it. The VS Code Android run/stop tasks now select `--google`. API/Metro remain on loopback with adb reverse; no Google account is needed to use this Google APIs image.

After interactive testing, stop the Google AVD separately:

```powershell
node.exe scripts/android-local.mjs stop --google
```

To run the old UI-only AOSP AVD, omit `--google`; its original data/configuration remain preserved. See [LOCATION_AND_HOME](LOCATION_AND_HOME.md) for foreground permissions, public directory scope and test evidence. App icon/splash config changes require a new custom native build; the Expo Go launcher remains Expo Go.

For an interactive desktop window, run `node.exe scripts/android-local.mjs run --visible` with API/Metro ready. The VS Code task `Morula: Android run (Expo Go)` now uses this option. Without `--visible`, the helper retains its headless automation mode. An already running AVD is reused; stop an owned headless instance before launching it visibly.

Setup date: 1 November 2026, Windows11 Home x64. The application remains on its locked Expo58.0.22 / React Native0.88.1 / React19.3.0 dependencies. Android execution uses the official **Expo Go58.0.5** Android APK, the version selected for SDK58 by Expo's public versions endpoint. No application package, lockfile or Expo environment file was changed for Android networking.

## Installed local tools

| Tool | Verified version / location |
|---|---|
| SDK root | `%LOCALAPPDATA%\Android\Sdk` |
| SDK command-line tools | 23.0 (`cmdline-tools\latest`); compatible19.0 retained from bootstrap investigation |
| Official Android CLI | 1.1.16717390, `%USERPROFILE%\.android\bin\android-cli.exe` |
| Platform-tools / adb | 37.0.1 / 1.0.41 |
| Emulator | 37.2.13, build16740729 |
| SDK platform | Android36, revision2 |
| Build-tools | 36.0.0 |
| Emulator system image | AOSP Android15/API35 `default/x86_64`, revision2 |
| Portable Java | Temurin21.0.13+9 JDK under `%USERPROFILE%\codex-development-setup\2026-11-01\tools\jdk-21.0.13+9` |
| Expo Go | 58.0.5; minSDK24, targetSDK36, x86_64 ABI verified with `aapt` |

The owned AVD is **MorulaCare_API_35**, Pixel4a, serial **emulator-5580**. Its configuration is under `%USERPROFILE%\.android\avd\MorulaCare_API_35.avd`. No physical Android device was connected during setup.

WHPX acceleration was checked with the installed emulator: `WHPX(10.0.26200) is installed and usable`, exit0. No Windows feature, BIOS, firewall, TLS, execution-policy or permanent PATH setting was changed. Existing host Java8 remains untouched.

## Start, open, inspect and stop

From the project root, first make sure the API and the existing Metro server are available:

```powershell
docker.exe compose -p morula-care-local up -d --wait api
# Only if Metro is not already running on8081:
npm.cmd --prefix mobile run web -- --localhost --port 8081 --max-workers 1
```

In another terminal:

```powershell
node.exe scripts/android-local.mjs doctor
node.exe scripts/android-local.mjs run
```

The following are **separate operation choices**, not a sequence to paste together. Keep the emulator running while testing.

Reopen the app without booting another emulator:

```powershell
node.exe scripts/android-local.mjs open
```

Capture the current screen:

```powershell
node.exe scripts/android-local.mjs screenshot manual
```

**Only after testing**, stop the named MorulaCare AVD while preserving its data and the API/Metro services:

```powershell
node.exe scripts/android-local.mjs stop
```

`run` checks API health and Metro, boots the owned AVD if needed, installs the official Go APK if needed, forwards ports, and opens Morula Care. `start` boots without opening the app. The helper waits for an existing pending transport instead of spawning a duplicate emulator. It verifies the AVD name before controlling or stopping it. Emulator processes are headless/hidden and write logs under `docs/evidence/android-emulator-*.log`.

VS Code provides Android doctor/run/stop tasks invoking this helper. A working SDK/AVD is a prerequisite; the helper never silently downloads a new SDK, starts a second Metro, changes the app environment, or starts other Docker projects.

## API mode and network scope

The helper runs both of these against the owned emulator:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s emulator-5580 reverse tcp:8080 tcp:8080
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s emulator-5580 reverse tcp:8081 tcp:8081
```

It then opens `exp://127.0.0.1:8081` with the SDK58 flags that suppress Expo onboarding/dev-menu overlays. The existing `mobile/.env.local` stays at localhost API + explicit demo authentication. adb reverse carries these emulator-local requests to the host loopback ports. The API remains bound to127.0.0.1; no LAN/internet exposure or relaxed production network configuration was added. Expo Go is the development runtime for cleartext local HTTP; this does not establish the network policy of a future standalone release build.

## Windows Java temporary-socket workaround

On this machine the default Java NIO selector fails before any HTTP request with `Unable to establish loopback connection` / `UnixDomainSockets.connect0: Invalid argument`. The same failure reproduced in a minimal Java21 `Selector.open()` probe, independent of Android CLI. A long-form path to the existing Temp directory still failed. A dedicated owned `%USERPROFILE%\.android\jtmp` directory succeeded, including a Java HttpClient request to local API health.

The helper sets only its child processes' `JAVA_HOME`, Android SDK variables and:

```text
-Djdk.net.unixdomain.tmpdir=<user-home>\.android\jtmp
-Djava.io.tmpdir=<user-home>\.android\jtmp
```

This workaround changes temporary file/socket placement, not TLS validation or firewall settings. Android CLI is invoked with `--no-metrics`. The older SDKmanager19 was briefly investigated and retained; the current successful SDK installation and listing used the new official Android CLI with this workaround. Evidence: `android-java-http-probe.log`, `android-java-long-temp-probe.log`, `android-java-owned-temp-probe.log`, `android-cli-temp-fixed.log`.

The verified emulator ZIP was extracted first for the acceleration check. Its installed metadata was then registered from Google's exact repository entry (same37.2.13 revision, type and license), and actual Android CLI `sdk list` confirmed the installed version; a duplicate emulator binary download was avoided. A harmless incomplete `emulator-2/.installer` folder from the cancelled legacy-manager attempt was retained and is not used by the helper.

## Resource limits

The helper requests1536MiB /2cores and software GPU rendering. This emulator/image **raises guest RAM to2560MiB**; the actual stdout is the authority. The host had about1.88GiB free immediately before the cold boot. During cold boot host free RAM fell below0.5GiB. At the end of acceptance QEMU used2444MiB resident /4267MiB private memory and the host had830MiB free. Stopping only the owned emulator raised free RAM to3221MiB; API health remained UP and Metro returned HTTP200. See `android-resource-before-stop.json` and `android-resource-after-stop.json`. The emulator was intentionally left stopped. This is a constrained development host; do not run a browser suite or Gradle build alongside native acceptance. Stop the owned emulator when finished, keeping API/Metro running.

## Reproduce native acceptance

With the helper's `run` complete and API/Metro healthy:

```powershell
& 'C:\Users\User.LAPTOP-OROCJQ8C.000\codex-development-setup\2026-11-01\tools\python\Scripts\python.exe' scripts/android-smoke.py
```

This uses the existing tooling Python and standard library; no project Python environment is created. The harness drives real Android accessibility nodes via adb, captures PNG/XML evidence, verifies API-backed mutations against the server, restores original preferences/checklist, and restores font scale after testing. It is native Expo Go acceptance; standalone APK/AAB compilation, signing and physical-device acceptance are separate checks.

The final complete harness run on 1 November2026 exited0: **10 checks passed, error:null**, `subset:full`. It covered API-mode home/five tabs, checklist mutation, released embryo provenance, care history/instructions, keyboard-open request submission, synthetic receipt and immutable official schedule, assistant schedule/clinical handoff, API preference mutation/privacy boundary, and enlarged text. Evidence: `docs/evidence/android-native-smoke.json` and `android-native-smoke.log`. Native activity/device/network details are in `android-native-runtime.json`; filtered ReactNativeJS/AndroidRuntime error log contained zero lines. Preferences/checklist and font scale1.0 were restored.

Earlier diagnostic attempts adapted the harness to rendered uppercase Android labels, the actual API reply wording, visible IME insets and offscreen profile scrolling. The preceding failed selector attempt remains in `android-native-attempt-profile-selector.json/.log`; the corrected profile/font subset then passed, followed by the complete uninterrupted final run with no script edits during execution. These are test-harness adjustments; assertions of actual clinical provenance and data boundaries remain.

The keyboard regression is also recorded separately in `android-keyboard-smoke.json`: the full submit button was at `[55,1077][1025,1215]`, above the visible IME top1428, and was tapped without dismissing the keyboard. The request receipt rendered and the API appointment snapshot remained unchanged. Android15 can expose a fullscreen InputMethod window; the harness reads the visible IME InsetsSource, and scrolls near the outer sheet edge to avoid scrolling the nested multiline input. See `android-request-keyboard-submit.png` and its accessibility XML.

Enlarged-text evidence is in `android-font-smoke.json` and `android-font130-home-sections.png`: at font scale1.3 the loaded home section title and its action remain separated and readable. The test restores the previous font scale and API-backed preferences/checklist values.

## Official sources and verified downloads

- [Android SDK manager documentation](https://developer.android.com/tools/sdkmanager) and [hardware acceleration](https://developer.android.com/studio/run/emulator-acceleration).
- [Google repository metadata](https://dl.google.com/android/repository/repository2-3.xml) and [AOSP image metadata](https://dl.google.com/android/repository/sys-img/android/sys-img2-3.xml).
- [Official Expo Go58.0.5 APK release](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-58.0.5), confirmed by [Expo versions metadata](https://exp.host/--/api/v2/versions).
- [Temurin21.0.13+9 Windows release](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.13%2B9).

`scripts/android-download-tools.mjs` verifies pinned official archives in the user-scoped download cache; `--bootstrap` excludes duplicate emulator/platform-tools archives and the optional JRE archive for a fresh setup. SDK packages should be installed using the official CLI after setting the process-only short temporary directory above. The full existing cache can be checked by rerunning the helper without flags. Actual package versions are confirmed in `android-sdk-final-list.log` and `android-avd-list.log`; installed states are not inferred solely from a downloaded archive.
