# Statements of Work (SOW) library

We write **54 SOWs**, one per job profile. Our app reads these to detect scope changes and price them.

Each person has a fixed range of numbers below. Write only your own, so nobody clashes.

| Person | Numbers | Count |
| --- | --- | --- |
| Harini | 01 to 15 | 15 |
| Sanjana | 16 to 30 | 15 |
| Swapnil | 31 to 45 | 15 |
| Krishna | 46 to 54 | 9 |

## Naming

`NN-skill-name.md`: two digits, then the skill in lowercase with dashes.
Examples: `01-php.md`, `21-graphic-design.md`, `46-autocad.md`

Put every file in this folder (`docs/sow/`), on **your own branch**.

## Your skills

Skills marked **(merged)** combine two near-identical listings into one SOW. Cover both in the same file.

### Harini: 01 to 15 (Websites, IT and Software)

| No. | Skill |
| --- | --- |
| 01 | PHP |
| 02 | HTML |
| 03 | Web Development |
| 04 | Digital Marketing |
| 05 | SEO |
| 06 | Adobe Premiere Pro |
| 07 | Data Management and Database Management (merged) |
| 08 | JavaScript |
| 09 | Adobe Illustrator and Illustrator (merged) |
| 10 | Software Architecture |
| 11 | Web Design and Website Design (merged) |
| 12 | Social Media Management |
| 13 | WordPress |
| 14 | Python |
| 15 | API Development |

### Sanjana: 16 to 30 (Websites, IT and Software, then Design and Media)

| No. | Skill |
| --- | --- |
| 16 | eCommerce |
| 17 | Link Building |
| 18 | MySQL |
| 19 | API Integration |
| 20 | Data Collection |
| 21 | Graphic Design |
| 22 | Video Editing and Video Post-editing (merged) |
| 23 | Video Production |
| 24 | Photoshop and Adobe Photoshop (merged) |
| 25 | After Effects |
| 26 | Video Services |
| 27 | Animation |
| 28 | 3D Modelling and 3D Design (merged) |
| 29 | 3D Rendering |
| 30 | Logo Design |

### Swapnil: 31 to 45 (Design, Media and Architecture)

| No. | Skill |
| --- | --- |
| 31 | 3D Animation |
| 32 | Illustration |
| 33 | Photography |
| 34 | Word |
| 35 | CSS |
| 36 | Final Cut Pro |
| 37 | Audio Editing |
| 38 | Motion Graphics |
| 39 | Building Architecture |
| 40 | Visual Design |
| 41 | Photo Editing |
| 42 | Videography |
| 43 | Audio Services |
| 44 | DaVinci Resolve |
| 45 | Sound Design |

### Krishna: 46 to 54 (Engineering, Business, Data Entry and Admin)

| No. | Skill |
| --- | --- |
| 46 | AutoCAD |
| 47 | CAD/CAM |
| 48 | Data Analysis |
| 49 | Project Management |
| 50 | Business Development |
| 51 | Data Entry |
| 52 | Excel |
| 53 | Data Processing |
| 54 | Customer Service |

## Template (copy this into every file)

```markdown
# <Skill name>

**Category:** <Websites, IT and Software / Design, Media and Architecture / Engineering and Science / Business and Admin / Data Entry and Admin>
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
- Rates and hours are synthetic, for the simulation. Do not present them as real market prices.
- Write at least 3 rows in the change-request table. Our pricing and anomaly checks use them.
