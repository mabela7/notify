import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import './style.css';

const $ = (id) => document.getElementById(id);
let currentToken = '';
let toastTimer;
const logs = [];

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}

function setStatus(label, permission, online) {
  $('deviceStatus').textContent = label;
  $('permissionStatus').textContent = permission;
  $('statusPill').textContent = online ? 'CONNECTED' : 'OFFLINE';
  $('statusPill').classList.toggle('on', online);
}

function showToken(token) {
  currentToken = token || '';
  $('tokenText').textContent = currentToken || 'Your FCM token will appear here.';
  $('tokenState').textContent = currentToken ? 'REGISTERED' : 'NOT REGISTERED';
}

function addLog(title, body, extra = '') {
  const item = { title: title || 'Notification received', body: body || '(No message body)', extra, time: new Date() };
  logs.unshift(item);
  if (logs.length > 20) logs.pop();
  renderLogs();
}

function renderLogs() {
  $('emptyState').style.display = logs.length ? 'none' : 'flex';
  $('logList').innerHTML = logs.map(item => `
    <article class="log-item">
      <div class="log-symbol">↗</div>
      <div class="log-copy"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.body)}</p><small>${item.time.toLocaleTimeString()} ${item.extra ? '· ' + escapeHtml(item.extra) : ''}</small></div>
    </article>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

async function connectDevice() {
  if (!Capacitor.isNativePlatform()) {
    toast('Install the Android APK to register for FCM.');
    return;
  }
  $('connectBtn').disabled = true;
  $('connectBtn').textContent = 'Connecting…';
  try {
    const permission = await FirebaseMessaging.requestPermissions();
    if (permission.receive !== 'granted') {
      setStatus('Permission denied', 'Allow notifications in Android settings.', false);
      toast('Notification permission was not granted.');
      return;
    }
    await FirebaseMessaging.createChannel({
      id: 'notifylab_general',
      name: 'NotifyLab Alerts',
      description: 'Test push notifications from Firebase',
      importance: 4,
      vibration: true,
      lights: true,
      lightColor: '#7c5cff'
    });
    const result = await FirebaseMessaging.getToken();
    showToken(result.token);
    setStatus('Device connected', 'Notifications are allowed on this device.', true);
    toast('FCM token registered successfully.');
  } catch (error) {
    console.error(error);
    setStatus('Connection failed', error?.message || 'Check Firebase setup and try again.', false);
    toast(error?.message || 'Could not register with FCM.');
  } finally {
    $('connectBtn').disabled = false;
    $('connectBtn').innerHTML = '<span>↗</span> Connect device';
  }
}

async function refreshToken() {
  if (!Capacitor.isNativePlatform()) return toast('Use the installed Android APK.');
  try {
    const result = await FirebaseMessaging.getToken();
    showToken(result.token);
    setStatus('Device connected', 'FCM token refreshed.', true);
    toast('Token refreshed.');
  } catch (error) {
    toast(error?.message || 'Token refresh failed.');
  }
}

$('connectBtn').addEventListener('click', connectDevice);
$('refreshBtn').addEventListener('click', refreshToken);
$('copyBtn').addEventListener('click', async () => {
  if (!currentToken) return toast('Connect the device first.');
  try { await navigator.clipboard.writeText(currentToken); toast('FCM token copied.'); }
  catch { toast('Copy unavailable. Select and copy the token manually.'); }
});
$('clearBtn').addEventListener('click', () => { logs.length = 0; renderLogs(); toast('Activity log cleared.'); });

if (Capacitor.isNativePlatform()) {
  FirebaseMessaging.addListener('tokenReceived', event => showToken(event.token));
  FirebaseMessaging.addListener('notificationReceived', event => {
    const n = event.notification || {};
    addLog(n.title, n.body, 'Foreground delivery');
  });
  FirebaseMessaging.addListener('notificationActionPerformed', event => {
    const n = event.notification || {};
    addLog('Notification opened', n.title || n.body || 'Notification tapped', 'Tap action');
  });
  FirebaseMessaging.checkPermissions().then(result => {
    if (result.receive === 'granted') setStatus('Permission granted', 'Ready to register with Firebase.', false);
    else setStatus('Waiting for permission', 'Tap Connect device to allow notifications.', false);
  }).catch(() => setStatus('Android device detected', 'Tap Connect device to begin.', false));
} else {
  setStatus('Preview mode', 'Install the Android APK to use FCM.', false);
}
