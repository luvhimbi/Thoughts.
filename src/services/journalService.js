import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

// In-memory cache to reduce reads
let _entriesCache = null;
let _lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const journalService = {
  /**
   * Saves a new journal entry for a user
   * @param {string} userId - The user's UID
   * @param {string} content - The thought content
   * @param {Object} options - Metadata like isEncrypted
   */
  async saveEntry(userId, content, mood = null, design = 'minimal') {
    try {
      const docRef = await addDoc(collection(db, "entries"), {
        userId,
        content,
        mood,
        design,
        createdAt: serverTimestamp(),
        dateString: new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      });
      const docId = docRef.id;
      
      // Update cache
      if (_entriesCache) {
        const newEntry = {
          id: docId,
          userId,
          content,
          mood,
          design,
          createdAt: { toMillis: () => Date.now(), toDate: () => new Date() },
          dateString: new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })
        };
        _entriesCache = [newEntry, ..._entriesCache];
      }

      return docId;
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  },

  /**
   * Fetches all entries for a specific user
   * @param {string} userId - The user's UID
   */
  async getEntries(userId, forceRefresh = false) {
    try {
      // Return cached data if valid and not forced refresh
      if (!forceRefresh && _entriesCache && _lastFetchTime && (Date.now() - _lastFetchTime < CACHE_DURATION)) {
        return _entriesCache;
      }

      const q = query(
        collection(db, "entries"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const entries = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        entries.push({ 
          id: doc.id, 
          ...data
        });
      }
      
      // Client-side sorting
      const sortedEntries = entries.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeB - timeA;
      });

      // Update cache
      _entriesCache = sortedEntries;
      _lastFetchTime = Date.now();

      return sortedEntries;
    } catch (error) {
      console.error("Error fetching entries:", error);
      throw error;
    }
  },

  /**
   * Fetches a single entry by ID
   * @param {string} entryId - The document ID
   */
  async getEntry(entryId) {
    try {
      const docRef = doc(db, "entries", entryId);
      const { getDoc } = await import("firebase/firestore");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return { 
          id: snap.id, 
          ...data
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching entry:", error);
      throw error;
    }
  },

  /**
   * Deletes a journal entry
   * @param {string} entryId - The document ID
   */
  async deleteEntry(entryId) {
    try {
      await deleteDoc(doc(db, "entries", entryId));
      
      // Update cache
      if (_entriesCache) {
        _entriesCache = _entriesCache.filter(e => e.id !== entryId);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },

  /**
   * Updates an existing journal entry
   * @param {string} entryId - The document ID
   * @param {string} content - The updated content
   * @param {boolean} isEncrypted - Whether the update should be encrypted
   */
  async updateEntry(entryId, content, mood = null, design = null) {
    try {
      const { updateDoc } = await import("firebase/firestore");
      const docRef = doc(db, "entries", entryId);
      const updateData = {
        content: content,
        updatedAt: serverTimestamp()
      };
      if (mood !== undefined) {
        updateData.mood = mood;
      }
      if (design) {
        updateData.design = design;
      }
      await updateDoc(docRef, updateData);

      // Update cache
      if (_entriesCache) {
        _entriesCache = _entriesCache.map(e => 
          e.id === entryId ? { ...e, ...updateData, updatedAt: { toMillis: () => Date.now() } } : e
        );
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    }
  },

  /**
   * Deletes all entries for a specific user
   * @param {string} userId - The user's UID
   */
  async deleteAllEntries(userId) {
    try {
      const q = query(
        collection(db, "entries"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);

      // Clear cache
      _entriesCache = [];
      _lastFetchTime = Date.now();
    } catch (error) {
      console.error("Error deleting all entries:", error);
      throw error;
    }
  },

  /**
   * Returns currently cached entries without fetching
   */
  getCachedEntries() {
    return _entriesCache;
  },

  /**
   * Clears the entries cache manually
   */
  clearCache() {
    _entriesCache = null;
    _lastFetchTime = null;
  }
};
