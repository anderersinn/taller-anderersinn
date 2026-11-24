export const COURSE_ID = 'sprint-diseno-producto-tech';

export const PREVIEW_COURSE = {
  title: 'Sprint de Diseño de Producto Tech',
  subtitle: 'Anderer Sinn — Taller virtual',
  description: 'Cinco semanas para pasar de una necesidad real a un prototipo tecnológico que puedas probar y mostrar.'
};

export const PREVIEW_WEEKS = [
  { id: 'semana-1', number: 1, title: 'Descubrir e inspirar', published: true },
  { id: 'semana-2', number: 2, title: 'Investigar, sintetizar y definir', published: true },
  { id: 'semana-3', number: 3, title: 'Idear, seleccionar y prototipar', published: true },
  { id: 'semana-4', number: 4, title: 'Integrar, proteger y desplegar', published: true },
  { id: 'semana-5', number: 5, title: 'Comunicar, reflexionar y compartir', published: true }
];

export const PREVIEW_MODULES = [
  { id: 'sincronica', title: 'Sesión sincrónica', description: 'Grabación de la clase y documentos complementarios.' },
  { id: 'asincronica', title: 'Trabajo asincrónico', description: 'Videos, documentos y quices de la semana.' }
];

export function getPreviewWeek(id) {
  return PREVIEW_WEEKS.find((week) => week.id === id) || null;
}

export function getPreviewWeekTitle(id) {
  const week = getPreviewWeek(id);
  return week ? week.title : '';
}
