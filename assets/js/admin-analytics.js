import './footer-admin-link.js';
import { collection, getDocs, limit, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { COURSE_ID, FIREBASE_CONFIGURED } from './firebase-config.js';
import { db } from './firebase-init.js';
import { byId, clear, createEl, setAccountLabel, setText } from './ui.js';
import { appUrl, currentNext, goToAccess } from './app-path.js';
import { observeAuth, prepareAuth, signOutGoogle } from './auth.js';
import { authorizeAdmin, watchAuthorization } from './access-guard.js';
import { clearStudentLoginSession } from './login-log.js';
import { isActiveStudent, isPermissionDenied } from './data.js';

const MAX_EVENTS = 500;
const CHART_FALLBACK = 'No se pudo cargar el gráfico. La tabla de frecuencia sigue disponible.';

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
let loginChart = null;

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

function withAlpha(color, alpha) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function renderChartFallback(container) {
  clear(container);
  container.append(createEl('p', 'chart__fallback', CHART_FALLBACK));
}

function renderChart(weeks) {
  const container = byId('login-chart');
  if (!container) return;

  if (loginChart) {
    loginChart.destroy();
    loginChart = null;
  }

  if (typeof Chart === 'undefined') {
    renderChartFallback(container);
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  const clay = styles.getPropertyValue('--clay').trim() || '#9d4327';
  const paper = styles.getPropertyValue('--paper').trim() || '#fbf8f2';
  const inkSoft = styles.getPropertyValue('--ink-3').trim() || '#6b6258';
  const line = styles.getPropertyValue('--line').trim() || 'rgba(23, 19, 15, 0.14)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  clear(container);
  const canvas = createEl('canvas', 'chart__canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Gráfico de ingresos por semana');
  container.append(canvas);

  try {
    loginChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: weeks.map((week) => week.week),
        datasets: [
          {
            label: 'Ingresos',
            data: weeks.map((week) => week.count),
            borderColor: clay,
            backgroundColor: withAlpha(clay, 0.12),
            pointBackgroundColor: clay,
            pointBorderColor: paper,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.25,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: reduceMotion ? 0 : 600 },
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} ingreso(s)`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: inkSoft,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              callback: (value, index) => String(weeks[index]?.week || value).slice(5)
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: line },
            ticks: { color: inkSoft, precision: 0 }
          }
        }
      }
    });
  } catch {
    loginChart = null;
    renderChartFallback(container);
  }
}

function renderAnalytics(student, dates) {
  if (dates.length === 0) {
    if (loginChart) {
      loginChart.destroy();
      loginChart = null;
    }
    clear(byId('login-chart'));
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
    if (loginChart) {
      loginChart.destroy();
      loginChart = null;
    }
    clear(byId('login-chart'));
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
