import { byId, clear, createEl, setText } from './ui.js';

const params = new URLSearchParams(window.location.search);
const requestedReason = params.get('reason');
const allowedReasons = ['session', 'permission', 'error'];
const reason = allowedReasons.includes(requestedReason) ? requestedReason : 'session';

const content = {
  session: {
    kicker: 'Sesión no activa',
    title: 'Inicia sesión para entrar al aula',
    message:
      'Tu sesión no está activa. Inicia sesión con la cuenta de Google que utilizas para el curso.',
    account: '',
    actions: [{ label: 'Continuar con Google', className: 'btn btn--clay btn--large' }]
  },
  permission: {
    kicker: 'Acceso no disponible',
    title: 'No tienes acceso al recurso digital',
    message:
      'No tienes acceso al recurso digital, por favor consulta a tu gestor o gestora del curso.',
    account: 'La cuenta utilizada se mostrará cuando Firebase esté configurado.',
    actions: [
      { label: 'Cerrar sesión', className: 'btn btn--outline btn--large' },
      { label: 'Volver a intentar', className: 'btn btn--dark btn--large' }
    ]
  },
  error: {
    kicker: 'No fue posible verificar',
    title: 'No pudimos comprobar tu acceso',
    message:
      'No fue posible verificar tu acceso en este momento. Comprueba tu conexión e inténtalo de nuevo.',
    account: '',
    actions: [{ label: 'Reintentar validación', className: 'btn btn--dark btn--large' }]
  }
};

const view = content[reason];
const accountNode = byId('access-account');
const actionsNode = byId('access-actions');

setText('access-kicker', view.kicker);
setText('access-title', view.title);
setText('access-message', view.message);
setText('access-account', view.account);
accountNode.hidden = !view.account;

clear(actionsNode);
view.actions.forEach((action) => {
  const button = createEl('button', action.className, action.label);
  button.type = 'button';
  button.disabled = true;
  actionsNode.append(button);
});

setText(
  'access-note',
  'Las acciones se habilitarán al completar la configuración de Firebase.'
);
