export function getFeaturedProjects(items) {
  return items.filter((item) => item.featuredOnHome)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
    .slice(0, 3);
}

export function getUpcomingEvents(items, now = new Date()) {
  return items.filter((item) => item.published && item.startsAt && new Date(item.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}
