import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const configure = require('../mobile/app.config.js');
const base = require('../mobile/app.json').expo;

function profile(local, phone) {
  const oldLocal = process.env.MORULA_LOCAL_ANDROID_BUILD;
  const oldPhone = process.env.MORULA_PHONE_DEMO;
  try {
    process.env.MORULA_LOCAL_ANDROID_BUILD = local;
    process.env.MORULA_PHONE_DEMO = phone;
    return configure({ config: base });
  } finally {
    if (oldLocal === undefined) delete process.env.MORULA_LOCAL_ANDROID_BUILD;
    else process.env.MORULA_LOCAL_ANDROID_BUILD = oldLocal;
    if (oldPhone === undefined) delete process.env.MORULA_PHONE_DEMO;
    else process.env.MORULA_PHONE_DEMO = oldPhone;
  }
}

test('ordinary Expo config is unchanged', () => {
  assert.equal(profile('0', '0'), base);
});

test('API emulator build retains its existing identity', () => {
  const config = profile('1', '0');
  assert.equal(config.android.package, base.android.package);
  assert.equal(config.extra.localApiDemo, true);
});

test('phone demo installs alongside API app and retains flower assets', () => {
  const config = profile('1', '1');
  assert.equal(config.android.package, base.android.package + '.demo');
  assert.equal(config.name, 'Morula Care Demo');
  assert.equal(config.extra.localApiDemo, false);
  assert.equal(config.extra.phoneDemo, true);
  assert.equal(config.icon, base.icon);
  assert.deepEqual(config.android.adaptiveIcon, base.android.adaptiveIcon);
  assert.ok(config.android.blockedPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW'));
});
