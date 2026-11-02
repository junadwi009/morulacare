const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withLocalAndroidApi(config) {
  config = withAndroidManifest(config, result => {
    const app = result.modResults.manifest.application?.[0];
    if (!app) throw Error('Android application manifest is missing');
    app.$['android:usesCleartextTraffic'] = 'false';
    app.$['android:networkSecurityConfig'] = '@xml/morula_local_api_network';
    return result;
  });
  config = withDangerousMod(config, ['android', async result => {
    const directory = path.join(result.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'morula_local_api_network.xml'), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="false">localhost</domain>
  </domain-config>
</network-security-config>
`);
    return result;
  }]);
  return withProjectBuildGradle(config, result => {
    // These limits apply only to this local testing profile, including library C++.
    const marker = '// Morula local APK: bounded native compilation';
    const endMarker = '// End Morula local APK limits';
    let contents = result.modResults.contents;
    const start = contents.indexOf(marker);
    if (start >= 0) {
      const end = contents.indexOf(endMarker, start);
      if (end >= 0) contents = contents.slice(0, start) + contents.slice(end + endMarker.length);
      else {
        // Migrate only our older block, which was appended at EOF.
        if (contents.slice(start).includes('apply plugin:')) throw Error('Unexpected code following legacy local build block');
        contents = contents.slice(0, start);
      }
    }
    const limits = `
${marker}
subprojects { p ->
  ['com.android.application', 'com.android.library'].each { pluginId ->
    p.pluginManager.withPlugin(pluginId) {
      p.extensions.getByName('android').with {
        defaultConfig {
          externalNativeBuild {
            cmake {
              arguments '-DCMAKE_JOB_POOLS=morula_pool=1',
                        '-DCMAKE_JOB_POOL_COMPILE=morula_pool', '-DCMAKE_JOB_POOL_LINK=morula_pool'
            }
          }
        }
      }
    }
  }
  p.pluginManager.withPlugin('com.facebook.react') {
    p.extensions.getByName('react').extraPackagerArgs.addAll(['--max-workers', '1'])
  }
}
${endMarker}
`;
    const anchor = 'apply plugin: "expo-root-project"';
    if (!contents.includes(anchor)) throw Error('Expo root plugin anchor is missing');
    // Register callbacks BEFORE root plugins can eagerly configure Android modules.
    result.modResults.contents = contents.replace(anchor, limits + '\n' + anchor);
    return result;
  });
};
