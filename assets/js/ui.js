export function byId(id) {
  return document.getElementById(id);
}

export function createEl(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

export function clear(node) {
  if (!node) return;
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function setText(id, text) {
  const node = byId(id);
  if (node) {
    node.textContent = text;
  }
}
