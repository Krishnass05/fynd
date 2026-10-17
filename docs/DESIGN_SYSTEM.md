# Design system

Rules for how the app looks and moves. Sanjana owns the final look. Everyone follows these so the pages feel like one product. Built from the Crafthire design you shared (green, cream, serif headings), checked against the ui-ux-pro-max rules (accessibility first, restrained motion), with animation from React Bits.

## Tokens (already in `app/globals.css`)

Use the variables. Never put a raw colour in a component.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | cream `oklch(98.5% .008 95)` | page background |
| `--card` | white | cards, inputs |
| `--ink` / `--ink-strong` | deep green-black | body text / headings |
| `--muted` | `oklch(48% .02 160)` | secondary text |
| `--brand` | green `oklch(52% .13 155)` | primary buttons, links, highlights |
| `--brand-soft` | pale green | neutral badges, bar tracks |
| `--accent` | warm yellow | decorative tiles only |
| `--line` | light grey-green | card edges and dividers (decoration) |
| `--line-strong` | `oklch(62% .02 150)` | **form field borders** |
| `--ok`, `--bad`, `--warn` (+ `bg`) | status colours | badges and alerts, always with a word |
| `--radius` | `0.75rem` | cards and fields; buttons are pills |

Typography: Fraunces for headings (`--font-display`), Manrope for text (`--font-body`). Body 15px, line height 1.55. Spacing in steps of 4 and 8.

## Checked contrast (WCAG)

| Pair | Ratio | Needs |
| --- | --- | --- |
| Body text on page | 17.2 : 1 | 4.5 |
| Muted text on page / card | 6.2 / 6.5 : 1 | 4.5 |
| White on primary button | 5.2 : 1 | 4.5 |
| Links on page / card | 4.95 / 5.2 : 1 | 4.5 |
| Status badges (good, bad, warn) | 5.7 to 6.5 : 1 | 4.5 |
| Form field border on page / card | 3.2 to 3.9 : 1 | 3 |

The thin `--line` border is 1.3 : 1. That is fine for card edges, but **never use it to outline a form field or a control**.

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

Source: reactbits.dev (MIT with Commons Clause: free to use inside our product). The files were copied unchanged. Only these three are installed on purpose. FadeContent and similar pull in GSAP, and the WebGL backgrounds cost a lot of battery, so we left them out. To add another, copy it into `components/fx/`, recolour it with our tokens, and check it for reduced motion first.

## Component rules

- Use the shared parts from `components/ui` (Button, Card, Badge, ErrorMessage, EmptyState, Spinner, Field). Keep their export names and props stable.
- One primary button per screen. Other actions are the outline style.
- Every form field has a visible label (`Field`), and the error shows next to it.
- Icons are SVG, from one family, with a text label or `aria-hidden`. **No emoji as icons.**
- Never use colour alone to carry meaning. Statuses show a word as well.
- Every list and page has three states: loading, empty (with what to do next), and error (with a way to retry).
- Money is `money()` from `components/ui`, whole rupees, always labelled before tax.
- Touch targets are at least 44 px tall. No horizontal scrolling at 375 px wide.

## Before you open a pull request

- [ ] Tab through the page: every control reachable, focus ring visible, order matches the screen
- [ ] "Skip to main content" works (it is already in the root layout, and each layout needs `id="main-content"` on its `<main>`)
- [ ] Turn on reduce motion in the browser or OS: nothing moves
- [ ] 375 px wide: nothing cut off
- [ ] No raw hex or `oklch` values in new CSS, only tokens

## Open decision

The ui-ux-pro-max tool suggested a different palette for a SaaS dashboard: flat style, blue `#0369A1` with green `#16A34A`, Plus Jakarta Sans. We kept the green and cream look from the Crafthire design instead, because the team picked it. Switching is a change of the token values and the two fonts in `globals.css` and `app/layout.tsx`, nothing else.
