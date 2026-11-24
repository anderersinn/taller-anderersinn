import {
  PREVIEW_COURSE,
  PREVIEW_MODULES,
  PREVIEW_WEEKS,
  getPreviewWeek
} from './preview-data.js';
import { renderWeekNav, initNavToggle } from './navigation.js';
import {
  renderCourseSummary,
  renderWeekContent,
  renderUnavailable
} from './course-content.js';
import { byId, setText } from './ui.js';

const params = new URLSearchParams(window.location.search);
const isPreview = params.get('preview') === '1';
const page = document.body.dataset.page;
const isWeekPage = page === 'week';
const pendingView = byId('pending-view');
const contentView = byId(isWeekPage ? 'week-view' : 'course-view');
const weekNav = byId('week-nav');
const requestedWeekId = params.get('semana') || 'semana-1';
const activeWeek = isWeekPage ? getPreviewWeek(requestedWeekId) : null;
const activeWeekId = activeWeek ? activeWeek.id : null;

initNavToggle(byId('nav-toggle'), weekNav);

setText(
  'pending-detail',
  'Las páginas protegidas mostrarán el contenido del curso después de publicar la configuración de Firebase y las reglas de Firestore.'
);

if (!isPreview) {
  if (pendingView) pendingView.hidden = false;
  if (contentView) contentView.hidden = true;
} else {
  if (pendingView) pendingView.hidden = true;
  if (contentView) contentView.hidden = false;

  renderWeekNav(weekNav, PREVIEW_WEEKS, activeWeekId, true);

  if (isWeekPage) {
    if (!activeWeek) {
      setText('week-kicker', 'Contenido no disponible');
      setText('week-title', 'No encontramos esta semana');
      setText('week-description', 'Revisa el identificador de la semana o vuelve al curso.');
      renderUnavailable(
        byId('week-content'),
        'La semana solicitada no hace parte de la vista previa pública.'
      );
    } else {
      setText('week-kicker', `Semana ${activeWeek.number}`);
      setText('week-title', activeWeek.title);
      setText(
        'week-description',
        'Dos momentos de trabajo: la sesión sincrónica y el trabajo asincrónico.'
      );
      document.title = `${activeWeek.title} | Aula Anderer Sinn`;
      renderWeekContent(byId('week-content'), activeWeek, PREVIEW_MODULES);
    }
  } else {
    renderCourseSummary(byId('course-summary'), PREVIEW_COURSE, PREVIEW_WEEKS);
  }
}
