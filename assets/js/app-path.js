const base = new URL('./', document.baseURI);

export function appUrl(path) {
  return new URL(String(path).replace(/^\.\//, ''), base).href;
}

export function redirectTo(path) {
  window.location.assign(appUrl(path));
}

export function currentNext() {
  const file = window.location.pathname.split('/').pop() || 'curso.html';
  return `${file}${window.location.search}`;
}

export function safeNext(value) {
  const cleaned = String(value || '').replace(/^\?/, '');
  if (!/^[A-Za-z0-9._?=&%-]+$/.test(cleaned)) {
    return appUrl('curso.html');
  }
  return appUrl(cleaned);
}

export function goToAccess(reason, next = currentNext()) {
  const url = new URL(appUrl('acceso-no-disponible.html'));
  url.searchParams.set('reason', reason);
  if (next) {
    url.searchParams.set('next', next);
  }
  window.location.assign(url.href);
}
