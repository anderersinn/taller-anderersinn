export const firebaseConfig = {
  apiKey: 'REEMPLAZAR_API_KEY',
  authDomain: 'REEMPLAZAR_PROJECT_ID.firebaseapp.com',
  projectId: 'REEMPLAZAR_PROJECT_ID',
  storageBucket: 'REEMPLAZAR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'REEMPLAZAR_SENDER_ID',
  appId: 'REEMPLAZAR_APP_ID'
};

export const COURSE_ID = 'sprint-diseno-producto-tech';

export const FIREBASE_CONFIGURED = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0 && !value.startsWith('REEMPLAZAR')
);
