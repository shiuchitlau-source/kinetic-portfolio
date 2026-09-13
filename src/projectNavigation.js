export function projectHref(project, location = window.location) {
  const url = new URL(location.href);
  url.searchParams.set("project", project.id);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function projectFromLocation(projects, location = window.location) {
  const id = new URLSearchParams(location.search).get("project");
  return projects.find((project) => project.id === id) || null;
}

export function isPlainNavigation(event) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
