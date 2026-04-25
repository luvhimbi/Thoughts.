import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import affirmationsData from '../data/affirmations.json';

const COLLECTION_NAME = 'affirmations';

export const affirmationService = {
  // Seeder to populate the DB
  seedAffirmations: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log("Affirmations already seeded.");
        return { success: true, message: "Already seeded" };
      }

      console.log("Seeding affirmations...");
      for (const item of affirmationsData) {
        await addDoc(collection(db, COLLECTION_NAME), {
          text: item.text,
          author: item.author || "Anonymous",
          createdAt: new Date()
        });
      }
      
      console.log("Seeding complete.");
      return { success: true, message: "Seeding complete" };
    } catch (error) {
      console.error("Error seeding affirmations:", error);
      return { success: false, error };
    }
  },

  // Get affirmation for today
  getDailyAffirmation: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allAffirmations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (allAffirmations.length === 0) return null;

      // Select affirmation based on day of the year to ensure it's the same for all users on a given day
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const index = dayOfYear % allAffirmations.length;
      return allAffirmations[index];
    } catch (error) {
      console.error("Error fetching daily affirmation:", error);
      return null;
    }
  }
};
