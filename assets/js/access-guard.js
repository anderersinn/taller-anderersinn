import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { isActiveAdmin, isActiveStudent, isPermissionDenied } from './data.js';

export async function authorizeUser(user, courseId) {
  const studentRef = doc(db, 'students', user.uid);
  const studentSnap = await getDoc(studentRef);

  if (studentSnap.exists() && isActiveStudent(studentSnap.data(), courseId)) {
    return { kind: 'student', uid: user.uid, ref: studentRef, data: studentSnap.data() };
  }

  const adminRef = doc(db, 'admins', user.uid);
  const adminSnap = await getDoc(adminRef);

  if (adminSnap.exists() && isActiveAdmin(adminSnap.data())) {
    return { kind: 'admin', uid: user.uid, ref: adminRef, data: adminSnap.data() };
  }

  return null;
}

export function watchAuthorization(authorization, courseId, onLost) {
  return onSnapshot(
    authorization.ref,
    (snapshot) => {
      const data = snapshot.data();
      const stillValid =
        authorization.kind === 'student'
          ? isActiveStudent(data, courseId)
          : isActiveAdmin(data);

      if (!snapshot.exists() || !stillValid) {
        onLost('permission');
      }
    },
    (error) => {
      onLost(isPermissionDenied(error) ? 'permission' : 'error');
    }
  );
}
