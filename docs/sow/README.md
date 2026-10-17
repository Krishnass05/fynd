# Statements of Work (SOW) library

We need **50 job profiles**, one SOW file each. Our app reads these to detect scope changes and price them.

## Naming

`NN-short-job-name.md`, with two digits and lowercase words joined by dashes.

Examples: `01-landing-page-design.md`, `02-logo-design.md`, `03-mobile-app-ui.md`

Split the numbers between teammates so nobody clashes:

| Person | Numbers |
| --- | --- |
| Harini | 01-13 |
| Swapnil | 14-26 |
| Sanjana | 27-39 |
| Krishna | 40-50 |

## Template (copy this into every file)

```markdown
# <Job profile name>

**Category:** <design / development / writing / marketing / other>
**Currency:** INR
**Rate per hour:** <number>
**Assumed total hours:** <number>
**Deadline:** <for example 10 working days>

## Included deliverables
- <deliverable 1>
- <deliverable 2>

## Excluded (needs a change order)
- <item 1>
- <item 2>

## Common change requests and typical extra hours
| Request a client might make | Typical extra hours |
| --- | --- |
| <example> | <number, or "unknown"> |

## Assumptions
- <for example: 2 rounds of revisions are included>
```

## Rules for writing a good SOW

- Be specific. "A landing page" is good. "Website stuff" is not.
- Every excluded item should be something a client really might ask for.
- If an hour estimate is not known, write `unknown`. Do not write `0`.
- All numbers are synthetic and for the simulation. Do not present them as real market prices.
