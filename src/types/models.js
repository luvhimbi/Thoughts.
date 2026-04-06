/**
 * @typedef {Object} User
 * @property {string} uid - Unique Firebase User ID
 * @property {string|null} displayName - Full name
 * @property {string|null} email - Email address
 * @property {string|null} photoURL - Profile picture
 */

/**
 * @typedef {Object} JournalEntry
 * @property {string} id - Unique entry ID
 * @property {string} uid - Owner's user ID
 * @property {string} content - Rich text content
 * @property {number} createdAt - Timestamp
 */

/**
 * @typedef {Object} AuthService
 * @property {function(): Promise<User>} loginWithGoogle - Signs in with Google
 * @property {function(): Promise<void>} logout - Signs out the user
 */

export const Models = {}; // Export empty object for reference
