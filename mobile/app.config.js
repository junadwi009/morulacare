// The emulator-only HTTP exception is applied only by our explicit local APK build.
module.exports = ({ config }) => process.env.MORULA_LOCAL_ANDROID_BUILD === '1'
  ? { ...config, plugins: [...(config.plugins || []), './plugins/withLocalAndroidApi.cjs'],
      ...(process.env.MORULA_PHONE_DEMO === '1' ? { name: 'Morula Care Demo' } : {}),
      android: { ...config.android,
        ...(process.env.MORULA_PHONE_DEMO === '1' ? { package: config.android.package + '.demo' } : {}),
        blockedPermissions: [...new Set([...(config.android?.blockedPermissions || []),
        'android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'])] },
      extra: { ...config.extra, localApiDemo: process.env.MORULA_PHONE_DEMO !== '1', phoneDemo: process.env.MORULA_PHONE_DEMO === '1' } }
  : config;
