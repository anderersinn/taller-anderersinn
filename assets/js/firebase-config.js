export const firebaseConfig = {
  apiKey: 'AIzaSyC05mEUhZ3kz2ksZqyv1WR8VdhzR4A42Gc',
  authDomain: 'taller-anderersinn.firebaseapp.com',
  projectId: 'taller-anderersinn',
  storageBucket: 'taller-anderersinn.firebasestorage.app',
  messagingSenderId: '328529235229',
  appId: '1:328529235229:web:172e9b11b43a65bc4f65f4'
};

export const COURSE_ID = 'sprint-diseno-producto-tech';

export const FIREBASE_CONFIGURED = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0 && !value.startsWith('REEMPLAZAR')
);
