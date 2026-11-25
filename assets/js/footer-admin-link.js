import { createEl } from './ui.js';
import { appUrl } from './app-path.js';
import { FIREBASE_CONFIGURED } from './firebase-config.js';
import { observeAuth } from './auth.js';
import { authorizeAdmin } from './access-guard.js';

const slot = document.querySelector('[data-footer-admin-slot]');

if (slot) {
  let link = null;
  let shownUid = null;
  let currentUid = null;

  function hide() {
    if (link) link.remove();
    link = null;
    shownUid = null;
  }

  function show(uid) {
    if (link && shownUid === uid) return;
    hide();
    link = createEl('a', 'footer-admin-link', 'Analítica');
    link.href = appUrl('analitica.html');
    slot.append(link);
    shownUid = uid;
  }

  async function evaluate(user) {
    currentUid = user ? user.uid : null;

    if (!FIREBASE_CONFIGURED || !user) {
      hide();
      return;
    }

    try {
      const authorization = await authorizeAdmin(user);
      if (user.uid !== currentUid) return;
      if (authorization) show(user.uid);
      else hide();
    } catch {
      if (user.uid === currentUid) hide();
    }
  }

  observeAuth(evaluate);
}
