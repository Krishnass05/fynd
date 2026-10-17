# Design system

Rules for how the app looks and moves. Sanjana owns the final look. Everyone follows these so the pages feel like one product. Colours come from the five-colour palette below; the layout and headings follow the Crafthire design. Checked against the ui-ux-pro-max rules (accessibility first, restrained motion), with animation from React Bits.

## Colour palette

Chosen by Krishna on 18 October 2026. The site is mostly white; orange is used on some buttons only.

| Name | Hex | Where it is used |
| --- | --- | --- |
| White | `#FFFFFF` | Page background (plain white, no pattern or glow) |
| Silver | `#CCC5B9` | Decoration, soft panels, background art |
| Charcoal Brown | `#403D39` | Secondary text, links, navigation highlight, bars |
| Carbon Black | `#252422` | Body text, headings, the dark button |
| Spicy Paprika | `#EB5E28` (buttons use the darker `#C84B1A`) | Primary buttons with white text, decoration |

## Tokens (already in `app/globals.css`)

Use the variables. Never put a raw colour in a component.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#FFFFFF` | page background, plain white |
| `--card` | `#FFFFFF` | cards, inputs |
| `--ink` / `--ink-strong` | `#252422` | body text / headings |
| `--muted` | `#403D39` | secondary text |
| `--brand` | `#403D39` | links, highlights, progress bars |
| `--orange` | `#C84B1A` (Spicy Paprika, darkened) | primary `.btn` background, white text |
| `--brand-soft` | `#ECE8DF` | neutral badges, bar tracks |
| `--accent` | `#CCC5B9` | decorative tiles |
| `--line` | `#E6E1D6` | card edges and dividers (decoration) |
| `--line-strong` | `#8A857B` | **form field borders** |
| `--ok`, `--bad`, `--warn` (+ `bg`) | green, red, amber | statuses. They always come with a word |

Background images: `public/bg/role-client.svg` and `role-freelancer.svg` (the pictures on the two role cards), `public/bg/hero.svg` (soft orange and silver circles behind the start page) and `public/bg/pattern.svg` (faint outline shapes on every page). They are our own drawings, not stock photos.

## Checked contrast (WCAG)

| Pair | Ratio | Needs |
| --- | --- | --- |
| Carbon Black on Floral White / white | about 16 : 1 | 4.5 |
| Charcoal Brown on Floral White | about 10 : 1 | 4.5 |
| White on darkened Spicy Paprika #C84B1A (primary button) | 4.7 : 1 | 4.5 |
| White on Charcoal Brown / Carbon Black | 10 to 16 : 1 | 4.5 |
| Form field border on white | 3.4 : 1 | 3 |

**White on the pure Spicy Paprika #EB5E28 is only 3.4 : 1**, so buttons use a darker shade of it (#C84B1A). Orange is never used for text or links.

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

Signed-in pages have a top navigation bar (Upwork-style) on screens 960px and wider: the logo, then a Jobs menu (clients only: My jobs, Post a job), a Services menu, Find freelancers and Saved (clients) or Dashboard, Find jobs and Profile (freelancers), a search box and the user avatar (menu: Profile, Dashboard, Log out). Clients open on a home page (search box and client reviews), not on a dashboard: their dashboard and profile open from the avatar (initials) menu in the top bar, which also has Log out. The drop-down menus open on hover or click and close with Escape, a click elsewhere or a page change. The Services menu lists our domains and their topics from `lib/services.ts` (the team's Job_counts list) and links to the freelancer search (clients) or the job list (freelancers). Under 960px the bar shows only the search box and the user, and the PillNav menu below it carries the page links. `components/shell/AppShell.tsx` builds it for both sides. The landing page has the PillNav bar, a headline with two buttons, a picture of a priced change order, and three real numbers from our own data. We do not show made-up user counts or reviews.

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
