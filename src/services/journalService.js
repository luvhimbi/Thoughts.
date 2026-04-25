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
      return docRef.id;
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  },

  /**
   * Fetches all entries for a specific user
   * @param {string} userId - The user's UID
   */
  async getEntries(userId) {
    try {
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
      
      // Client-side sorting by createdAt (or local fallback)
      return entries.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeB - timeA;
      });
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
    } catch (error) {
      console.error("Error deleting all entries:", error);
      throw error;
    }
  }
};
