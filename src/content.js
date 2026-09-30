// Local preview data. The same fields can later be populated by Sanity.
export const projects = [
  { id: "trikots", kind: "Förderidee", title: "Neue Trikots ermöglichen", description: "Wenn Ausstattung fehlt, können Partner und Förderer gemeinsam einen Unterschied machen.", featuredOnHome: true, featuredOrder: 1 },
  { id: "schule-sport", kind: "Schule & Sport", title: "Rugby an Schulen", description: "Lehrkräfte stärken und jungen Menschen den Zugang zum Rugbysport eröffnen.", featuredOnHome: true, featuredOrder: 2 },
  { id: "rudelbar", kind: "Einblick", title: "Rudelbar", description: "Eine Initiative aus der Region, über die wir berichten und mit der wir uns austauschen möchten.", featuredOnHome: true, featuredOrder: 3 },
];

// Publish events here only when their dates and public details are confirmed.
export const events = [];

export function getFeaturedProjects(items) {
  return items.filter((item) => item.featuredOnHome).sort((a, b) => a.featuredOrder - b.featuredOrder).slice(0, 3);
}

export function getUpcomingEvents(items, now = new Date()) {
  return items.filter((item) => item.published && item.startsAt && new Date(item.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}
