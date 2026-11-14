# NotifyLab

A small Capacitor 8 + Vite Android app for testing Firebase Cloud Messaging (FCM).

## Firebase setup

1. Create a Firebase project named NotifyLab.
2. Add an Android app with package name `com.notifylab.test`.
3. Download `google-services.json` and put it in this repository's root folder (same level as `package.json`).
4. In Firebase Console, open Messaging / Firebase Cloud Messaging. No service-account key is needed for Console test messages.

The Firebase Android config file contains non-secret project identifiers. Do not put service-account private keys or FCM server credentials in this repository or in the app.

## Build

GitHub Actions builds the APK. Push to `main` or manually run **Build NotifyLab APK** from Actions. Download the `NotifyLab-Android-APK` artifact.

## Test

1. Install the APK on an Android device with Google Play services.
2. Open NotifyLab and tap **Connect device**; allow notifications.
3. Copy the FCM token.
4. In Firebase Console open Messaging, create a notification, choose **Send test message**, paste the FCM registration token and send.
5. For background testing, put NotifyLab in the background before sending. The app must not be force-stopped from Android settings.

Foreground notification events appear in the app activity log. Background notification messages are displayed by Android; data-only messages are not the same as visible notification messages.
