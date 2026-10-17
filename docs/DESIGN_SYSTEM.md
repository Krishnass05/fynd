# Design system

Rules for how the app looks and moves. Sanjana owns the final look. Everyone follows these so the pages feel like one product. Colours come from the five-colour palette below; the layout and headings follow the Crafthire design. Checked against the ui-ux-pro-max rules (accessibility first, restrained motion), with animation from React Bits.

## Colour palette (60 / 30 / 10)

Set by Krishna on 18 October 2026. Pure white dominates; charcoal gives structure; paprika is the accent.

| Share | Name | Hex | Where it is used |
| --- | --- | --- | --- |
| 60% | Pure White | `#FFFFFF` | Page backgrounds, cards, content sections, whitespace |
| 30% | Charcoal Brown | `#403D39` | Headings, navigation, footer and CTA band, structural elements, links |
| 10% | Spicy Paprika | `#EB5E28` | Accents: active states, indicators, focus ring in the hero, primary buttons (as a deeper paprika glass) |
| support | Silver | `#CCC5B9` | Borders and dividers |
| support | Carbon Black | `#252422` | High-contrast body text and icons, the footer |

Floral White (#FFFCF2) and the earlier palettes (Joveo, Minty Serenity) are no longer used.

## Typography

Inter everywhere (`app/layout.tsx`, `--font-body`; `--font-display` points at the same font). Headings 600 to 700, body 400, buttons 500. Body 15px, line height 1.55.

## Tokens (in `app/globals.css`)

Use the variables. Never put a raw colour in a component.

| Token | Value | Use |
| --- | --- | --- |
| `--bg`, `--card` | `#FFFFFF` | page and card background |
| `--ink` / `--ink-strong` | `#252422` | body text |
| `--charcoal`, `--brand`, `--muted` | `#403D39` | headings, links, secondary text, bars |
| `--paprika` | `#EB5E28` | accents and active states (not small text: 3.4:1 on white) |
| `--orange` | `#C84B1A` | older solid paprika, kept for pages that still use it |
| `--silver` | `#CCC5B9` | borders and dividers |
| `--line` | `#E6E1D6` | light card edges |
| `--line-strong` | `#8A857B` | **form field borders** (3.6:1) |
| `--brand-soft` | `#ECE8DF` | hover fills, neutral badges |
| `--ok`, `--bad`, `--warn` (+ `bg`) | green, red, amber | statuses. They always come with a word |

## Buttons: Liquid Glass

Every `.btn` is glass: a translucent fill, `backdrop-filter: blur(14px) saturate(160%)`, a fine border and a soft top highlight. There are no opaque fills; browsers without backdrop blur get a solid fallback.

| Class | Use | Text |
| --- | --- | --- |
| `.btn` | primary action, deeper paprika glass (rgba 190, 68, 22, 0.88) | white, about 5.7:1 |
| `.btn.secondary` | on white, clear glass with a charcoal edge | Carbon Black |
| `.btn.dark` | charcoal glass | white |
| `.btn.danger` | red glass | white |
| `.btn.glass-light` | on dark or photo backgrounds (hero, CTA band) | white |

## Checked contrast (WCAG)

| Pair | Ratio | Needs |
| --- | --- | --- |
| Carbon Black on white | 15.9 : 1 | 4.5 |
| Charcoal Brown on white | 10.9 : 1 | 4.5 |
| White on the paprika glass button | about 5.7 : 1 | 4.5 |
| White on Charcoal Brown / Carbon Black | 10.9 / 15.9 : 1 | 4.5 |
| White on the hero (dark overlay over the photo) | 7 : 1 or more on the text side | 4.5 |
| Form field border on white | 3.6 : 1 | 3 |

**Pure Spicy Paprika #EB5E28 is only 3.4 : 1 against white**, so it is used for accents, never for small text, and buttons use a deeper paprika glass.

## Home page (/)

`app/page.tsx` with the parts in `components/landing/` and styles in `components/landing/landing.css`: a sticky nav (CraftHire wordmark, Find Talent, Find Work, Explore Categories, How It Works, Log in and Sign up, which open `/start`); the hero (crossfading photos under a dark overlay, a pause button, the Hire / Work toggle, search with autocomplete, trending chips); the category coverflow; How it works (For Hiring / For Finding Work); sample featured talent; a charcoal call-to-action band; the footer. Searches and category links go to the freelancer search (Hire) or the job list (Work), via the login page if nobody is signed in on that side (`?next=` brings them back). Images are local: `public/img/categories/*.svg`, `public/img/how/*.svg` (our drawings) and the two team photos in `public/bg/`. To use a video in the hero, add a muted, licensed clip and set `video` in `HERO_SLIDES` (`components/landing/data.ts`).

## Motion

- At most **two animated things per screen**, and each must mean something (a number counting up, a card responding to your pointer). No decoration for its own sake.
- Small interactions 150 to 200 ms. Entrances up to 400 ms. Leaving is faster than entering.
- Animate transform and opacity only. Never width, height, top or left.
- Everything must respect "reduce motion". The global rule in `globals.css` turns animation off, and the React Bits components check the setting themselves.
- Nothing may block clicking or typing while it animates.

### React Bits components we use (`components/fx/`)

| Component | Where | Why |
| --- | --- | --- |
| `BlurText` | start page headline | one reveal on load, readable by screen readers |
| `CountUp` | dashboard numbers | shows that figures are live, ends on the real value |
| `SpotlightCard` | role cards, project cards | a soft glow under the pointer, also appears on keyboard focus |
| `PillNav` | the navigation bar on every page | marks the current page, fills the hovered link with Charcoal Brown, folds into a menu button on phones |

Source: reactbits.dev (MIT with Commons Clause: free to use inside our product). The files were copied unchanged. Only these four are installed on purpose. FadeContent and similar pull in GSAP, and the WebGL backgrounds cost a lot of battery, so we left them out. To add another, copy it into `components/fx/`, recolour it with our tokens, and check it for reduced motion first.

## The card

`Card` (in `components/ui`) is the pastel card from the reference design: a coloured panel with a pill label, title, description, a row of icon facts and a progress bar, then a white strip with a label on the left and a dark pill button on the right. Every page that uses `Card` gets this look.

| Prop | What it does |
| --- | --- |
| `title`, children | the content (all the older pages pass) |
| `badge` | pill label at the top left (for example a job status) |
| `icon` | large decorative icon in a circle at the top right |
| `progress` | `{ value: 0 to 100, label? }` draws the bar |
| `footer` | the white strip, usually a text label plus `ButtonLink` |
| `tone` | `pink`, `blue`, `yellow` or `green`. Left out, it is picked from the title so a card keeps its colour |
| `plain` | the old flat white card, for dense content such as long forms or tables |

Ready-made versions: `JobCard` (a job: status, description, budget, deadline) and `ProjectCard` (a project: capacity bar, facts, footer). Lists of cards use `<div className="card-grid">`. Icons are in `components/ui/icons.tsx` (one family). `Button` now also has a `dark` variant, and `ButtonLink` is a link styled as a button.

## Page layout

Signed-in pages have the same top navigation bar on both sides (Upwork-style, 960px and wider): the logo, a search box, then a Jobs menu, a Services menu, and on the client side Find freelancers and Saved. Last comes "Hello," with the user's name and an avatar (initials) whose menu has Profile, Dashboard and Log out. Menus open to the right from their own button and close with Escape, a click elsewhere or a page change. Jobs is My jobs and Post a job for clients, and Find jobs and My work for freelancers. The Services menu first shows only the five domains; hovering (or focusing) one shows its topics beside it (list in `lib/services.ts`, the team's Job_counts list), and a domain or topic opens the freelancer search (clients) or the job list (freelancers). Under 960px the bar shows only the search box and the user, and the PillNav menu below it carries the page links.

Both sides open on the same home page (`components/home/MarketHome.tsx`): a headline, a two-line description, a big centred search box with popular searches, and reviews as a coverflow carousel (`components/reviews/ReviewCarousel.tsx`). Clients search freelancers and see client reviews; freelancers search open jobs and see freelancer reviews. All reviews are sample text written for the demo and labelled as such. Dashboards open from the avatar menu (`/client/dashboard`, `/freelancer/dashboard`), not on first load. The start page has the PillNav bar, a headline with two buttons, a picture of a priced change order, and three real numbers from our own data. We do not show made-up user counts or reviews as real.

Building blocks, in `app/globals.css`: `.tiles` and `.tile2` (tinted number tiles), `.duo` and `.panel2` (two-column panels), `.activity` (a list with icon, text and time), `.fgrid` and `.fcard` (freelancer cards), `.chips` and `.chip` (filter chips), `.stepper` and `.formcard` (step forms), `.profile`, `.tabs` and `.hirecard` (profile page).

## Navigation

Every page uses the same bar: `components/shell/AppNav.tsx` wraps React Bits `PillNav` in our colours (white bar, Charcoal Brown highlight, light theme). `TopBar` puts it next to the user name and "Switch user" on the client and freelancer sides, and the start page and case-checks page show it on its own. The links come from `lib/nav.ts`. To add a page to the menu, add it there and nowhere else. Do not build a second nav.

## Component rules

- Use the shared parts from `components/ui` (Button, Card, Badge, ErrorMessage, EmptyState, Spinner, Field). Keep their export names and props stable.
- One primary button per screen. Other actions are the outline style.
- Every form field has a visible label (`Field`), and the error shows next to it.
- Icons are SVG, from one family, with a text label or `aria-hidden`. **No emoji as icons.**
- Never use colour alone to carry meaning. Statuses show a word as well.
- Every list and page has three states: loading, empty (with what to do next), and error (with a way to retry).
- Money is `money()` from `components/ui`, whole rupees, always labelled before tax.
- Touch targets are at least 44 px tall. No horizontal scrolling at 375 px wide.

## Phones

Every page is checked at 375px wide (a small phone), with long unbroken titles and chat messages as the worst case.

- Nothing may scroll sideways. `main.page` breaks long words, `card-grid` uses `minmax(min(320px, 100%), 1fr)`, and cards can shrink (`min-width: 0`).
- Buttons and inputs are at least 44px tall. Use `Button` or `ButtonLink` instead of a bare link when the link is an action.
- The navigation folds into a menu button when the links do not fit (PillNav does this by itself).
- Under 640px the cards use smaller padding and a smaller corner icon, and the footer button stretches.
- To check a page: use the browser's phone size, or ask Claude to run the audit (it measures sideways overflow and small touch targets on every page).

## Before you open a pull request

- [ ] Tab through the page: every control reachable, focus ring visible, order matches the screen
- [ ] "Skip to main content" works (it is already in the root layout, and each layout needs `id="main-content"` on its `<main>`)
- [ ] Turn on reduce motion in the browser or OS: nothing moves
- [ ] 375 px wide: no sideways scroll, nothing cut off, buttons at least 44px tall
- [ ] No raw hex or `oklch` values in new CSS, only tokens

## History

The first look was green and cream, taken from the Crafthire design. On 18 October 2026 Krishna replaced it with a five-colour palette, and later the same day with the Joveo palette above (D-40), then with the Joveo palette (D-44), then with the current palette (D-45). The ui-ux-pro-max tool had also suggested a blue and green SaaS palette; we did not use it.
