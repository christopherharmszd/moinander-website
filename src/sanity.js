const query = `{
  "projects": *[_type == "project" && !(_id in path("drafts.**"))] | order(coalesce(publishedAt, _createdAt) desc) {
    "id": _id, "slug": slug.current, kind, articleTemplate, title, "description": summary,
    "imageUrl": image.asset->url, "imageAlt": image.alt,
    body[]{ ..., "imageUrl": asset->url, images[]{ ..., "imageUrl": asset->url } },
    featuredOnHome, "featuredOrder": homeOrder
  },
  "events": *[_type == "event" && !(_id in path("drafts.**"))] | order(startsAt asc) {
    "id": _id, title, startsAt, endsAt, location, "summary": summary,
    description, link, "published": true
  },
  "partners": *[_type == "partner" && !(_id in path("drafts.**"))] | order(sortOrder asc, name asc) {
    "id": _id, name, kind, "logoUrl": logo.asset->url, "logoAlt": logo.alt,
    summary, website
  },
  "board": *[_type == "boardMember" && !(_id in path("drafts.**"))] | order(sortOrder asc, name asc) {
    "id": _id, name, role, "portraitUrl": portrait.asset->url,
    "portraitAlt": portrait.alt
  }
}`;

export async function loadPublishedContent(signal) {
  const url = new URL('https://nqq96vbs.api.sanity.io/v2025-02-19/data/query/production');
  url.searchParams.set('query', query);
  const response = await fetch(url, {signal, headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity lieferte HTTP ${response.status}`);
  const data = await response.json();
  if (!data.result || typeof data.result !== 'object') throw new Error('Ungültige Sanity-Antwort');
  return data.result;
}
