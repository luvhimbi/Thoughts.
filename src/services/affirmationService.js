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
    const CACHE_KEY = 'thoughts_daily_affirmation';
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Try to get from cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { date, affirmation } = JSON.parse(cached);
        if (date === today) {
          return affirmation;
        }
      }
    } catch (e) {
      console.error("Cache read failed:", e);
    }

    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allAffirmations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (allAffirmations.length === 0) return null;

      // Select affirmation based on day of the year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const index = dayOfYear % allAffirmations.length;
      const dailyAffirmation = allAffirmations[index];

      // Save to cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          date: today,
          affirmation: dailyAffirmation
        }));
      } catch (e) {
        console.error("Cache write failed:", e);
      }

      return dailyAffirmation;
    } catch (error) {
      console.error("Error fetching daily affirmation:", error);
      return null;
    }
  }
};
