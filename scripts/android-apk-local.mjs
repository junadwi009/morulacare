// Install/open the standalone APK on the owned Google AVD. Metro is not needed.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireLocalApi } from './local-api-health.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const adb=join(homedir(),'AppData/Local/Android/Sdk/platform-tools/adb.exe');
const serial='emulator-5580';
const packageName=JSON.parse(readFileSync(join(root,'mobile/app.json'),'utf8')).expo.android.package;
const artifact=join(root,'artifacts/android/MorulaCare-local-api-x86_64.apk');
function execute(args,timeout=30000) {
  const result=spawnSync(adb,args,{encoding:'utf8',windowsHide:true,timeout});
  assert.equal(result.status,0,result.stderr||result.stdout||String(result.error));
  return result.stdout;
}
const device=(args,timeout)=>execute(['-s',serial,...args],timeout);
function owned() {
  assert.ok(device(['emu','avd','name']).split(/\r?\n/).some(line=>line.trim()==='MorulaCare_Google_API_35'),'Refusing to control an unrelated AVD');
}
async function ready() {
  await requireLocalApi();
  if(!execute(['devices']).includes(serial+'\tdevice')) {
    const status=await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[join(root,'scripts/android-local.mjs'),'start','--google','--visible'],{cwd:root,windowsHide:true,stdio:'inherit'});
      child.on('error',reject);child.on('close',resolve);
    });
    assert.equal(status,0,'Owned emulator failed to start');
  }
  owned();
  console.log(device(['reverse','tcp:8080','tcp:8080']));
}
try {
const command=process.argv[2]||'run';
if(command==='run'||command==='open') {
  let build;
  if(command==='run') {
    build=JSON.parse(readFileSync(join(root,'docs/evidence/standalone-build.json'),'utf8'));
    assert.equal(build.package,packageName,'Artifact package metadata mismatch');
    assert.equal(createHash('sha256').update(readFileSync(artifact)).digest('hex'),build.sha256,'APK checksum mismatch');
  }
  await ready();
  if(command==='run')console.log(device(['install','-r',artifact],180000));
  assert.ok(device(['shell','pm','path',packageName]).trim().startsWith('package:'),'Standalone app is not installed; run this helper with run first');
  device(['shell','am','force-stop','host.exp.exponent']);
  device(['shell','am','force-stop',packageName]);
  const launched=device(['shell','am','start','-W','-n',packageName+'/.MainActivity'],60000);
  assert.ok(launched.includes('Status: ok')&&launched.includes(packageName),'Standalone activity failed to launch: '+launched);
  console.log(launched);
  const frame=spawnSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:30000});
  if(frame.status===0)writeFileSync(join(root,'docs/evidence/standalone-first-frame.png'),frame.stdout);
  writeFileSync(join(root,'docs/evidence',command==='run'?'standalone-install.json':'standalone-open.json'),JSON.stringify({timestamp:new Date().toISOString(),
    package:packageName,avd:'MorulaCare_Google_API_35',serial,api:'http://127.0.0.1:8080',
    sha256:build?.sha256||null,expoGoStopped:true,metroRequired:false,action:command},null,2)+'\n');
  console.log('Standalone Morula Care launched. API uses adb reverse8080; Expo Go/Metro are not needed.');
} else if(command==='stop') {
  owned();console.log(device(['shell','am','force-stop',packageName]));
} else throw Error('Use run (install + launch), open (launch installed APK), or stop');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
