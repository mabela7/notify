import fs from 'node:fs';
import path from 'node:path';

const root = 'android';
const rootGradle = path.join(root, 'build.gradle');
const appGradle = path.join(root, 'app/build.gradle');
const manifest = path.join(root, 'app/src/main/AndroidManifest.xml');

if (!fs.existsSync(rootGradle) || !fs.existsSync(appGradle) || !fs.existsSync(manifest)) {
  throw new Error('Generated Android project files were not found.');
}

let projectGradle = fs.readFileSync(rootGradle, 'utf8');
if (!projectGradle.includes('com.google.gms:google-services')) {
  const dependencies = /dependencies\s*\{/;
  if (!dependencies.test(projectGradle)) throw new Error('Could not find dependencies block in android/build.gradle');
  projectGradle = projectGradle.replace(dependencies, match => `${match}\n        classpath 'com.google.gms:google-services:4.6.0'`);
  fs.writeFileSync(rootGradle, projectGradle);
}

let moduleGradle = fs.readFileSync(appGradle, 'utf8');
if (!moduleGradle.includes("com.google.gms.google-services")) {
  const plugins = /plugins\s*\{/;
  if (!plugins.test(moduleGradle)) throw new Error('Could not find plugins block in android/app/build.gradle');
  moduleGradle = moduleGradle.replace(plugins, match => `${match}\n    id 'com.google.gms.google-services'`);
  fs.writeFileSync(appGradle, moduleGradle);
}

let xml = fs.readFileSync(manifest, 'utf8');
if (!xml.includes('android.permission.POST_NOTIFICATIONS')) {
  xml = xml.replace(/<application\b/, '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n\n    <application');
}
if (!xml.includes('com.google.firebase.messaging.default_notification_icon')) {
  xml = xml.replace('<application', '<application\n        android:usesCleartextTraffic="false"');
  xml = xml.replace('</application>', `        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_notifylab" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notifylab_notification_color" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="notifylab_general" />\n    </application>`);
}
fs.writeFileSync(manifest, xml);

const drawableDir = path.join(root, 'app/src/main/res/drawable');
const valuesDir = path.join(root, 'app/src/main/res/values');
fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(valuesDir, { recursive: true });
fs.writeFileSync(path.join(drawableDir, 'ic_stat_notifylab.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4a1.5,1.5 0,0 0,-3 0v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1z" />
</vector>`);
let strings = path.join(valuesDir, 'strings.xml');
let values = fs.existsSync(strings) ? fs.readFileSync(strings, 'utf8') : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';
if (!values.includes('notifylab_notification_color')) values = values.replace('</resources>', '    <color name="notifylab_notification_color">#8C68FF</color>\n</resources>');
fs.writeFileSync(strings, values);
console.log('Android Firebase Gradle setup, permission, notification channel metadata, and icon configured.');
