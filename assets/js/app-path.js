const base = new URL('./', document.baseURI);

export function appUrl(path) {
  return new URL(String(path).replace(/^\.\//, ''), base).href;
}

export function redirectTo(path) {
  window.location.assign(appUrl(path));
}
