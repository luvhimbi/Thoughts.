import { auth, googleProvider } from "../lib/firebase";
import { 
  signInWithPopup, 
  signOut, 
  updateProfile, 
  signInAnonymously, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  linkWithPopup,
  EmailAuthProvider,
  linkWithCredential
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Service to handle Firebase Authentication
 */
export const authService = {
  /**
   * Signs in a user using Google OAuth popup
   * If an anonymous user is logged in, it attempts to link the accounts.
   * @returns {Promise<import('../types/models').User>}
   */
  async loginWithGoogle() {
    try {
      let result;
      // If current user is anonymous, try linking instead of just signing in
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          result = await linkWithPopup(auth.currentUser, googleProvider);
        } catch (linkError) {
          // If linking fails (e.g. account already exists), fall back to normal login
          // Note: In a production app, you might want to handle this more gracefully (merge data)
          console.warn("Linking failed, falling back to normal login", linkError);
          result = await signInWithPopup(auth, googleProvider);
        }
      } else {
        result = await signInWithPopup(auth, googleProvider);
      }
      
      const user = result.user;
      await this.ensureUserDocument(user);
      
      return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      };
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  /**
   * Signs in a user anonymously (Guest mode)
   */
  async loginAnonymously() {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      await this.ensureUserDocument(user);

      return {
        uid: user.uid,
        displayName: "Guest",
        email: null,
        photoURL: null,
        isAnonymous: true
      };
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      throw error;
    }
  },

  /**
   * Sends a magic link to the user's email
   * @param {string} email 
   */
  async sendMagicLink(email) {
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be whitelisted in the Firebase Console.
      url: window.location.origin + '/login',
      // This must be true.
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email locally so you don't have to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.error("Error sending magic link:", error);
      throw error;
    }
  },

  /**
   * Checks if the current URL is a magic link
   */
  isMagicLink(url) {
    return isSignInWithEmailLink(auth, url);
  },

  /**
   * Completes the magic link sign-in
   * @param {string} email 
   * @param {string} url 
   */
  async finishMagicLinkLogin(email, url) {
    try {
      let result;
      // If current user is anonymous, try linking instead of just signing in
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          const credential = EmailAuthProvider.credentialWithLink(email, url);
          result = await linkWithCredential(auth.currentUser, credential);
        } catch (linkError) {
          console.warn("Linking failed, falling back to normal login", linkError);
          result = await signInWithEmailLink(auth, email, url);
        }
      } else {
        result = await signInWithEmailLink(auth, email, url);
      }
      
      window.localStorage.removeItem('emailForSignIn');
      const user = result.user;
      await this.ensureUserDocument(user);

      return {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      };
    } catch (error) {
      console.error("Error finishing magic link login:", error);
      throw error;
    }
  },

  /**
   * Signs out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  /**
   * Updates the user's display name
   * @param {string} displayName - The new display name
   */
  async updateDisplayName(displayName) {
    try {
      if (!auth.currentUser) throw new Error("No user logged in");
      await updateProfile(auth.currentUser, { displayName });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  /**
   * Deletes the user's account and all associated data
   */
  async deleteAccount() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
      
      // Delete user from Firebase Auth
      await user.delete();
    } catch (error) {
      console.error("Error deleting account:", error);
      // If error is 'auth/requires-recent-login', we might need to re-authenticate
      throw error;
    }
  },

  /**
   * Ensures a user has a document in the 'users' collection.
   * @param {import('firebase/auth').User} user
   * @returns {Promise<Object>}
   */
  async ensureUserDocument(user) {
    try {
      if (!user || !user.uid) return {};
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      const profile = {
        uid: user.uid,
        displayName: user.displayName || "Guest",
        photoURL: user.photoURL || null,
        email: user.email || null,
        isAnonymous: user.isAnonymous
      };

      if (!userSnap.exists()) {
        const userData = {
          ...profile,
          createdAt: new Date().toISOString(),
          currentStreak: 0
        };
        await setDoc(userRef, userData);
      } else {
        // Update photoURL and displayName if they changed
        await setDoc(userRef, { 
          displayName: profile.displayName, 
          photoURL: profile.photoURL 
        }, { merge: true });
      }

      // Cache the profile for instant UI load
      this._cacheProfile(profile);

      // Register this device
      await this.registerCurrentDevice(user.uid);

      return {};
    } catch (error) {
      console.error("Error ensuring user document:", error);
      throw error;
    }
  },

  /**
   * Caches the user profile in localStorage
   * @private
   */
  _cacheProfile(profile) {
    try {
      localStorage.setItem('thoughts_user_profile', JSON.stringify(profile));
    } catch (e) { /* noop */ }
  },

  /**
   * Gets the cached user profile
   */
  getCachedProfile() {
    try {
      const cached = localStorage.getItem('thoughts_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Registers the current device in the user's document
   */
  /**
   * Registers the current device in the user's document
   */
  async registerCurrentDevice(userId) {
    try {
      const DEVICE_ID_KEY = 'thoughts_device_id';
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }

      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      
      const deviceData = {
        id: deviceId,
        name: isMobile ? 'Mobile Device' : 'Desktop Browser',
        userAgent,
        platform,
        lastSeen: new Date().toISOString()
      };

      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { 
        devices: {
          [deviceId]: deviceData
        }
      }, { merge: true });

    } catch (error) {
      console.error("Error registering device:", error);
    }
  },

  /**
   * Checks if Passkeys are supported and if the current device has one
   */
  async isPasskeySupported() {
    return window.PublicKeyCredential && 
           await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  },

  /**
   * Registers a Passkey for the current device
   */
  async registerPasskey(userId) {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userID = new TextEncoder().encode(userId);

      const publicKey = {
        challenge,
        rp: { name: "Thoughts Journal", id: window.location.hostname },
        user: {
          id: userID,
          name: auth.currentUser.email || userId,
          displayName: auth.currentUser.displayName || "User"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred"
        },
        timeout: 60000
      };

      const credential = await navigator.credentials.create({ publicKey });
      const deviceId = localStorage.getItem('thoughts_device_id');
      
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        devices: {
          [deviceId]: {
            hasPasskey: true,
            credentialId: credential.id,
            passkeyRegisteredAt: new Date().toISOString()
          }
        }
      }, { merge: true });

      return credential;
    } catch (error) {
      console.error("Passkey registration failed:", error);
      throw error;
    }
  },

  /**
   * Updates the user's streak in the database
   */
  async updateUserStreak(userId, streak) {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { currentStreak: streak, lastStreakUpdate: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error("Error updating streak in DB:", error);
    }
  },

  /**
   * Updates the user's streak goal
   */
  async updateUserStreakGoal(userId, goal) {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { streakGoal: goal }, { merge: true });
    } catch (error) {
      console.error("Error updating streak goal in DB:", error);
    }
  },

  /**
   * Gets additional user data like streak goal
   */
  async getUserData(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }
};
