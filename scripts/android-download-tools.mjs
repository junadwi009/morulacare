// Official, pinned downloads for this Windows-only local Android setup.
// Does not change PATH, install a service, start an emulator, or modify app dependencies.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const directory = join(homedir(), 'codex-development-setup', '2026-11-01', 'downloads', 'android');
mkdirSync(directory, { recursive: true });
const packages = [
  { name: 'platform-tools_r37.0.1-win.zip', url: 'https://dl.google.com/android/repository/platform-tools_r37.0.1-win.zip', algorithm: 'sha1', checksum: 'e03e78b1d80b396f1c3358e31251cb31740e1110' },
  { name: 'emulator-windows_x64-16740729.zip', url: 'https://dl.google.com/android/repository/emulator-windows_x64-16740729.zip', algorithm: 'sha1', checksum: '4d7268aa7787c640ad892844e6c9a5f159e91ad3' },
  { name: 'commandlinetools-win-16111833_latest.zip', url: 'https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip', algorithm: 'sha1', checksum: '57d04f2d75eb8e8fffc5000a987e5de4b5a63e9d' },
  { name: 'OpenJDK21U-jdk_x64_windows_hotspot_21.0.13_9.zip', url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jdk_x64_windows_hotspot_21.0.13_9.zip', algorithm: 'sha256', checksum: 'a4dbaa05fca4bd89d84584e58c459bd732efebb1722af80ab13c6516832004f9' },
  { name: 'OpenJDK21U-jre_x64_windows_hotspot_21.0.13_9.zip', url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_windows_hotspot_21.0.13_9.zip', algorithm: 'sha256', checksum: '2332c0b4cff6bed722da3567c91d5e47568bcba863fa4945d0a8d6fc76158628' },
  { name: 'Expo-Go-58.0.5.apk', url: 'https://github.com/expo/expo-go-releases/releases/download/Expo-Go-58.0.5/Expo-Go-58.0.5.apk', algorithm: 'sha256', checksum: 'd979cf81c56c5432c5aa69adc9497521ee72d1f87e92eee33bc949167a40f1a6' },
];
async function checksum(path, algorithm) {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
// Fresh setup uses the official SDK manager for platform-tools/emulator, avoiding
// duplicate archive installation. The full default also verifies this setup's cache.
const selectedPackages = process.argv.includes('--bootstrap')
  ? packages.filter(item => !/^(platform-tools|emulator-|OpenJDK21U-jre)/.test(item.name))
  : packages;
await Promise.all(selectedPackages.map(async item => {
  const output = join(directory, item.name);
  if (!existsSync(output)) {
    console.log(`Downloading ${item.name}`);
    const partial = output + '.part';
    // Native curl streams large downloads reliably on this Windows host.
    await new Promise((resolve, reject) => {
      const child = spawn(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe'),
        ['--silent', '--show-error', '--fail', '--location', '--retry', '2', '--max-time', '900', '--output', partial, item.url], { stdio: 'inherit', windowsHide: true });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`curl exited ${code} for ${item.name}`)));
    });
    if (await checksum(partial, item.algorithm) !== item.checksum) throw new Error(`Checksum mismatch: ${item.name}`);
    renameSync(partial, output);
  }
  if (await checksum(output, item.algorithm) !== item.checksum) throw new Error(`Existing file checksum mismatch: ${item.name}`);
  console.log(JSON.stringify({ file: output, bytes: statSync(output).size, verified: item.algorithm, sha256: await checksum(output, 'sha256') }));
}));
