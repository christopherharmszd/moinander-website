# Design QA — Moinander e.V.

## Evidence

- Source visual truth: `/Users/christopher.harms/.codex/generated_images/01a0f185-af46-7310-9011-307966fc6bf5/exec-9dc9960d-bfff-434f-8791-7e9dd3f84a66.png` (1435 × 1096 px).
- Implementation: `http://127.0.0.1:4173/`, captured in the Codex in-app browser. The browser screenshot API displayed the capture but did not expose a local screenshot path.
- Desktop viewport and state: 1435 × 1100 CSS px, scale 1, start of page, proposal closed. The 4 px height difference from the source does not affect visible layout comparison.
- Mobile viewport and state: 390 × 844 CSS px, start of page; menu closed and open.
- Full-view comparison: source and rendered desktop view were emitted together in one browser comparison. The hero and first content section were inspected at the same width.
- Focused comparisons: hero heading/logo/image crop, project proposal dialog, mobile navigation, mobile hero, and contact area were inspected in separate browser captures. A full-page screenshot stitched incorrectly in the browser tool, so the individual viewport captures were used for layout review.

## Findings and fixes

- [P2, fixed] The first desktop hero crop allowed the second CTA to touch the photo diagonal. Shifted the diagonal boundary right at CTA height. The revised desktop capture shows both buttons clear of the photo.
- [P2, fixed] The first mobile headline broke “bringen wir mehr” across two lines. Reduced the mobile display size; the revised capture has a balanced three-line headline.
- [P2, fixed] The first mobile menu exposed a second CTA below its edge. Expanded the menu to the viewport height; the revised capture shows a clean overlay.
- [P2, fixed] Project rows showed arrows without destination pages. Removed the arrows until articles exist.

## Fidelity review

- Typography: Avenir Next/system fallback provides a heavy geometric heading close to the mock. Heading hierarchy, line breaks, and small uppercase labels are consistent in the desktop comparison. The typeface is not an exact match.
- Spacing and layout: Header, hero height, left copy position, angled photo, and first content section closely track the selected concept. The lower photo grid was widened after comparison. Mobile layout stacks naturally without horizontal overflow.
- Colors: Navy, lime, blue, and white follow the mock's dominant palette with readable contrast.
- Images: The original Moinander wordmark is used. The two separate generated photos match the chosen documentary direction and avoid invented apparel branding. Both load in the browser. The mock's blue hero ribbon is simplified; this is minor visual polish.
- Copy: The association, board, project themes, dates, and partner state use provided information or clearly describe future content. No sponsor names, published events, fees, or outcomes were invented.
- Interaction: The homepage links into directly accessible About us, project, date, partner, participation, and contact pages. About us has local links to goals and board. Desktop navigation and the top mobile menu remain at the start of each page. When the header leaves the viewport, a labeled floating Menu button appears on both desktop and mobile. Its navigation panel was inspected on both sizes; Escape closes it and returns focus to the button. The back-to-top button appears after the first screen section and returned the mobile page to the top with a click. The proposal dialog and contact form still show a truthful prepared state; they do not transmit data.
- Content behavior: Homepage projects are selected by `featuredOnHome` and `featuredOrder` in local preview data. Published upcoming dates are sorted by start time; the nearest appears on the homepage, while all upcoming dates appear on the date page. There are currently no published dates, so the empty state is shown. Sanity is not connected yet.
- Wide-screen check: At a 3840 px viewport, the site shell measured 1440 px wide and centered with about 1193 px on each side. The mobile detail page at 390 px rendered without horizontal overflow.
- Console: No browser error logs in the inspected pages. Production build generated all seven pages, and four packaging tests passed.

## Follow-up polish

- [P3] Revisit the hero's blue accent ribbon and exact font once the first design direction is approved.
- Replace illustrative photos with approved real project and board images when supplied.
- Connect forms, CMS content, dates, and verified social links during the implementation phase.

final result: passed
