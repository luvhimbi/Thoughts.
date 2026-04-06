const webpush = require('web-push');

// Replace with your VAPID keys
const VAPID_PUBLIC_KEY = 'BL7s58ojKJgT6wLwoHj4gdhQJEnawgi5QzOBdx1tgtZ_LXvpn6vcbJ6jwFEvWXBNxo5PdnZH68FcyDWuCwIGZq0';
const VAPID_PRIVATE_KEY = 'kBYMva4n-JizQ72jSdpGvEeTsbD3_vO5aOD_Rcq1XkI';

webpush.setVapidDetails(
  'mailto:support@thoughts.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// To use this: 
// 1. Get a subscription object from your Firestore 'push_subscriptions' collection.
// 2. Paste it below and run this script.

const pushSubscription = {
  // PASTE SUBSCRIPTION OBJECT HERE
  // endpoint: '...',
  // keys: { p256dh: '...', auth: '...' }
};

const payload = JSON.stringify({
  title: 'Mindful Reminder',
  body: 'Your inner world is waiting. Spend a moment with your thoughts today.',
});

if (pushSubscription.endpoint) {
  webpush.sendNotification(pushSubscription, payload)
    .then(response => console.log('Successfully sent push:', response))
    .catch(error => console.error('Error sending push:', error));
} else {
  console.log('Please paste a valid subscription object in the script to test.');
  console.log('You can find subscriptions in your Firestore "push_subscriptions" collection.');
}
