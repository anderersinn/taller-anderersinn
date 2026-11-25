import './footer-admin-link.js';
import { COURSE_ID, FIREBASE_CONFIGURED } from './firebase-config.js';
import {
  PREVIEW_COURSE,
  PREVIEW_MODULES,
  PREVIEW_WEEKS,
  getPreviewWeek
} from './preview-data.js';
import { renderWeekNav, initNavToggle } from './navigation.js';
import {
  renderCourseSummary,
  renderLiveCourseSummary,
  renderWeekContent,
  renderLiveWeekContent,
  renderUnavailable
} from './course-content.js';
import { appUrl, currentNext, goToAccess } from './app-path.js';
import { byId, clear, setAccountLabel, setText } from './ui.js';
import { observeAuth, prepareAuth, signOutGoogle } from './auth.js';
import { authorizeUser, watchAuthorization } from './access-guard.js';
import { clearStudentLoginSession, recordStudentLogin } from './login-log.js';
import { readCourse, readWeek } from './course-repository.js';
import { isPermissionDenied, isSafeId, normalizeCourse, normalizeWeek } from './data.js';

const params = new URLSearchParams(window.location.search);
const isPreview = params.get('preview') === '1';
const isWeekPage = document.body.dataset.page === 'week';
const requestedWeekId = params.get('semana') || 'semana-1';
const next = currentNext();
const loadingView = byId('loading-view');
const pendingView = byId('pending-view');
const contentView = byId(isWeekPage ? 'week-view' : 'course-view');
const weekNav = byId('week-nav');
const signOutButton = byId('sign-out');

let finished = false;
let authInitialized = false;
let initialUid = null;
let stopRoleWatch = null;
let stopAuthWatch = null;

function showLoading() {
  if (loadingView) loadingView.hidden = false;
  if (pendingView) pendingView.hidden = true;
  if (contentView) contentView.hidden = true;
}

function showContent() {
  if (loadingView) loadingView.hidden = true;
  if (pendingView) pendingView.hidden = true;
  if (contentView) contentView.hidden = false;
}

function clearPrivateContent() {
  clear(byId('course-summary'));
  clear(byId('week-content'));
  clear(weekNav);
  setText('course-title', '');
  setText('course-subtitle', '');
  setText('week-kicker', '');
  setText('week-title', '');
  setText('week-description', '');
}

function stopWatches() {
  if (stopRoleWatch) stopRoleWatch();
  if (stopAuthWatch) stopAuthWatch();
  stopRoleWatch = null;
  stopAuthWatch = null;
}

function redirect(reason) {
  if (finished) return;
  finished = true;
  clearPrivateContent();
  stopWatches();
  goToAccess(reason, next);
}

function handleError(error) {
  redirect(isPermissionDenied(error) ? 'permission' : 'error');
}

function renderPreview() {
  if (loadingView) loadingView.hidden = true;
  if (pendingView) pendingView.hidden = true;
  if (contentView) contentView.hidden = false;

  const activeWeek = isWeekPage ? getPreviewWeek(requestedWeekId) : null;
  const activeWeekId = activeWeek ? activeWeek.id : null;

  renderWeekNav(weekNav, PREVIEW_WEEKS, activeWeekId, true);
  initNavToggle(byId('nav-toggle'), weekNav);

  if (isWeekPage) {
    if (!activeWeek) {
      setText('week-kicker', 'Contenido no disponible');
      setText('week-title', 'No encontramos esta semana');
      setText('week-description', 'Revisa el identificador de la semana o vuelve al curso.');
      renderUnavailable(
        byId('week-content'),
        'La semana solicitada no hace parte de la vista previa pública.',
        'No encontramos esta semana',
        true
      );
    } else {
      setText('week-kicker', `Semana ${activeWeek.number}`);
      setText('week-title', activeWeek.title);
      setText(
        'week-description',
        'Dos momentos de trabajo: la sesión sincrónica y el trabajo asincrónico.'
      );
      document.title = `${activeWeek.title} | Taller virtual Anderer Sinn`;
      renderWeekContent(byId('week-content'), activeWeek, PREVIEW_MODULES);
    }
  } else {
    renderCourseSummary(byId('course-summary'), PREVIEW_COURSE, PREVIEW_WEEKS);
  }
}

function renderCourseUnavailable(message) {
  showContent();
  initNavToggle(byId('nav-toggle'), weekNav);

  if (isWeekPage) {
    setText('week-kicker', 'Contenido no disponible');
    setText('week-title', 'Contenido no disponible');
    setText('week-description', message);
    renderUnavailable(byId('week-content'), message, 'Contenido no disponible');
    return;
  }

  renderUnavailable(byId('course-summary'), message, 'Contenido no disponible');
}

async function loadContent() {
  const courseSnap = await readCourse(COURSE_ID);

  if (!courseSnap.exists()) {
    renderCourseUnavailable('El curso todavía no está publicado.');
    return;
  }

  const course = normalizeCourse(courseSnap.data());
  if (!course) {
    renderCourseUnavailable('El documento del curso no está publicado o no tiene la estructura esperada.');
    return;
  }

  setText('course-title', course.title);
  setText('course-subtitle', course.description || course.subtitle);

  if (!isWeekPage) {
    renderWeekNav(weekNav, course.weeks, null, false);
    showContent();
    initNavToggle(byId('nav-toggle'), weekNav);
    renderLiveCourseSummary(byId('course-summary'), course, course.weeks);
    return;
  }

  const weekId = isSafeId(requestedWeekId) ? requestedWeekId : '';
  const weekMeta = course.weeks.find((week) => week.id === weekId);

  if (!weekMeta) {
    renderWeekNav(weekNav, course.weeks, null, false);
    renderCourseUnavailable('La semana solicitada no está publicada o no existe.');
    return;
  }

  const weekSnap = await readWeek(COURSE_ID, weekMeta.id);
  if (!weekSnap.exists()) {
    renderWeekNav(weekNav, course.weeks, weekMeta.id, false);
    renderCourseUnavailable('La semana solicitada todavía no tiene contenido publicado.');
    return;
  }

  const week = normalizeWeek(weekSnap.data(), weekMeta.id);
  if (!week) {
    renderWeekNav(weekNav, course.weeks, weekMeta.id, false);
    renderCourseUnavailable('El documento de la semana no está publicado o no tiene la estructura esperada.');
    return;
  }

  renderWeekNav(weekNav, course.weeks, weekMeta.id, false);
  showContent();
  initNavToggle(byId('nav-toggle'), weekNav);

  setText('week-kicker', `Semana ${week.number || weekMeta.number}`);
  setText('week-title', week.title);
  setText(
    'week-description',
    week.description || 'Dos momentos de trabajo: la sesión sincrónica y el trabajo asincrónico.'
  );
  document.title = `${week.title} | Taller virtual Anderer Sinn`;
  renderLiveWeekContent(byId('week-content'), week, week.modules);
}

function wireSignOut(uid) {
  if (!signOutButton) return;
  signOutButton.hidden = false;
  signOutButton.addEventListener('click', async () => {
    if (finished) return;
    finished = true;
    clearStudentLoginSession(uid);
    clearPrivateContent();
    stopWatches();
    try {
      await signOutGoogle();
    } finally {
      window.location.assign(appUrl('index.html'));
    }
  });
}

async function initializeForUser(user) {
  const authorization = await authorizeUser(user, COURSE_ID);
  if (!authorization) {
    redirect('permission');
    return;
  }

  setAccountLabel(byId('account-label'), user.email || user.displayName || 'Cuenta Google');
  wireSignOut(user.uid);
  stopRoleWatch = watchAuthorization(authorization, COURSE_ID, redirect);
  if (authorization.kind === 'student') {
    recordStudentLogin(user.uid).catch(() => undefined);
  }
  await loadContent();
}

function startLive() {
  if (!FIREBASE_CONFIGURED) {
    redirect('error');
    return;
  }

  stopAuthWatch = observeAuth(async (user) => {
    if (finished) return;

    if (!authInitialized) {
      authInitialized = true;
      if (!user) {
        redirect('session');
        return;
      }
      initialUid = user.uid;
      try {
        await initializeForUser(user);
      } catch (error) {
        handleError(error);
      }
      return;
    }

    if (!user) {
      redirect('session');
      return;
    }

    if (user.uid !== initialUid) {
      finished = true;
      stopWatches();
      window.location.reload();
    }
  });
}

if (isPreview) {
  renderPreview();
} else {
  showLoading();
  prepareAuth().then(startLive).catch(() => redirect('error'));
}
