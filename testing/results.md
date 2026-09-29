# Test results — YI Termite & Pest Control web application (Assessment 2)

Run: 2026-09-29 10:48  
Target: https://andy006289.github.io/yi-termite-pest-control/  
Engines: chromium 148.0.7778.96, webkit 26.4, firefox 150.0.2

## Layout checks (7 pages × 4 viewports × 3 engines)

| Engine | Viewport | Pages with horizontal scroll | Min font (px) | Text below AA contrast | Targets < 24px | Targets 24–43px | Nav pattern | Pest grid columns | JS errors |
|---|---|---|---|---|---|---|---|---|---|
| chromium | mobile 390px | none | 12 | 0 | 0 | 8 | hamburger | 1 | 0 |
| chromium | tablet 768px | none | 12 | 0 | 0 | 8 | full nav | 2 | 0 |
| chromium | laptop 1024px | none | 12 | 0 | 0 | 8 | full nav + CTA | 4 | 0 |
| chromium | desktop 1440px | none | 12 | 0 | 0 | 8 | full nav + CTA | 4 | 0 |
| webkit | mobile 390px | none | 12 | 0 | 0 | 9 | hamburger | 1 | 0 |
| webkit | tablet 768px | none | 12 | 0 | 0 | 9 | full nav | 2 | 0 |
| webkit | laptop 1024px | none | 12 | 0 | 0 | 9 | full nav + CTA | 4 | 0 |
| webkit | desktop 1440px | none | 12 | 0 | 0 | 9 | full nav + CTA | 4 | 0 |
| firefox | mobile 390px | none | 12 | 0 | 0 | 8 | hamburger | 1 | 0 |
| firefox | tablet 768px | none | 12 | 0 | 0 | 8 | full nav | 2 | 0 |
| firefox | laptop 1024px | none | 12 | 0 | 0 | 8 | full nav + CTA | 4 | 0 |
| firefox | desktop 1440px | none | 12 | 0 | 0 | 8 | full nav + CTA | 4 | 0 |

## Functional checks

| Engine | Viewport | Test | Result | Detail |
|---|---|---|---|---|
| chromium | mobile | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| chromium | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| chromium | mobile | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'btn btn-primary', 'visible': True, 'outline': True} |
| chromium | mobile | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| chromium | mobile | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| chromium | mobile | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| chromium | mobile | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| chromium | mobile | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |
| chromium | desktop | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| chromium | desktop | Horizontal navigation shows all 5 links | PASS | 5 links |
| chromium | desktop | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'skip-link', 'visible': True, 'outline': True} |
| chromium | desktop | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| chromium | desktop | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| chromium | desktop | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| chromium | desktop | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| chromium | desktop | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |
| webkit | mobile | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| webkit | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| webkit | mobile | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'btn btn-primary', 'visible': True, 'outline': True} |
| webkit | mobile | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| webkit | mobile | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| webkit | mobile | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| webkit | mobile | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| webkit | mobile | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |
| webkit | desktop | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| webkit | desktop | Horizontal navigation shows all 5 links | PASS | 5 links |
| webkit | desktop | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'skip-link', 'visible': True, 'outline': True} |
| webkit | desktop | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| webkit | desktop | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| webkit | desktop | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| webkit | desktop | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| webkit | desktop | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |
| firefox | mobile | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| firefox | mobile | Hamburger menu opens and closes (aria-expanded updates) | PASS | open=True closed=True |
| firefox | mobile | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'btn btn-primary', 'visible': True, 'outline': True} |
| firefox | mobile | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| firefox | mobile | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| firefox | mobile | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| firefox | mobile | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| firefox | mobile | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |
| firefox | desktop | XML data files parse; home grid built from pests.xml (8 cards) | PASS | {'pests': 9, 'pricing': 5, 'timeslots': 3, 'bookings': 3, 'cards': 8} |
| firefox | desktop | Horizontal navigation shows all 5 links | PASS | 5 links |
| firefox | desktop | Keyboard: first Tab shows the skip link / a visible focus | PASS | {'cls': 'skip-link', 'visible': True, 'outline': True} |
| firefox | desktop | Identify: answers re-rank pests (cockroach, then termite) | PASS | German cockroach → Subterranean termite |
| firefox | desktop | Pest guide: card opens details dialog, Escape closes it | PASS | opened=True |
| firefox | desktop | Estimate wizard validates steps and calculates $180–$260 from pricing.xml | PASS | missing answer blocked=True; postcode 2000 blocked=True; $180 – $260 |
| firefox | desktop | Booking: validation, then booking saved as XML and confirmed | PASS | 5 fields flagged; landline rejected=True; saved YI-10395 |
| firefox | desktop | My Services: new booking listed, cancelled in XML, reports shown | PASS | 2 upcoming; status=cancelled; 2 reports |

**Functional: 48/48 passed.**

## Low-contrast text (detail, chromium)


## Small touch targets (detail)

- chromium · mobile · identify · 24–43px · Home (36×24)
- chromium · mobile · estimate · 24–43px · Home (36×24)
- chromium · mobile · estimate-result · 24–43px · Home (36×24)
- chromium · mobile · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · mobile · booking · 24–43px · Home (36×24)
- chromium · mobile · booking · 24–43px · INPUT (24×24)
- chromium · mobile · booking · 24–43px · Edit estimate answers (149×28)
- chromium · tablet · identify · 24–43px · Home (36×24)
- chromium · tablet · estimate · 24–43px · Home (36×24)
- chromium · tablet · estimate-result · 24–43px · Home (36×24)
- chromium · tablet · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · tablet · booking · 24–43px · Home (36×24)
- chromium · tablet · booking · 24–43px · INPUT (24×24)
- chromium · tablet · booking · 24–43px · Edit estimate answers (149×28)
- chromium · laptop · identify · 24–43px · Home (36×24)
- chromium · laptop · estimate · 24–43px · Home (36×24)
- chromium · laptop · estimate-result · 24–43px · Home (36×24)
- chromium · laptop · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · laptop · booking · 24–43px · Home (36×24)
- chromium · laptop · booking · 24–43px · INPUT (24×24)
- chromium · laptop · booking · 24–43px · Edit estimate answers (149×28)
- chromium · desktop · identify · 24–43px · Home (36×24)
- chromium · desktop · estimate · 24–43px · Home (36×24)
- chromium · desktop · estimate-result · 24–43px · Home (36×24)
- chromium · desktop · estimate-result · 24–43px · Get an estimate (95×24)
- chromium · desktop · booking · 24–43px · Home (36×24)
- chromium · desktop · booking · 24–43px · INPUT (24×24)
- chromium · desktop · booking · 24–43px · Edit estimate answers (149×28)
