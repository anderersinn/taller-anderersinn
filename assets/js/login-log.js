import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { COURSE_ID } from './firebase-config.js';

const SESSION_KEY = `anderersinn:login:${COURSE_ID}:`;

function readSession(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeSession(key) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    return false;
  }
  return true;
}

function clearSession(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    return false;
  }
  return true;
}

export function clearStudentLoginSession(uid) {
  clearSession(`${SESSION_KEY}${uid}`);
}

export async function recordStudentLogin(uid) {
  const key = `${SESSION_KEY}${uid}`;

  if (readSession(key)) return;

  writeSession(key);

  try {
    await addDoc(collection(db, 'students', uid, 'logins'), {
      uid,
      courseId: COURSE_ID,
      at: serverTimestamp()
    });
  } catch (error) {
    clearSession(key);
    throw error;
  }
}
