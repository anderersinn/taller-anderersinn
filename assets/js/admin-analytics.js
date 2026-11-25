import { collection, getDocs, limit, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { COURSE_ID, FIREBASE_CONFIGURED } from './firebase-config.js';
import { db } from './firebase-init.js';
import { byId, clear, createEl, setAccountLabel, setText } from './ui.js';
import { appUrl, currentNext, goToAccess } from './app-path.js';
import { observeAuth, prepareAuth, signOutGoogle } from './auth.js';
import { authorizeAdmin, watchAuthorization } from './access-guard.js';
import { clearStudentLoginSession } from './login-log.js';
import { isActiveStudent, isPermissionDenied } from './data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_EVENTS = 500;

const loadingView = byId('loading-view');
const adminView = byId('admin-view');
const contentView = byId('analytics-content');
const stateView = byId('analytics-state');
const studentSelect = byId('student-select');
const signOutButton = byId('sign-out');

let finished = false;
let authInitialized = false;
let initialUid = null;
let stopAdminWatch = null;
let stopAuthWatch = null;
let students = [];

function showLoading() {
  loadingView.hidden = false;
  adminView.hidden = true;
}

function showAdmin() {
  loadingView.hidden = true;
  adminView.hidden = false;
}

function showContent() {
  stateView.hidden = true;
  contentView.hidden = false;
}

function setState(kicker, title, message) {
  stateView.hidden = false;
  contentView.hidden = true;
  setText('analytics-state-kicker', kicker);
  setText('analytics-state-title', title);
  setText('analytics-state-message', message);
}

function stopWatches() {
  if (stopAdminWatch) stopAdminWatch();
  if (stopAuthWatch) stopAuthWatch();
  stopAdminWatch = null;
  stopAuthWatch = null;
}

function redirect(reason) {
  if (finished) return;
  finished = true;
  stopWatches();
  goToAccess(reason, currentNext());
}

function handleError(error) {
  redirect(isPermissionDenied(error) ? 'permission' : 'error');
}

function wireSignOut(uid) {
  if (!signOutButton) return;
  signOutButton.hidden = false;
  signOutButton.addEventListener('click', async () => {
    if (finished) return;
    finished = true;
    clearStudentLoginSession(uid);
    stopWatches();
    try {
      await signOutGoogle();
    } finally {
      window.location.assign(appUrl('index.html'));
    }
  });
}

function studentLabel(student) {
  if (student.displayName && student.email) {
    return `${student.displayName} · ${student.email}`;
  }
  return student.displayName || student.email || student.uid;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function isoWeek(date) {
  const local = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((local - yearStart) / 86400000) + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function groupByWeek(dates) {
  const counts = new Map();

  dates.forEach((date) => {
    const week = isoWeek(date);
    counts.set(week, (counts.get(week) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function renderStudentOptions() {
  clear(studentSelect);

  students.forEach((student) => {
    const option = createEl('option');
    option.value = student.uid;
    option.textContent = studentLabel(student);
    studentSelect.append(option);
  });
}

function renderStat(label, value) {
  const card = createEl('article', 'analytics-stat');
  card.append(createEl('span', '', label));
  card.append(createEl('strong', '', value));
  return card;
}

function renderSummary(student, dates, weeks) {
  const summary = byId('analytics-summary');
  clear(summary);

  summary.append(renderStat('Estudiante', studentLabel(student)));
  summary.append(renderStat('Ingresos registrados', String(dates.length)));
  summary.append(renderStat('Último ingreso', formatDateTime(dates[0])));
  summary.append(renderStat('Semanas con ingresos', String(weeks.length)));
}

function renderTable(weeks) {
  const container = byId('week-table');
  clear(container);

  const table = createEl('table', 'analytics-table');
  table.append(createEl('caption', 'analytics-table__caption', 'Ingresos por semana (ISO)'));

  const head = createEl('thead');
  const headRow = createEl('tr');
  headRow.append(createEl('th', '', 'Semana'));
  headRow.append(createEl('th', '', 'Ingresos'));
  head.append(headRow);
  table.append(head);

  const body = createEl('tbody');
  weeks.forEach((week) => {
    const row = createEl('tr');
    row.append(createEl('td', '', week.week));
    row.append(createEl('td', '', String(week.count)));
    body.append(row);
  });
  table.append(body);

  container.append(table);
}

function svgEl(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
}

function renderChart(weeks) {
  const container = byId('login-chart');
  clear(container);

  const width = 640;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 46, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const step = Math.max(1, Math.ceil(Math.max(...weeks.map((week) => week.count)) / 4));
  const top = step * 4;

  const xFor = (index) =>
    weeks.length === 1
      ? padding.left + innerWidth / 2
      : padding.left + (index * innerWidth) / (weeks.length - 1);
  const yFor = (value) => padding.top + innerHeight - (value / top) * innerHeight;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Gráfico de ingresos por semana'
  });
  const title = svgEl('title', {});
  title.textContent = 'Ingresos por semana';
  svg.append(title);

  for (let tick = 0; tick <= 4; tick += 1) {
    const value = step * tick;
    const y = yFor(value);
    svg.append(
      svgEl('line', {
        x1: padding.left,
        y1: y,
        x2: width - padding.right,
        y2: y,
        class: 'chart__grid'
      })
    );
    const label = svgEl('text', {
      x: padding.left - 10,
      y: y + 4,
      'text-anchor': 'end',
      class: 'chart__label'
    });
    label.textContent = String(value);
    svg.append(label);
  }

  const path = weeks
    .map((week, index) => `${index === 0 ? 'M' : 'L'}${xFor(index)} ${yFor(week.count)}`)
    .join(' ');
  svg.append(svgEl('path', { d: path, class: 'chart__line' }));

  const labelEvery = Math.max(1, Math.ceil(weeks.length / 8));
  const shownLabels = new Set();

  weeks.forEach((week, index) => {
    const dot = svgEl('circle', {
      cx: xFor(index),
      cy: yFor(week.count),
      r: 4,
      class: 'chart__dot'
    });
    const tooltip = svgEl('title', {});
    tooltip.textContent = `${week.week}: ${week.count}`;
    dot.append(tooltip);
    svg.append(dot);

    const isLast = index === weeks.length - 1;
    if (index % labelEvery !== 0 && !isLast) return;
    if (isLast && shownLabels.has(index)) return;
    shownLabels.add(index);

    const label = svgEl('text', {
      x: xFor(index),
      y: height - padding.bottom + 20,
      'text-anchor': 'middle',
      class: 'chart__label'
    });
    label.textContent = week.week.slice(5);
    svg.append(label);
  });

  container.append(svg);
}

function renderAnalytics(student, dates) {
  if (dates.length === 0) {
    setState(
      'Sin ingresos',
      'No hay ingresos registrados',
      `${studentLabel(student)} todavía no tiene ingresos registrados en este curso.`
    );
    return;
  }

  const weeks = groupByWeek(dates);
  showContent();
  renderSummary(student, dates, weeks);
  renderTable(weeks);
  renderChart(weeks);
}

async function loadForStudent(uid) {
  const student = students.find((item) => item.uid === uid);
  if (!student || finished) return;

  setState('Consultando datos', 'Cargando ingresos', 'Estamos leyendo los registros de este estudiante.');

  const eventsQuery = query(
    collection(db, 'students', uid, 'logins'),
    orderBy('at', 'desc'),
    limit(MAX_EVENTS)
  );
  const snapshot = await getDocs(eventsQuery);
  if (finished) return;

  const dates = snapshot.docs
    .map((entry) => entry.data())
    .filter((data) => data && data.courseId === COURSE_ID && data.at && typeof data.at.toDate === 'function')
    .map((data) => data.at.toDate());

  renderAnalytics(student, dates);
}

async function loadStudents() {
  const snapshot = await getDocs(collection(db, 'students'));
  if (finished) return;

  students = snapshot.docs
    .map((entry) => ({ uid: entry.id, ...entry.data() }))
    .filter((student) => isActiveStudent(student, COURSE_ID))
    .sort((a, b) => studentLabel(a).localeCompare(studentLabel(b), 'es'));

  renderStudentOptions();

  if (students.length === 0) {
    studentSelect.disabled = true;
    setState(
      'Sin estudiantes',
      'No hay estudiantes activos',
      'Todavía no hay estudiantes activos matriculados en este curso.'
    );
    return;
  }

  studentSelect.disabled = false;
  await loadForStudent(studentSelect.value);
}

async function initializeForAdmin(user) {
  const authorization = await authorizeAdmin(user);
  if (!authorization) {
    redirect('permission');
    return;
  }

  setAccountLabel(byId('account-label'), user.email || user.displayName || 'Cuenta Google');
  wireSignOut(user.uid);
  stopAdminWatch = watchAuthorization(authorization, COURSE_ID, redirect);
  showAdmin();
  await loadStudents();
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
        await initializeForAdmin(user);
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

studentSelect.addEventListener('change', () => {
  if (finished) return;
  loadForStudent(studentSelect.value).catch(handleError);
});

showLoading();
prepareAuth().then(startLive).catch(() => redirect('error'));
