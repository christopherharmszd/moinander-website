# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Moinander design context
- Selected visual target: the third generated Moinander concept, `/Users/christopher.harms/.codex/generated_images/01a0f185-af46-7310-9011-307966fc6bf5/exec-9dc9960d-bfff-434f-8791-7e9dd3f84a66.png`.
- Preserve the wordmark from the existing Wix site. Its layout and other images are references, not a required design.
- The site introduces a newly founded Förderverein, the elected board, and its work. Projects, public dates, partners, sponsors, contact, and project proposals will grow over time. Do not invent published events, sponsor relationships, fees, or project outcomes.
- On large 4K/8K displays, keep the whole website centered at a maximum width of 1440px with visible side margins; avoid scaling the hero and content indefinitely with the viewport.
- Keep the homepage as an overview with short entry points. Projects, dates, partners, and participation have separate, directly accessible pages with room to grow.
- The future CMS should let editors choose and order up to three homepage projects. The homepage date teaser should show the next published upcoming event automatically and link to the full date overview.
- The homepage is a concise overview. Keep separate pages for About us (goals and board) and Contact (form), each directly reachable from desktop and mobile navigation. The About page may use simple in-page links; add a dropdown only when it gains multiple distinct pages.
- Show the normal header at the top of each page. Once it has scrolled fully out of view, show a labeled floating Menu button on desktop and mobile that opens the same navigation links. Show a separate back-to-top button after the first screen section; do not leave a gap without available navigation. Avoid the prior shrink-and-hide header behavior.
- Published projects, dates, partners, and board members come from the separate Moinander Sanity project. Editors choose and order up to three homepage projects; the next public date is computed from published upcoming events. The Studio is hosted by its own Cloudflare Worker. Keep Sanity write credentials out of public code.
- The primary editing experience is Moinander's own nontechnical CMS portal. The public `/studio/` entry redirects to its Cloudflare Worker login. Editors sign in with a Moinander account and manage projects, events, partners, and board members there; Sanity is only the content backend. Keep login verifiers and the Sanity Editor token in Worker secrets, never in client code or Git.
- Project articles should be edited as ordered text, heading, and image blocks. Editors choose an image's position in the article and can add a caption, accessible description, and credit. Keep existing article paragraphs intact when opening and saving them; a missing inline image may remain a private draft placeholder but must block publication until uploaded.
- Offer flexible article templates for short updates, image-led reports, and long-form articles. Templates provide starting blocks and suitable reading widths without locking the editor; changing a template must not erase existing article content. Legacy projects should remain in the long-form layout until an editor chooses otherwise.
