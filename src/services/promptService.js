import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * DEFAULT_PROMPTS - Initial set of curated prompts
 */
const DEFAULT_PROMPTS = [
  {
    id: 'p1',
    category: 'Self-Discovery',
    text: "What is a boundary you're proud of setting recently?",
    description: "Reflect on how you protected your energy."
  },
  {
    id: 'p2',
    category: 'Gratitude',
    text: "What is something small that made you smile today?",
    description: "Focus on the little joys."
  },
  {
    id: 'p3',
    category: 'Growth',
    text: "What is a mistake you've made that taught you something valuable?",
    description: "Turn failures into lessons."
  },
  {
    id: 'p4',
    category: 'Mindfulness',
    text: "What do you hear, see, and feel in this exact moment?",
    description: "Ground yourself in the present."
  },
  {
    id: 'p5',
    category: 'Introspection',
    text: "If you could talk to your 10-year-old self, what would you say?",
    description: "Reconnect with your inner child."
  },
  {
    id: 'p6',
    category: 'Relationships',
    text: "Who has made a positive impact on your life this week?",
    description: "Acknowledge the people around you."
  },
  {
    id: 'p7',
    category: 'Emotional Clarity',
    text: "What emotion are you feeling most strongly right now, and why?",
    description: "Label your feelings without judgement."
  },
  {
    id: 'p8',
    category: 'Future Self',
    text: "What does your ideal 'perfect day' look like a year from now?",
    description: "Manifest your desires."
  }
];

export const promptService = {
  /**
   * getPrompts - Fetch prompts from Firestore or return defaults
   */
  async getPrompts() {
    try {
      const promptsRef = collection(db, 'prompts');
      const q = query(promptsRef, orderBy('category'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return DEFAULT_PROMPTS;
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.warn("Error fetching prompts from DB, using defaults:", error);
      return DEFAULT_PROMPTS;
    }
  },

  /**
   * getPromptsByCategory - Filter prompts by category
   */
  async getPromptsByCategory(category) {
    const all = await this.getPrompts();
    return all.filter(p => p.category === category);
  },

  /**
   * getCategories - Get unique categories
   */
  async getCategories() {
    const all = await this.getPrompts();
    return [...new Set(all.map(p => p.category))];
  }
};
