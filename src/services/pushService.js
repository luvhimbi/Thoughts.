import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = 'BL7s58ojKJgT6wLwoHj4gdhQJEnawgi5QzOBdx1tgtZ_LXvpn6vcbJ6jwFEvWXBNxo5PdnZH68FcyDWuCwIGZq0';

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  /**
   * Subscribe user to push notifications
   */
  subscribeUser: async (userId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported by this browser.');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      // If no subscription, create one
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Store in Firestore
      await setDoc(doc(db, 'push_subscriptions', userId), {
        subscription: JSON.parse(JSON.stringify(subscription)),
        userId,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe user from push notifications
   */
  unsubscribeUser: async (userId) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from Firestore
      await deleteDoc(doc(db, 'push_subscriptions', userId));
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    }
  },

  /**
   * Check if user is currently subscribed
   */
  getSubscriptionStatus: async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  }
};
