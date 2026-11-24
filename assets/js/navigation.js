import { appUrl } from './app-path.js';
import { clear, createEl } from './ui.js';

function padNumber(number) {
  return String(number).padStart(2, '0');
}

function weekUrl(week, preview) {
  const query = `?semana=${encodeURIComponent(week.id)}${preview ? '&preview=1' : ''}`;
  return `${appUrl('semana.html')}${query}`;
}

export function renderWeekNav(container, weeks, activeWeekId, preview = false) {
  if (!container) return;
  clear(container);

  const list = createEl('ul', 'week-nav__list');
  const published = weeks.filter(
    (week) => week && week.published !== false && typeof week.id === 'string'
  );

  published.forEach((week) => {
    const item = createEl('li', 'week-nav__item');
    const link = createEl('a', 'week-nav__link');
    link.href = weekUrl(week, preview);

    if (week.id === activeWeekId) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }

    link.append(createEl('span', 'week-nav__number', padNumber(week.number)));

    const label = createEl('span', 'week-nav__label');
    label.append(createEl('small', 'week-nav__kicker', `Semana ${week.number}`));
    label.append(createEl('strong', '', week.title || 'Semana'));
    link.append(label);

    item.append(link);
    list.append(item);
  });

  container.append(list);
}

export function initNavToggle(button, target) {
  if (!button || !target) return;

  const close = () => {
    button.setAttribute('aria-expanded', 'false');
    target.classList.remove('is-open');
  };

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    target.classList.toggle('is-open', !expanded);
  });

  target.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      close();
    }
  });
}
