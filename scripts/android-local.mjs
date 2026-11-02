// Local Expo Go testing on the owned Morula Care AVD. No permanent environment changes.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sdk = process.env.ANDROID_HOME || join(homedir(), 'AppData', 'Local', 'Android', 'Sdk');
const tools = join(homedir(), 'codex-development-setup', '2026-11-01', 'tools');
const downloads = join(homedir(), 'codex-development-setup', '2026-11-01', 'downloads', 'android');
const socketDirectory = join(homedir(), '.android', 'jtmp');
const adb = join(sdk, 'platform-tools', 'adb.exe');
const emulator = join(sdk, 'emulator', 'emulator.exe');
const cli = join(homedir(), '.android', 'bin', 'android-cli.exe');
const googleImage = process.argv.includes('--google');
const avd = googleImage ? 'MorulaCare_Google_API_35' : 'MorulaCare_API_35';
const serial = 'emulator-5580';
const evidence = join(root, 'docs', 'evidence');
const visibleWindow = process.argv.includes('--visible');
mkdirSync(socketDirectory, { recursive: true });
mkdirSync(evidence, { recursive: true });
const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  JAVA_HOME: join(tools, 'jdk-21.0.13+9'),
  JAVA_TOOL_OPTIONS: [process.env.JAVA_TOOL_OPTIONS, `-Djdk.net.unixdomain.tmpdir=${socketDirectory}`, `-Djava.io.tmpdir=${socketDirectory}`].filter(Boolean).join(' '),
};

function execute(file, args, options = {}) {
  assert.ok(existsSync(file), `Missing Android tool: ${file}; see docs/ANDROID_SETUP.md`);
  const result = spawnSync(file, args, { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 30000, ...options });
  if (result.status !== 0) throw new Error(`${file} ${args.join(' ')} failed: ${result.stderr || result.stdout || result.error}`);
  return result.stdout || '';
}
const device = (args, options = {}) => execute(adb, ['-s', serial, ...args], options);
function isRunning() { return execute(adb, ['devices']).split(/\r?\n/).some(line => line.startsWith(serial + '\tdevice')); }
function transportExists() { return execute(adb, ['devices']).split(/\r?\n/).some(line => line.startsWith(serial + '\t')); }
function requireOwnedConsole() {
  assert.ok(device(['emu', 'avd', 'name']).split(/\r?\n/).map(line => line.trim()).includes(avd), `Refusing to control a different AVD on ${serial}`);
}
function requireOwned() {
  assert.ok(isRunning(), `${serial} is not ready. Run node.exe scripts/android-local.mjs start${googleImage ? ' --google' : ''} first.`);
  requireOwnedConsole();
}
async function start() {
  if (isRunning()) { requireOwned(); console.log(`${avd} is already running.`); return; }
  const pendingTransport = transportExists();
  assert.ok(existsSync(join(homedir(), '.android', 'avd', avd + '.avd', 'config.ini')), 'Owned AVD has not been created; see docs/ANDROID_SETUP.md');
  if (pendingTransport) console.log(`Waiting for the existing ${serial} transport; a second AVD will not be started.`);
  else {
    console.log(execute(emulator, ['-accel-check']));
    const stdout = openSync(join(evidence, 'android-emulator-stdout.log'), 'a');
    const stderr = openSync(join(evidence, 'android-emulator-stderr.log'), 'a');
    const child = spawn(emulator, ['-avd', avd, '-port', '5580', '-memory', '1536', '-cores', '2', '-gpu', 'software', ...(!visibleWindow ? ['-no-window'] : []), '-no-audio', '-no-boot-anim', '-no-snapshot', '-no-metrics'], {
      cwd: root, env, detached: true, windowsHide: !visibleWindow, stdio: ['ignore', stdout, stderr],
    });
    child.unref();
    writeFileSync(join(evidence, 'android-emulator-process.json'), JSON.stringify({ pid: child.pid, avd, serial, requestedMemoryMiB: 1536, cores: 2, startedAt: new Date().toISOString(), note: 'The emulator may raise RAM to its image minimum; inspect stdout for effective RAM.' }, null, 2));
  }
  for (let attempt = 0; attempt < 120; attempt++) {
    if (isRunning()) {
      try { if (device(['shell', 'getprop', 'sys.boot_completed']).trim() === '1') { requireOwned(); console.log(`${avd} booted as ${serial}.`); return; } } catch { /* continue waiting for Android */ }
    }
    if (attempt % 10 === 0) console.log('Waiting for Android boot...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Android did not boot within four minutes; inspect docs/evidence/android-emulator-*.log.');
}
async function requireServices() {
  try {
    const response = await fetch('http://127.0.0.1:8080/actuator/health', { signal: AbortSignal.timeout(10000) });
    assert.ok(response.ok && (await response.json()).status === 'UP');
  } catch {
    throw new Error('API is unavailable. From the project root run: docker.exe compose -p morula-care-local up -d --wait api');
  }
  try {
    const response = await fetch('http://127.0.0.1:8081', { signal: AbortSignal.timeout(10000) });
    assert.ok(response.ok);
  } catch {
    throw new Error('Metro is unavailable on port8081. From the project root run: npm.cmd --prefix mobile run web -- --localhost --port 8081 --max-workers 1. Do not start a second Metro if one is already running.');
  }
}
async function open() {
  await requireServices();
  requireOwned();
  const packageInfo = device(['shell', 'dumpsys', 'package', 'host.exp.exponent']);
  if (!packageInfo.includes('versionName=58.0.5')) {
    console.log(device(['install', '-r', join(downloads, 'Expo-Go-58.0.5.apk')], { timeout: 180000 }));
  }
  console.log(device(['reverse', 'tcp:8080', 'tcp:8080']));
  console.log(device(['reverse', 'tcp:8081', 'tcp:8081']));
  const url = 'exp://127.0.0.1:8081?__expo_disable_onboarding=1&__expo_disable_fab=1&__expo_disable_auto_launch=1';
  console.log(device(['shell', `am start -a android.intent.action.VIEW -d '${url}'`]));
  console.log('Opened Morula Care in Expo Go. API and Metro remain bound to host loopback.');
}

const commandArgs = process.argv.slice(2).filter(argument => argument !== '--google' && argument !== '--visible');
const command = commandArgs[0] || 'doctor';
if (command === 'doctor') {
  console.log(execute(adb, ['version']));
  console.log(execute(emulator, ['-accel-check']));
  console.log(execute(cli, ['--no-metrics', `--sdk=${sdk}`, 'sdk', 'list']));
  console.log(execute(adb, ['devices', '-l']));
  await requireServices();
} else if (command === 'start') await start();
else if (command === 'run') { await requireServices(); await start(); await open(); }
else if (command === 'open') await open();
else if (command === 'stop') {
  if (!transportExists()) console.log(`${avd} is not running.`);
  else { requireOwnedConsole(); console.log(device(['emu', 'kill'])); }
} else if (command === 'screenshot') {
  requireOwned();
  const name = commandArgs[1] || 'manual';
  assert.match(name, /^[a-zA-Z0-9_-]{1,48}$/);
  const output = join(evidence, `android-${name}.png`);
  writeFileSync(output, execute(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], { encoding: null }));
  console.log(output);
} else throw new Error('Use doctor, start, open, run, stop, or screenshot [name], optionally with --google and --visible.');
