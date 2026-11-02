# Local setup — Windows

Root: `C:\Users\User.LAPTOP-OROCJQ8C.000\Downloads\Project\morulacare`.
This is an extracted source package without `.git`; there was no Git status/history to preserve or commit.

## Observed machine, 1 November 2026 (WIB)

- Windows 11 Home Single Language, PowerShell, 8 logical CPUs, 15.56 GiB RAM; about 2 GiB free initially. Heavy builds/browser tests run sequentially.
- Node 26.5.1, npm 11.17.0; application dependencies remain locked by `mobile/package-lock.json`.
- Docker Desktop 4.84.0, Linux engine 29.6.2, Compose 5.3.1 responding successfully.
- Docker VM reports 2 CPUs / 3.827 GiB RAM shared with unrelated services. This project limits API to 512 MiB, PostgreSQL to 256 MiB, and the verification tool container to 1 GiB.
- Git 2.55.0.windows.3 available. Default host Java command remains Java 8u501; backend builds/tests use Maven 3.9.11 + Java 21 containers. The later Android follow-up installed a portable Java 21 JDK used only through process-scoped helpers; no global Java/PATH change was made.
- Ports 8080, 8081, 19006 were free before starting this project.
- VS Code CLI available. Existing window was redirected from parent `Project` to this root with `code.cmd --reuse-window .`.
- Initial inventory found no Android toolchain. The Android follow-up installed SDK/adb/emulator/portable Java and booted an Android 15 AVD; see [ANDROID_SETUP](ANDROID_SETUP.md) for current native evidence and commands. Windows cannot perform an Xcode/iOS local build.

## First setup

Run from the root in PowerShell; no `.ps1` or execution-policy change is needed:

```powershell
node.exe scripts/setup-local.mjs
docker.exe compose -p morula-care-local up -d --build --wait api
cd mobile
npm.cmd ci
npm.cmd run web -- --port 8081 --localhost --max-workers 1
```

Setup preserves existing local configuration. Ignored root `.env` contains a randomly generated local PostgreSQL password; `.env.example` has no password. Ignored `mobile/.env.local` selects `http://localhost:8080` and explicit demo authentication. Never copy database credentials into public Expo variables. Restart Expo after environment changes. Do not run a second Metro on the same port.

Use [Expo web](http://localhost:8081) and [API health](http://localhost:8080/actuator/health). API remains bound to 127.0.0.1. PostgreSQL has no host port; only project containers can connect. This is an explicitly guarded synthetic demo, never production authentication or hospital connectivity.

## Daily operations

Choose the operation you need; these commands are not a sequence to paste together. Run `stop` only when you have finished using/testing the app.

```powershell
# Start/rebuild backend and its database
docker.exe compose -p morula-care-local up -d --build --wait api
# Read logs (Ctrl+C stops log following only)
docker.exe compose -p morula-care-local logs -f --tail 100 api db
# Stop project services while preserving database data
docker.exe compose -p morula-care-local stop
# Start again without rebuilding
docker.exe compose -p morula-care-local up -d --wait api
# Check state
docker.exe compose -p morula-care-local ps
```

Stop a foreground Expo with Ctrl+C. Do not use `down -v`, global Docker cleanup, or change/delete `.env` after database initialization: the named volume retains its original credentials. Volume `morula-care-local_postgres-data` belongs to this project. Back up local data before deliberate schema/major-version changes.

Docker's automatic address pools were full on this machine. This project therefore allocates the checked-free subnets `10.253.249.0/28` (default) and `10.253.248.0/28` (internal database). Override `MORULA_SUBNET` / `MORULA_DATABASE_SUBNET` in local `.env` only if a future host/VPN/network conflicts; inspect routes/networks first. No unrelated Docker network was cleaned up.

The Expo started during this setup runs as a hidden Node process, PID 8220, with output in `mobile/expo-local.log` / `mobile/expo-local-error.log`. To stop this run, first confirm PID 8220 still belongs to `node_modules/expo/bin/cli start` using `Get-CimInstance Win32_Process -Filter 'ProcessId = 8220'`, then run `Stop-Process -Id 8220`. For later sessions use the foreground VS Code task and Ctrl+C instead; never stop an unverified reused PID.

## Verification

From the root, with API running:

```powershell
# Required after stopping the project: Java tests start the database only, not the API.
docker.exe compose -p morula-care-local up -d --wait api
node.exe scripts/verify-local.mjs
# Deliberately restart this project's API + database and verify state survives
node.exe scripts/verify-local.mjs --restart
# Java unit/API tests and real PostgreSQL integration tests (isolated test schema)
docker.exe compose -p morula-care-local --profile tools run --build --rm verify
cd mobile
npm.cmd run typecheck
```

If HTTP verification reports `ECONNREFUSED` on port 8080, check `docker.exe compose -p morula-care-local ps -a`. An API shown as `Exited` needs the `up -d --wait api` command above before retrying. Passing Java tests does not mean a separately running API has been started.

During Java verification, warnings about rejected profiles/missing datasource configuration are expected negative-test cases. The deliberate rollback test also causes a PostgreSQL NOT NULL error in the database log. Assess these together with the final test totals and `BUILD SUCCESS`; they are not evidence of a failed application startup.

HTTP verification creates synthetic requests and toggles synthetic preferences/checklist. `--restart` briefly stops this project's database, checks the structured 503 response, then stops the API and brings both services back before checking retained state. It writes dated evidence in `docs/evidence/current-http.json` or `current-persistence.json`. Integration tests create/drop only their own unique test schema. They never clear application tables or the volume. Run heavy commands sequentially on this machine.

The reusable browser harness is `scripts/verify-web.py`; it uses the separately installed tooling Python/Playwright, not a project Python environment. On this machine:

```powershell
& 'C:\Users\User.LAPTOP-OROCJQ8C.000\codex-development-setup\2026-11-01\tools\python\Scripts\python.exe' scripts/verify-web.py
```

## VS Code

`.vscode/tasks.json` provides backend start/logs/stop, Expo, TypeScript, Java tests, basic HTTP verification and Android doctor/run/stop. Start requires the initial setup command above. TypeScript language support is built into VS Code and selects this project's installed SDK. Backend debugging remains container-based; no unverified host debug launch configuration is supplied. The portable JDK installed for Android is described separately in ANDROID_SETUP.

Recommended, not auto-installed: [Java extension pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack), [Microsoft Container Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers), [React Native Tools](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native), and [Spring Boot pack](https://marketplace.visualstudio.com/items?itemName=vmware.vscode-boot-dev-pack). Marketplace listings checked 1 November 2026. Initial installed extensions were Claude Code, Start Git Bash, Python/debugpy/Pylance/environment tools and Live Server; none of these new recommendations was already installed.

## Storage and native limits

Compose explicitly sets `MORULA_DEMO_STORAGE=postgres` and `SPRING_PROFILES_ACTIVE=demo`. Outside Compose the default remains memory; selecting postgres additionally requires `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`. Unknown storage modes fail startup. Flyway creates versioned schema; idempotent fixture seeding never overwrites user state. Clinical fixture data and appointment schedules remain immutable. Memory mode resets mutable state on restart.

The pinned PostgreSQL 17 image uses `/var/lib/postgresql/data`; see the [official image documentation](https://hub.docker.com/_/postgres) and [Flyway PostgreSQL support](https://documentation.red-gate.com/fd/postgresql-database-277579325.html). Exact image/runtime and migration verification are recorded in PROGRESS.

Browser API URL is `http://localhost:8080`; an Android emulator generally uses `http://10.0.2.2:8080`. A physical phone needs a reachable LAN host address and an explicitly limited development binding/firewall configuration; the current loopback-only API is intentionally unsuitable for phone LAN access. Do not expose this demo to the internet. No cloud builds, signing credentials or store publication were performed.
