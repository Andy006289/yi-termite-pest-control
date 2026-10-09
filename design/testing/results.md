# Test results — YI Termite & Pest Control prototype

Run: 2026-09-28 21:22  
Engines: chromium 148.0.7778.96, webkit 26.4, firefox 150.0.2

## Layout checks (7 pages × 4 viewports × 3 engines)

| Engine | Viewport | Pages with horizontal scroll | Min font (px) | Text below AA contrast | Targets < 24px | Targets 24–43px | Nav pattern | Pest grid columns | JS errors |
|---|---|---|---|---|---|---|---|---|---|
| chromium | mobile 390px | none | 12 | 0 | 0 | 10 | hamburger | 1 | 0 |
| chromium | tablet 768px | none | 12 | 0 | 0 | 10 | full nav | 2 | 0 |
| chromium | laptop 1024px | none | 12 | 0 | 0 | 10 | full nav + CTA | 4 | 0 |
| chromium | desktop 1440px | none | 12 | 0 | 0 | 10 | full nav + CTA | 4 | 0 |
| webkit | mobile 390px | none | 12 | 0 | 0 | 11 | hamburger | 1 | 0 |
| webkit | tablet 768px | none | 12 | 0 | 0 | 11 | full nav | 2 | 0 |
| webkit | laptop 1024px | none | 12 | 0 | 0 | 11 | full nav + CTA | 4 | 0 |
| webkit | desktop 1440px | none | 12 | 0 | 0 | 11 | full nav + CTA | 4 | 0 |
| firefox | mobile 390px | none | 12 | 0 | 0 | 10 | hamburger | 1 | 0 |
| firefox | tablet 768px | none | 12 | 0 | 0 | 10 | full nav | 2 | 0 |
| firefox | laptop 1024px | none | 12 | 0 | 0 | 10 | full nav + CTA | 4 | 0 |
| firefox | desktop 1440px | none | 12 | 0 | 0 | 10 | full nav + CTA | 4 | 0 |

## Functional checks

| Engine | Viewport | Test | Result | Detail |
|---|---|---|---|---|
| chromium | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| chromium | mobile | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=True |
| chromium | mobile | Identify: tapping a pest option selects exactly one card | PASS |  |
| chromium | mobile | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| chromium | mobile | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| chromium | mobile | Estimate wizard: last step opens the estimate result page | PASS |  |
| chromium | mobile | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| chromium | mobile | Booking: completed form submits and shows the confirmation page | PASS |  |
| chromium | desktop | Horizontal navigation shows all 5 links | PASS | 5 visible links |
| chromium | desktop | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=False |
| chromium | desktop | Identify: tapping a pest option selects exactly one card | PASS |  |
| chromium | desktop | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| chromium | desktop | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| chromium | desktop | Estimate wizard: last step opens the estimate result page | PASS |  |
| chromium | desktop | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| chromium | desktop | Booking: completed form submits and shows the confirmation page | PASS |  |
| webkit | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| webkit | mobile | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=True |
| webkit | mobile | Identify: tapping a pest option selects exactly one card | PASS |  |
| webkit | mobile | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| webkit | mobile | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| webkit | mobile | Estimate wizard: last step opens the estimate result page | PASS |  |
| webkit | mobile | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| webkit | mobile | Booking: completed form submits and shows the confirmation page | PASS |  |
| webkit | desktop | Horizontal navigation shows all 5 links | PASS | 5 visible links |
| webkit | desktop | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=False |
| webkit | desktop | Identify: tapping a pest option selects exactly one card | PASS |  |
| webkit | desktop | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| webkit | desktop | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| webkit | desktop | Estimate wizard: last step opens the estimate result page | PASS |  |
| webkit | desktop | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| webkit | desktop | Booking: completed form submits and shows the confirmation page | PASS |  |
| firefox | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| firefox | mobile | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=True |
| firefox | mobile | Identify: tapping a pest option selects exactly one card | PASS |  |
| firefox | mobile | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| firefox | mobile | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| firefox | mobile | Estimate wizard: last step opens the estimate result page | PASS |  |
| firefox | mobile | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| firefox | mobile | Booking: completed form submits and shows the confirmation page | PASS |  |
| firefox | desktop | Horizontal navigation shows all 5 links | PASS | 5 visible links |
| firefox | desktop | Keyboard focus indicator visible on first Tab stop | PASS | A outline=True shadow=False |
| firefox | desktop | Identify: tapping a pest option selects exactly one card | PASS |  |
| firefox | desktop | Estimate wizard: Back disabled on step 1 | PASS | Step 1 of 5 |
| firefox | desktop | Estimate wizard: Continue advances 1→5, Back returns to 4 | PASS | Step 1 of 5 → Step 5 of 5 → Step 4 of 5 |
| firefox | desktop | Estimate wizard: last step opens the estimate result page | PASS |  |
| firefox | desktop | Booking: empty submit is blocked and required fields are flagged | PASS | 3 fields flagged |
| firefox | desktop | Booking: completed form submits and shows the confirmation page | PASS |  |

**Functional: 48/48 passed.**

## Low-contrast text (detail, chromium)


## Small touch targets (detail)

- chromium · mobile · identify · 24–43px · Home (36×24)
- chromium · mobile · identify · 24–43px · Upload a photo instead (156×28)
- chromium · mobile · estimate · 24–43px · Home (36×24)
- chromium · mobile · estimate-result · 24–43px · Home (36×24)
- chromium · mobile · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · mobile · booking · 24–43px · Home (36×24)
- chromium · mobile · booking · 24–43px · INPUT (24×24)
- chromium · mobile · booking · 24–43px · Edit estimate answers (149×28)
- chromium · mobile · my-services · 24–43px · View all (53×28)
- chromium · tablet · identify · 24–43px · Home (36×24)
- chromium · tablet · identify · 24–43px · Upload a photo instead (156×28)
- chromium · tablet · estimate · 24–43px · Home (36×24)
- chromium · tablet · estimate-result · 24–43px · Home (36×24)
- chromium · tablet · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · tablet · booking · 24–43px · Home (36×24)
- chromium · tablet · booking · 24–43px · INPUT (24×24)
- chromium · tablet · booking · 24–43px · Edit estimate answers (149×28)
- chromium · tablet · my-services · 24–43px · View all (53×28)
- chromium · laptop · identify · 24–43px · Home (36×24)
- chromium · laptop · identify · 24–43px · Upload a photo instead (156×28)
- chromium · laptop · estimate · 24–43px · Home (36×24)
- chromium · laptop · estimate-result · 24–43px · Home (36×24)
- chromium · laptop · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · laptop · booking · 24–43px · Home (36×24)
- chromium · laptop · booking · 24–43px · INPUT (24×24)
- chromium · laptop · booking · 24–43px · Edit estimate answers (149×28)
- chromium · laptop · my-services · 24–43px · View all (53×28)
- chromium · desktop · identify · 24–43px · Home (36×24)
- chromium · desktop · identify · 24–43px · Upload a photo instead (156×28)
- chromium · desktop · estimate · 24–43px · Home (36×24)
- chromium · desktop · estimate-result · 24–43px · Home (36×24)
- chromium · desktop · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · desktop · booking · 24–43px · Home (36×24)
- chromium · desktop · booking · 24–43px · INPUT (24×24)
- chromium · desktop · booking · 24–43px · Edit estimate answers (149×28)
- chromium · desktop · my-services · 24–43px · View all (53×28)
