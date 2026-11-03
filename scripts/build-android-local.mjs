// Local standalone APK: default API emulator, or --phone offline demo. No cloud.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, createWriteStream, readdirSync, statSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'mobile');
const phoneDemo = process.argv.includes('--phone');
const architectures = phoneDemo ? 'arm64-v8a,x86_64' : 'x86_64';
const reportPrefix = phoneDemo ? 'phone-demo' : 'standalone';
// Short, explicitly owned paths prevent Windows CMake/Ninja object-path overflow.
const stage = phoneDemo ? 'C:\\morula-phone-apk' : 'C:\\morula-local-apk';
const project = join(stage, 'project');
const marker = join(stage, '.morula-build-owner.json');
const evidence = join(root, 'docs/evidence');
const sdk = join(homedir(), 'AppData/Local/Android/Sdk');
const jdk = join(homedir(), 'codex-development-setup/2026-11-01/tools/jdk-17.0.20.1+1');
const temp = join(homedir(), '.android/jtmp');
// Share the API stage's cache only when that stage is already owned. A first
// phone build must not create an unmarked API stage that prepare would reject.
let gradleHome = join(stage, 'gradle-home');
const apiOwner = 'C:\\morula-local-apk\\.morula-build-owner.json';
if (phoneDemo && existsSync(apiOwner)) {
  try {
    if (JSON.parse(readFileSync(apiOwner, 'utf8')).sourceRoot === root) {
      gradleHome = 'C:\\morula-local-apk\\gradle-home';
    }
  } catch { /* An unrecognized stage is not a shared cache. */ }
}
const inputFiles = ['package.json','package-lock.json','app.json','app.config.js','App.tsx','index.ts','tsconfig.json'];
const inputTrees = ['src','assets','plugins'];
const snapshotFile = join(stage,'source-snapshot.json');
const env = {
  ...process.env, PATH: `C:\\Program Files\\nodejs;${join(jdk,'bin')};${process.env.PATH || ''}`,
  JAVA_HOME: jdk, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
  GRADLE_USER_HOME: gradleHome, CI: '1', NODE_ENV: 'production',
  MORULA_LOCAL_ANDROID_BUILD: '1', MORULA_PHONE_DEMO: phoneDemo ? '1' : '0',
  EXPO_PUBLIC_API_URL: phoneDemo ? '' : 'http://127.0.0.1:8080', EXPO_PUBLIC_DEMO_AUTH: phoneDemo ? 'false' : 'true',
  EXPO_NO_DOTENV: '1',
  EXPO_NO_GIT_STATUS: '1', CMAKE_BUILD_PARALLEL_LEVEL: '1',
  JAVA_TOOL_OPTIONS: `${process.env.JAVA_TOOL_OPTIONS || ''} -Djdk.net.unixdomain.tmpdir=${temp} -Djava.io.tmpdir=${temp}`.trim(),
};
mkdirSync(evidence, {recursive:true});
mkdirSync(temp, {recursive:true});

async function run(file, args, cwd, logName) {
  const log = createWriteStream(join(evidence, logName));
  const status = await new Promise((resolve, reject) => {
    const child = spawn(file, args, {cwd, env, windowsHide:true});
    for (const [stream,target] of [[child.stdout,process.stdout],[child.stderr,process.stderr]]) {
      stream.on('data', chunk => { log.write(chunk); target.write(chunk); });
    }
    child.on('error',reject); child.on('close',resolve);
  }).finally(()=>log.end());
  assert.equal(status,0,`${logName} failed, exit ${status}`);
}

function property(contents,key,value) {
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex=new RegExp(`^${escaped}=.*$`,'m');
  return regex.test(contents)?contents.replace(regex,`${key}=${value}`):contents+`\n${key}=${value}\n`;
}
function requireOwnedStage() {
  assert.ok(existsSync(marker),'Run prepare first; refusing an unmarked staging directory');
  assert.equal(JSON.parse(readFileSync(marker,'utf8')).sourceRoot,root,'Staging directory belongs to another project');
}
function snapshot(base) {
  const files={};
  function scan(path) {
    assert.ok(!lstatSync(path).isSymbolicLink(),'Source snapshot does not follow symbolic links');
    if(statSync(path).isDirectory())for(const item of readdirSync(path).sort())scan(join(path,item));
    else files[relative(base,path).replaceAll('\\','/')]=createHash('sha256').update(readFileSync(path)).digest('hex');
  }
  for(const item of [...inputFiles,...inputTrees])scan(join(base,item));
  return {files,fingerprint:createHash('sha256').update(JSON.stringify(files)).digest('hex')};
}

async function prepare() {
  if (existsSync(stage)) requireOwnedStage();
  else {mkdirSync(stage,{recursive:true});writeFileSync(marker,JSON.stringify({sourceRoot:root,createdAt:new Date().toISOString()},null,2));}
  mkdirSync(project,{recursive:true});
  const sourceSnapshot=snapshot(source);
  // Mirror only source trees: remove stale copied files, never caches/native builds.
  for(const item of inputTrees) {
    const directory=join(project,item);
    const prune=path=>{
      assert.ok(!lstatSync(path).isSymbolicLink(),'Refusing a symbolic link in owned source mirror');
      if(statSync(path).isDirectory())for(const entry of readdirSync(path))prune(join(path,entry));
      else if(!(relative(project,path).replaceAll('\\','/') in sourceSnapshot.files)) {
        assert.ok(resolve(path).startsWith(resolve(project)+sep),'Refusing a path outside owned staging project');
        assert.ok(realpathSync(path).startsWith(realpathSync(project)+sep),'Refusing a resolved path outside owned staging project');
        rmSync(path); // One generated/copied file only, no recursive deletion.
      }
    };
    if(existsSync(directory))prune(directory);
  }
  for (const item of [...inputFiles,...inputTrees,'node_modules']) {
    console.log(`Stage ${item}`);
    cpSync(join(source,item),join(project,item),{recursive:true,preserveTimestamps:true,
      filter:(from,to)=>item!=='node_modules'||!existsSync(to)||statSync(from).isDirectory()||statSync(from).size!==statSync(to).size||Math.abs(statSync(from).mtimeMs-statSync(to).mtimeMs)>1});
  }
  await run(process.execPath,['node_modules/expo/bin/cli','prebuild','--platform','android','--no-install','--no-clean','--skip-dependency-update','react,react-native,expo'],project,reportPrefix+'-prebuild.log');
  writeFileSync(join(project,'android/local.properties'),`sdk.dir=${sdk.replaceAll('\\','/')}\n`);
  const propertiesFile=join(project,'android/gradle.properties');
  let properties=readFileSync(propertiesFile,'utf8');
  for (const [key,value] of Object.entries({
    'org.gradle.jvmargs':'-Xmx1536m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8',
    'org.gradle.workers.max':'1','org.gradle.parallel':'false','org.gradle.caching':'true',
    'kotlin.compiler.execution.strategy':'in-process','org.gradle.java.installations.auto-download':'false',
    'org.gradle.java.installations.paths':jdk.replaceAll('\\','/'),
    'reactNativeArchitectures':architectures,'hermesEnabled':'true','android.enableMinifyInReleaseBuilds':'false',
    'android.cmakeVersion':'3.30.5','expo.android.cmakeObjectPathMax':'180',
  })) properties=property(properties,key,value);
  writeFileSync(propertiesFile,properties);
  const wrapper=join(project,'android/gradle/wrapper/gradle-wrapper.properties');
  let wrapperText=readFileSync(wrapper,'utf8');
  const version=wrapperText.match(/gradle-([\d.]+)-bin\.zip/)[1];
  const response=await fetch(`https://services.gradle.org/distributions/gradle-${version}-bin.zip.sha256`,{signal:AbortSignal.timeout(30000)});
  assert.ok(response.ok,'Official Gradle checksum unavailable');
  const checksum=(await response.text()).trim();assert.match(checksum,/^[a-f0-9]{64}$/);
  wrapperText=property(wrapperText,'distributionSha256Sum',checksum);writeFileSync(wrapper,wrapperText);
  assert.ok(readFileSync(join(project,'android/app/src/main/res/xml/morula_local_api_network.xml'),'utf8').includes('127.0.0.1'));
  assert.equal(snapshot(source).fingerprint,sourceSnapshot.fingerprint,'Source changed during prepare; prepare again');
  writeFileSync(snapshotFile,JSON.stringify({source:sourceSnapshot,staged:snapshot(project),preparedAt:new Date().toISOString()},null,2)+'\n');
  console.log(`Prepared local Android project, Gradle ${version}, pinned distribution checksum.`);
}

async function build() {
  requireOwnedStage();assert.ok(existsSync(join(jdk,'bin/java.exe')),'Portable JDK17 is missing');
  assert.ok(existsSync(snapshotFile),'Run prepare to record the source snapshot first');
  const prepared=JSON.parse(readFileSync(snapshotFile,'utf8'));
  assert.equal(snapshot(source).fingerprint,prepared.source.fingerprint,'Source changed: run prepare before building');
  assert.equal(snapshot(project).fingerprint,prepared.staged.fingerprint,'Staged sources changed: run prepare before building');
  await run(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe',
    ['/d','/c','gradlew.bat',':app:assembleRelease','--no-daemon','--no-parallel','--max-workers=1','--console=plain'],
    join(project,'android'),reportPrefix+'-gradle.log');
  assert.equal(snapshot(source).fingerprint,prepared.source.fingerprint,'Source changed during build: prepare and rebuild before publishing an APK');
  assert.equal(snapshot(project).fingerprint,prepared.staged.fingerprint,'Staged sources changed during build: prepare and rebuild before publishing an APK');
  const apk=join(project,'android/app/build/outputs/apk/release/app-release.apk');
  assert.ok(existsSync(apk),'Standalone APK not produced');
  const archive=spawnSync(join(jdk,'bin/jar.exe'),['tf',apk],{encoding:'utf8',env,windowsHide:true});
  assert.equal(archive.status,0,'APK archive could not be inspected');
  assert.ok(archive.stdout.split(/\r?\n/).includes('assets/index.android.bundle'),'Release APK has no embedded JavaScript bundle');
  const artifactDirectory=join(root,'artifacts/android');mkdirSync(artifactDirectory,{recursive:true});
  const name=phoneDemo?'MorulaCare-phone-demo.apk':'MorulaCare-local-api-x86_64.apk';copyFileSync(apk,join(artifactDirectory,name));
  const bytes=readFileSync(apk);const sha256=createHash('sha256').update(bytes).digest('hex');
  writeFileSync(join(artifactDirectory,name+'.sha256'),`${sha256}  ${name}\n`);
  writeFileSync(join(evidence,reportPrefix+'-build.json'),JSON.stringify({timestamp:new Date().toISOString(),
    artifact:'artifacts/android/'+name,bytes:bytes.length,sha256,variant:'release',architecture:architectures,
    package:JSON.parse(readFileSync(join(source,'app.json'),'utf8')).expo.android.package+(phoneDemo?'.demo':''),
    mode:phoneDemo?'Offline demo':'API demo',apiUrl:env.EXPO_PUBLIC_API_URL,embeddedJavaScript:true,staging:stage,
    signing:'Expo template debug test key; not a production upload key',sourceFingerprint:prepared.source.fingerprint,cloudUsed:false},null,2)+'\n');
  console.log(`APK ready: ${join(artifactDirectory,name)}\nSHA256 ${sha256}`);
}
const command=process.argv[2] || 'build';
if(command==='prepare')await prepare();
else if(command==='build')await build();
else throw Error('Use prepare or build');
