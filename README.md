# Thoughts.

A premium, offline-first journaling application designed with emotional intelligence and privacy in mind.

## Features

- **Rich Text Editor**: Express yourself freely with deep personalization and crystal-clear formatting.
- **Offline First (PWA)**: Installable Progressive Web App. Write journal entries even without internet access.
- **Privacy & Encryption**: End-to-end encryption ensuring your thoughts remain securely yours.
- **Anonymous Mode & Magic Links**: Experience the app immediately with guest access and passwordless logins.
- **Mood Tracking & Insights**: Emotional aura animations corresponding to your journal entries that provide visceral feedback.
- **Web Push Notifications**: Stay updated with timely in-app events and gentle reminders.

## Tech Stack

- **Frontend**: React and Vite
- **Styling**: Vanilla CSS (focused on high-end glassmorphic visuals and emotional design)
- **Backend/BaaS**: Firebase (Authentication & Firestore with modern persistent offline cache)
- **Service Workers**: For robust PWA integration and Offline-First UX

## Getting Started

1. **Clone the repository.**
2. **Install dependencies**: 
   ```bash
   npm install
   ```
3. **Setup Environment Variables**:
   Create a `.env` file in the root of the project with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
4. **Run the development server**: 
   ```bash
   npm run dev
   ```

## Production Build

To bundle the application for production:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```
