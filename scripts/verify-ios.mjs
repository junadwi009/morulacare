// Validate the current iOS JS/Hermes export on Windows; this is not a native runtime test.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mobile = join(root, 'mobile');
const evidence = join(root, 'docs/evidence');
const output = join(mobile, 'dist-ios-test');
const checks = [];
const result = { timestamp: new Date().toISOString(), platform: 'ios', host: process.platform,
  scope: 'iOS production JS/Hermes export in API demo mode; not native execution',
  nativeRuntime: { status: 'NOT_RUN', reason: 'No available Mac/iOS simulator or physical iOS device. Windows cannot host the Apple iOS simulator.' },
  checks, passed: 0, error: null };
mkdirSync(evidence, { recursive: true });
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log('PASS ' + name); };

try {
  // Explicit child-only values keep this export reproducibly in local API mode.
  // localhost works for a simulator sharing its API host; a future physical phone needs a reachable host.
  const env = { ...process.env, CI: '1', EXPO_PUBLIC_API_URL: 'http://localhost:8080', EXPO_PUBLIC_DEMO_AUTH: 'true' };
  let log = '';
  const status = await new Promise((accept, reject) => {
    const child = spawn(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'ios',
      '--output-dir', 'dist-ios-test', '--max-workers', '1'], { cwd: mobile, env, windowsHide: true });
    for (const [stream, target] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.on('data', chunk => { log += chunk; target.write(chunk); });
    }
    child.on('error', reject);
    child.on('close', accept);
  }).finally(() => writeFileSync(join(evidence, 'current-ios-export.log'), log));
  check('Current source exports successfully for iOS', status === 0);
  const metadata = JSON.parse(readFileSync(join(output, 'metadata.json'), 'utf8'));
  const ios = metadata.fileMetadata?.ios;
  check('Export metadata contains iOS only', !!ios && !metadata.fileMetadata.android && !metadata.fileMetadata.web);
  const artifact = resolve(output, ios.bundle);
  check('iOS bundle path stays inside export directory', artifact.startsWith(output + sep));
  check('iOS Hermes bundle is nonempty', artifact.endsWith('.hbc') && statSync(artifact).size > 0);
  const bytes = readFileSync(artifact);
  // Hermes header magic: reject a text JS file merely renamed to .hbc.
  check('Bundle has Hermes bytecode header', bytes.readBigUInt64LE(0) === 0x1f1903c103bc1fc6n);
  check('Export embeds the explicit local API URL', bytes.includes(Buffer.from('http://localhost:8080')));
  check('Export includes API demo authentication path', bytes.includes(Buffer.from('demo-patient-token')));
  check('All exported iOS assets exist', Array.isArray(ios.assets) && ios.assets.every(asset => {
    const path = resolve(output, asset.path);
    return path.startsWith(output + sep) && statSync(path).size > 0;
  }));
  result.bundle = { path: 'mobile/dist-ios-test/' + ios.bundle, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), assetCount: ios.assets.length };
  result.versions = JSON.parse(readFileSync(join(mobile, 'package.json'), 'utf8')).dependencies;
} catch (error) {
  result.error = error.message;
  console.error('FAIL ' + error.message);
  process.exitCode = 1;
} finally {
  result.passed = checks.length;
  writeFileSync(join(evidence, 'current-ios-validation.json'), JSON.stringify(result, null, 2) + '\n');
}
