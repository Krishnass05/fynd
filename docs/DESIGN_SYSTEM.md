# Design system

Rules for how the app looks and moves. Sanjana owns the final look. Everyone follows these so the pages feel like one product. Colours come from the five-colour palette below; the layout and headings follow the Crafthire design. Checked against the ui-ux-pro-max rules (accessibility first, restrained motion), with animation from React Bits.

## Colour palette

Five colours, chosen by Krishna. Everything on screen comes from these or a lighter or darker tint of them.

| Name | Hex | Where it is used |
| --- | --- | --- |
| Space Indigo | `#22223B` | Body text, headings, the dark button |
| Dusty Grape | `#4A4E69` | Primary buttons, links, the highlight in the navigation, secondary text |
| Lilac Ash | `#9A8C98` | Decoration only (the start page gradient, the corner of the role tiles) |
| Almond Silk | `#C9ADA7` | Soft panels, tags, dividers (lightened) |
| Seashell | `#F2E9E4` | Page background |

## Tokens (already in `app/globals.css`)

Use the variables. Never put a raw colour in a component.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#F2E9E4` Seashell | page background |
| `--card` | `#FBF8F5` (a lighter Seashell) | cards, inputs |
| `--ink` / `--ink-strong` | `#22223B` Space Indigo | body text / headings |
| `--muted` | `#4A4E69` Dusty Grape | secondary text |
| `--brand` | `#4A4E69` Dusty Grape | primary buttons, links, highlights |
| `--brand-soft` | `#E6D9D4` | neutral badges, bar tracks |
| `--accent` | `#C9ADA7` Almond Silk | decorative tiles |
| `--lilac` | `#9A8C98` Lilac Ash | decoration only, never text or field borders |
| `--line` | `#E0D0CB` | card edges and dividers (decoration) |
| `--line-strong` | `#7E707C` (a darker Lilac Ash) | **form field borders** |
| `--ok`, `--bad`, `--warn` (+ `bg`) | green, red, amber | statuses. The palette has no green or red, so these stay recognisable and always come with a word |
| `--radius` | `0.75rem` | cards and fields; buttons are pills |

Card tints (`data-tone`): pink is an Almond Silk tint, blue a Dusty Grape tint, yellow a warm Seashell tint, green a Lilac Ash tint. The names are kept so older code keeps working; the colours come from the palette.

Typography: Fraunces for headings (`--font-display`), Manrope for text (`--font-body`). Body 15px, line height 1.55. Spacing in steps of 4 and 8.

## Checked contrast (WCAG)

| Pair | Ratio | Needs |
| --- | --- | --- |
| Space Indigo on Seashell / card | 12.9 / 14.6 : 1 | 4.5 |
| Dusty Grape (secondary text) on Seashell / card | 6.8 / 7.7 : 1 | 4.5 |
| White on Dusty Grape (primary button) | 8.1 : 1 | 4.5 |
| White on Space Indigo (dark button) | 15.4 : 1 | 4.5 |
| Links (Dusty Grape) on Seashell | 6.8 : 1 | 4.5 |
| Space Indigo on the four card tints | 11.3 to 13.1 : 1 | 4.5 |
| Dusty Grape on the four card tints | 6.0 to 6.9 : 1 | 4.5 |
| Status badges (good, bad, warn) | 5.0 to 5.5 : 1 | 4.5 |
| Form field border (`--line-strong`) on Seashell / card | 3.9 / 4.4 : 1 | 3 |

**Lilac Ash itself is only 2.7 : 1 on Seashell.** Use it for decoration, never for text and never to outline a form field. The thin `--line` border is for card edges only, never for a field or a control.

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
| `PillNav` | the navigation bar on every page | marks the current page, fills the hovered link with Dusty Grape, folds into a menu button on phones |

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

The signed-in pages follow the marketplace mock: a sidebar on the left (Dashboard, Find freelancers, My jobs, Saved, Post a job for clients; Dashboard, Find jobs, Profile for freelancers), a top bar with search and the user, and the page content. `components/shell/AppShell.tsx` builds it for both sides. Under 960px the sidebar is hidden and the PillNav menu takes its place. The landing page has the PillNav bar, a headline with two buttons, a picture of a priced change order, and three real numbers from our own data. We do not show made-up user counts or reviews.

Building blocks, in `app/globals.css`: `.tiles` and `.tile2` (tinted number tiles), `.duo` and `.panel2` (two-column panels), `.activity` (a list with icon, text and time), `.fgrid` and `.fcard` (freelancer cards), `.chips` and `.chip` (filter chips), `.stepper` and `.formcard` (step forms), `.profile`, `.tabs` and `.hirecard` (profile page).

## Navigation

Every page uses the same bar: `components/shell/AppNav.tsx` wraps React Bits `PillNav` in our colours (light Seashell bar, Dusty Grape highlight, light theme). `TopBar` puts it next to the user name and "Switch user" on the client and freelancer sides, and the start page and case-checks page show it on its own. The links come from `lib/nav.ts`. To add a page to the menu, add it there and nowhere else. Do not build a second nav.

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

The first look was green and cream, taken from the Crafthire design. On 18 October 2026 Krishna replaced it with the five-colour palette above (decision D-40). The ui-ux-pro-max tool had also suggested a blue and green SaaS palette; we did not use it.
