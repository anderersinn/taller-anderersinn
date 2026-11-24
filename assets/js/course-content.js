import { appUrl } from './app-path.js';
import { clear, createEl } from './ui.js';

const EMPTY_NOTE = 'Los materiales se publicarán desde Firestore cuando el aula esté configurada.';

function previewWeekUrl(week) {
  return `${appUrl('semana.html')}?semana=${encodeURIComponent(week.id)}&preview=1`;
}

function previewNotice() {
  const note = createEl('div', 'notice notice--preview');
  note.append(createEl('strong', '', 'Vista previa estática'));
  note.append(
    createEl(
      'span',
      '',
      'Esta vista usa títulos públicos y no contiene enlaces, correos ni materiales privados.'
    )
  );
  return note;
}

export function renderCourseSummary(container, course, weeks) {
  if (!container) return;
  clear(container);
  container.append(previewNotice());

  const intro = createEl('div', 'course-summary__intro');
  intro.append(createEl('p', 'eyebrow', 'Aula virtual'));
  intro.append(createEl('h2', '', course.title));
  intro.append(createEl('p', 'course-summary__lede', course.description));
  container.append(intro);

  const grid = createEl('div', 'week-grid');
  weeks
    .filter((week) => week && week.published !== false)
    .forEach((week) => {
      const card = createEl('a', 'week-card');
      card.href = previewWeekUrl(week);
      card.append(createEl('span', 'week-card__number', String(week.number).padStart(2, '0')));
      const body = createEl('span', 'week-card__body');
      body.append(createEl('small', 'week-card__kicker', `Semana ${week.number}`));
      body.append(createEl('strong', '', week.title));
      body.append(createEl('span', 'week-card__cue', 'Abrir semana →'));
      card.append(body);
      grid.append(card);
    });
  container.append(grid);
}

export function renderWeekContent(container, week, modules) {
  if (!container) return;
  clear(container);
  container.dataset.weekId = week.id;
  container.append(previewNotice());

  const grid = createEl('div', 'module-grid');
  modules.forEach((module, index) => {
    const article = createEl('article', 'module-card');
    article.append(createEl('span', 'module-card__index', String(index + 1).padStart(2, '0')));

    const heading = createEl('div', 'module-card__heading');
    heading.append(createEl('h2', '', module.title));
    heading.append(createEl('p', '', module.description || ''));
    article.append(heading);

    const empty = createEl('div', 'empty-resource');
    empty.append(createEl('strong', '', 'Contenido pendiente de publicación'));
    empty.append(createEl('span', '', EMPTY_NOTE));
    article.append(empty);

    grid.append(article);
  });
  container.append(grid);
}

export function renderUnavailable(container, message) {
  if (!container) return;
  clear(container);
  const panel = createEl('div', 'state-panel state-panel--inline');
  panel.append(createEl('p', 'eyebrow', 'Contenido no disponible'));
  panel.append(createEl('h2', '', 'No encontramos esta semana'));
  panel.append(createEl('p', '', message));
  const link = createEl('a', 'btn btn--outline', 'Volver al curso');
  link.href = appUrl('curso.html?preview=1');
  panel.append(link);
  container.append(panel);
}
