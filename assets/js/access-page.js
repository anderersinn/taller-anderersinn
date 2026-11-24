import { appUrl, safeNext } from './app-path.js';
import { byId, clear, createEl, setAccountLabel, setText } from './ui.js';
import {
  getCurrentUser,
  observeAuth,
  prepareAuth,
  signInGoogle,
  signOutGoogle
} from './auth.js';
import { FIREBASE_CONFIGURED } from './firebase-config.js';

const params = new URLSearchParams(window.location.search);
const requestedReason = params.get('reason');
const allowedReasons = ['session', 'permission', 'error'];
const reason = allowedReasons.includes(requestedReason) ? requestedReason : 'session';
const targetUrl = safeNext(params.get('next') || 'curso.html');

const VIEWS = {
  session: {
    kicker: 'Sesión no activa',
    title: 'Inicia sesión para entrar al taller virtual',
    message:
      'Tu sesión no está activa. Inicia sesión con la cuenta de Google que utilizas para el curso.',
    note: 'Usa la misma cuenta Google que emplearás para el curso.'
  },
  permission: {
    kicker: 'Acceso no disponible',
    title: 'No tienes acceso al recurso digital',
    message:
      'No tienes acceso al recurso digital, por favor consulta a tu gestor o gestora del curso.',
    note: 'Si usaste otra cuenta, cierra sesión y vuelve a entrar con la cuenta correcta.'
  },
  error: {
    kicker: 'No fue posible verificar',
    title: 'No pudimos comprobar tu acceso',
    message:
      'No fue posible verificar tu acceso en este momento. Comprueba tu conexión e inténtalo de nuevo.',
    note: 'No se mostrará contenido del curso hasta que la comprobación sea exitosa.'
  }
};

const accountNode = byId('access-account');
const actionsNode = byId('access-actions');
let authFailed = false;

function addAction(label, className, handler, disabled = false) {
  const button = createEl('button', className, label);
  button.type = 'button';
  button.disabled = disabled;
  if (handler) button.addEventListener('click', handler);
  actionsNode.append(button);
}

function retry() {
  window.location.assign(targetUrl);
}

async function logout() {
  try {
    await signOutGoogle();
  } finally {
    window.location.assign(appUrl('index.html'));
  }
}

async function signIn() {
  try {
    await signInGoogle();
    if (getCurrentUser()) {
      window.location.assign(targetUrl);
    }
  } catch {
    authFailed = true;
    render(getCurrentUser());
  }
}

function render(user) {
  const currentReason = authFailed ? 'error' : reason;
  const view = VIEWS[currentReason];

  setText('access-kicker', view.kicker);
  setText('access-title', view.title);
  setText('access-message', view.message);
  setText('access-note', view.note);
  setAccountLabel(accountNode, user ? user.email || user.displayName || 'Cuenta Google' : '');

  clear(actionsNode);

  if (!FIREBASE_CONFIGURED) {
    addAction('Configuración pendiente', 'btn btn--dark btn--large', null, true);
    setText('access-note', 'Falta completar la configuración pública de Firebase.');
    return;
  }

  if (currentReason === 'session' && !user) {
    addAction('Continuar con Google', 'btn btn--clay btn--large', signIn);
    return;
  }

  if (currentReason === 'session') {
    addAction('Volver a intentar', 'btn btn--dark btn--large', retry);
    addAction('Cerrar sesión', 'btn btn--outline btn--large', logout);
    setText('access-note', 'Ya hay una sesión activa. Puedes reintentar la validación.');
    return;
  }

  if (user) {
    addAction('Cerrar sesión', 'btn btn--outline btn--large', logout);
    addAction('Volver a intentar', 'btn btn--dark btn--large', retry);
  } else {
    addAction('Continuar con Google', 'btn btn--clay btn--large', signIn);
    addAction('Volver a intentar', 'btn btn--outline btn--large', retry);
  }
}

prepareAuth()
  .catch(() => {
    authFailed = true;
  })
  .finally(() => {
    observeAuth(render);
    render(getCurrentUser());
  });
