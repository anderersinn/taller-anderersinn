import { appUrl } from './app-path.js';
import { clear, createEl } from './ui.js';
import { isEmbedUrl } from './data.js';

const EMPTY_NOTE = 'Los materiales se publicarán desde Firestore cuando el aula esté configurada.';
const TYPE_LABELS = {
  video: 'Video',
  document: 'Documento',
  form: 'Quiz',
  link: 'Enlace'
};

function buildWeekUrl(week, preview) {
  const query = `?semana=${encodeURIComponent(week.id)}${preview ? '&preview=1' : ''}`;
  return `${appUrl('semana.html')}${query}`;
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

function renderWeekGrid(container, weeks, preview) {
  const grid = createEl('div', 'week-grid');
  weeks
    .filter((week) => week && week.published !== false)
    .forEach((week) => {
      const card = createEl('a', 'week-card');
      card.href = buildWeekUrl(week, preview);
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

function renderResource(resource) {
  const card = createEl('article', 'resource-card');
  card.dataset.resourceId = resource.id;

  const head = createEl('div', 'resource-card__head');
  head.append(createEl('span', 'resource-card__type', TYPE_LABELS[resource.type] || 'Recurso'));
  head.append(createEl('h3', '', resource.title));
  if (resource.description) {
    head.append(createEl('p', '', resource.description));
  }
  card.append(head);

  const link = createEl('a', 'btn btn--outline resource-card__link', 'Abrir recurso');
  link.href = resource.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  card.append(link);

  if (isEmbedUrl(resource.embedUrl)) {
    const embed = createEl('div', 'resource-card__embed');
    const frame = createEl('iframe', 'resource-card__frame');
    frame.src = resource.embedUrl;
    frame.title = `Vista previa: ${resource.title}`;
    frame.loading = 'lazy';
    frame.allow = 'autoplay; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    embed.append(frame);
    card.append(embed);
  }

  return card;
}

function renderEmptyResource() {
  const empty = createEl('div', 'empty-resource');
  empty.append(createEl('strong', '', 'Contenido pendiente de publicación'));
  empty.append(createEl('span', '', EMPTY_NOTE));
  return empty;
}

function renderModules(container, weekId, modules, live) {
  const grid = createEl('div', 'module-grid');

  modules.forEach((module, index) => {
    const article = createEl('article', 'module-card');
    article.dataset.moduleId = module.id;
    article.append(createEl('span', 'module-card__index', String(index + 1).padStart(2, '0')));

    const heading = createEl('div', 'module-card__heading');
    heading.append(createEl('h2', '', module.title));
    article.append(heading);

    if (live && Array.isArray(module.resources) && module.resources.length > 0) {
      const list = createEl('div', 'resource-list');
      module.resources.forEach((resource) => list.append(renderResource(resource)));
      article.append(list);
    } else if (live) {
      article.append(renderEmptyResource());
    } else {
      if (module.description) {
        heading.append(createEl('p', '', module.description));
      }
      article.append(renderEmptyResource());
    }

    grid.append(article);
  });

  container.append(grid);
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

  renderWeekGrid(container, weeks, true);
}

export function renderLiveCourseSummary(container, course, weeks) {
  if (!container) return;
  clear(container);

  const intro = createEl('div', 'course-summary__intro');
  intro.append(createEl('p', 'eyebrow', 'Aula virtual'));
  intro.append(createEl('h2', '', course.title));
  if (course.description) {
    intro.append(createEl('p', 'course-summary__lede', course.description));
  }
  container.append(intro);

  renderWeekGrid(container, weeks, false);
}

export function renderWeekContent(container, week, modules) {
  if (!container) return;
  clear(container);
  container.dataset.weekId = week.id;
  container.append(previewNotice());
  renderModules(container, week.id, modules, false);
}

export function renderLiveWeekContent(container, week, modules) {
  if (!container) return;
  clear(container);
  container.dataset.weekId = week.id;
  renderModules(container, week.id, modules, true);
}

export function renderUnavailable(container, message, title = 'No encontramos esta semana', preview = false) {
  if (!container) return;
  clear(container);
  const panel = createEl('div', 'state-panel state-panel--inline');
  panel.append(createEl('p', 'eyebrow', 'Contenido no disponible'));
  panel.append(createEl('h2', '', title));
  panel.append(createEl('p', '', message));
  const link = createEl('a', 'btn btn--outline', 'Volver al curso');
  link.href = preview ? appUrl('curso.html?preview=1') : appUrl('curso.html');
  panel.append(link);
  container.append(panel);
}
