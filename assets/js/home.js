import { appUrl } from './app-path.js';
import { FIREBASE_CONFIGURED } from './firebase-config.js';
import { getCurrentUser, observeAuth, prepareAuth, signInGoogle } from './auth.js';

const button = byId('sign-in');
const note = byId('home-auth-note');
let user = null;

function byId(id) {
  return document.getElementById(id);
}

function render() {
  if (!button) return;
  button.textContent = user ? 'Entrar al taller virtual' : 'Continuar con Google';
  button.disabled = !FIREBASE_CONFIGURED;
  if (note) {
    note.textContent = FIREBASE_CONFIGURED
      ? 'Usa la cuenta Google autorizada para el curso.'
      : 'Falta completar la configuración pública de Firebase.';
  }
}

if (button) {
  button.addEventListener('click', async () => {
    if (user) {
      window.location.assign(appUrl('curso.html'));
      return;
    }

    button.disabled = true;
    try {
      await signInGoogle();
      if (getCurrentUser()) {
        window.location.assign(appUrl('curso.html'));
      }
    } catch {
      if (note) {
        note.textContent = 'No fue posible iniciar sesión. Comprueba tu conexión e inténtalo de nuevo.';
      }
      render();
    }
  });
}

render();

prepareAuth()
  .catch(() => {
    if (note) {
      note.textContent = 'No fue posible completar el ingreso. Vuelve a intentarlo.';
    }
  })
  .finally(() => {
    observeAuth((nextUser) => {
      user = nextUser;
      render();
    });
  });
