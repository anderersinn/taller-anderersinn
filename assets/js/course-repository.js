import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { isSafeId } from './data.js';

function requireSafeId(value) {
  if (!isSafeId(value)) {
    throw new Error('Identificador no válido');
  }
  return value;
}

export function courseRef(courseId) {
  return doc(db, 'courses', requireSafeId(courseId));
}

export function weekRef(courseId, weekId) {
  return doc(db, 'courses', requireSafeId(courseId), 'weeks', requireSafeId(weekId));
}

export function readCourse(courseId) {
  return getDoc(courseRef(courseId));
}

export function readWeek(courseId, weekId) {
  return getDoc(weekRef(courseId, weekId));
}
