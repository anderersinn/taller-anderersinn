import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, googleProvider } from './firebase-init.js';
import { FIREBASE_CONFIGURED } from './firebase-config.js';

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment'
]);

export function getCurrentUser() {
  return auth.currentUser;
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function prepareAuth() {
  if (!FIREBASE_CONFIGURED) return null;
  return getRedirectResult(auth);
}

export async function signInGoogle() {
  if (!FIREBASE_CONFIGURED) return;

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (POPUP_FALLBACK_CODES.has(error && error.code)) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw error;
  }
}

export async function signOutGoogle() {
  await signOut(auth);
}
