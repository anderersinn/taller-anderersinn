const RESOURCE_TYPES = new Set(['video', 'document', 'form', 'link']);
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function isSafeId(value) {
  return typeof value === 'string' && SAFE_ID.test(value);
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isEmbedUrl(value) {
  if (!isHttpUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase();
  return host === 'drive.google.com' || host === 'docs.google.com';
}

export function isPermissionDenied(error) {
  return Boolean(error) && error.code === 'permission-denied';
}

export function isActiveStudent(data, courseId) {
  return Boolean(
    data &&
      data.active === true &&
      Array.isArray(data.courseIds) &&
      data.courseIds.some((id) => id === courseId)
  );
}

export function isActiveAdmin(data) {
  return Boolean(data && data.active === true);
}

export function normalizeCourse(data) {
  if (!data || data.published !== true || !isNonEmptyString(data.title)) return null;

  return {
    title: data.title,
    subtitle: isNonEmptyString(data.subtitle) ? data.subtitle : 'Anderer Sinn — Aula virtual',
    description: isNonEmptyString(data.description) ? data.description : '',
    modules: normalizeCourseModules(data.modules),
    weeks: normalizeWeeks(data.weeks)
  };
}

export function normalizeWeek(data, fallbackId = '') {
  if (!data || data.published !== true || !isNonEmptyString(data.title)) return null;

  return {
    id: isSafeId(data.id) ? data.id : fallbackId,
    number: Number.isInteger(data.number) && data.number > 0 ? data.number : null,
    title: data.title,
    description: isNonEmptyString(data.description) ? data.description : '',
    modules: normalizeWeekModules(data.modules)
  };
}

export function normalizeWeeks(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (week) =>
        week &&
        isSafeId(week.id) &&
        Number.isInteger(week.number) &&
        week.number > 0 &&
        isNonEmptyString(week.title) &&
        week.published === true
    )
    .map((week) => ({
      id: week.id,
      number: week.number,
      title: week.title,
      published: true
    }));
}

export function normalizeCourseModules(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((module) => module && isNonEmptyString(module.id) && isNonEmptyString(module.title))
    .map((module) => ({ id: module.id, title: module.title }));
}

export function normalizeWeekModules(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (module) =>
        module &&
        isNonEmptyString(module.id) &&
        isNonEmptyString(module.title) &&
        module.published === true
    )
    .map((module) => ({
      id: module.id,
      title: module.title,
      resources: normalizeResources(module.resources)
    }));
}

export function normalizeResources(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (resource) =>
        resource &&
        isNonEmptyString(resource.id) &&
        RESOURCE_TYPES.has(resource.type) &&
        isNonEmptyString(resource.title) &&
        isHttpUrl(resource.url) &&
        resource.published === true
    )
    .map((resource) => ({
      id: resource.id,
      type: resource.type,
      title: resource.title,
      description: isNonEmptyString(resource.description) ? resource.description : '',
      url: resource.url,
      embedUrl: isEmbedUrl(resource.embedUrl) ? resource.embedUrl : ''
    }));
}
