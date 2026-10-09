# Testing findings — YI Termite & Pest Control prototype (28 Sep 2026)

## Method

Automated run with Playwright 1.60 (`testing/run_tests.py`) against the HTML prototype in `mockups/`.

| Engine | Version | Represents |
|---|---|---|
| Chromium | 148.0.7778.96 | Google Chrome, Microsoft Edge, Samsung Internet |
| WebKit | 26.4 | Safari on macOS and every browser on iPhone/iPad |
| Firefox (Gecko) | 150.0.2 | Mozilla Firefox |

Viewports: 390×844 (mobile), 768×1024 (tablet), 1024×768 (small laptop), 1440×900 (desktop).
Seven pages were checked at every viewport in every engine (84 page loads). Eight task flows were run at mobile and desktop in each engine (48 checks).

Layout checks per page: horizontal scrolling, smallest rendered font size, text contrast against its actual background (WCAG 2.2 SC 1.4.3: 4.5:1, or 3:1 for large text), interactive targets below 24 px (the WCAG 2.2 AA minimum, SC 2.5.8) and below 44 px (the design's own touch-target token), elements wider than the viewport, navigation pattern, pest-card grid columns, and JavaScript errors.

Task flows: open/close the mobile menu, visible keyboard focus, select an answer in the identification quiz, move forward and back through the 5-step estimate wizard to the result, submit the booking form empty (validation), then fill it in and submit (confirmation).

## Round 1: defects found

| # | Defect | Where | Evidence |
|---|---|---|---|
| 1 | The brand name wrapped onto two lines and pushed the navigation 9 px past the viewport (horizontal scroll) | Header at 768 px; "Book now" button cut off at 1024 px | scrollWidth 776 at 768 px; CTA right edge at 1025 px |
| 2 | Text rendered below 12 px, which is smaller than the style guide's minimum | Logo sub-line "MELBOURNE" (11.2 px), section eyebrows (11.5 px), date-strip weekdays and slot badges (11.2 px) | Min font 11.2 px on all pages |
| 3 | Ten interactive targets per viewport were smaller than 24 px (WCAG 2.2 AA failure) | Breadcrumb links (36×20), "Upload a photo instead", "View all", "Edit estimate answers" (≈17–22 px tall), booking checkboxes (20×20) | 10 targets < 24 px at every viewport |
| 4 | Pill selectors, small buttons and the logo link were 37–40 px tall, below the 44 px touch target the style guide promises | Quiz pills, Yes/No, "Book", "Reschedule", "Download PDF", logo | 27–34 targets in the 24–43 px band |
| 5 | No keyboard focus on the first Tab press in WebKit | All pages, WebKit only | activeElement stayed on BODY |
| 6 | Text below the WCAG AA contrast ratio | Grey hint/metadata text Ink 3 #90A4AE (2.4:1), eyebrow labels in Green 500 #2E8B5A (4.0:1), amber badge text #DD8A1E on Amber 100 (2.3:1), error text #D64545 (4.4:1), blue status text (3.8:1), footer "MELBOURNE" on dark green (2.5:1) | 86–94 text elements per viewport across the 7 pages |

## Fixes (all in `assets/base.css`, pages regenerated with `build.py`)

1. The logo name no longer wraps. The logo is scaled to 0.95 rem on tablet, and nav item padding is tightened (9→7 px on tablet, 14→10 px on desktop).
2. The logo sub-line, `.eyebrow`, `.date small` and `.slot .badge` now use 0.75 rem (12 px).
3. Breadcrumb links and standalone `a.small` links are `inline-flex` with `min-height: 24px`. Checkboxes are 24×24 px.
4. `.pill` and `.btn-sm` now use `min-height: var(--tap)` (44 px). The `.logo` link also gets `min-height: 44px`.
5. No change needed. Safari only moves focus to links with Option+Tab unless "Press Tab to highlight each item" is enabled. With Option+Tab, WebKit shows the focus ring. The prototype already styles `:focus-visible`.

6. Colour tokens changed: Ink 3 → #5F737C (4.7:1), Green 500 → #237A4F (5.0:1), Danger → #BF3434 (5.6:1), Info → #1F5BD6 (5.0:1 on Info 100). A new Amber 700 #94580A (4.9:1) token is used for amber badge text, and the footer sub-line is now 75% white. The style guide swatches were updated to match; it had described Ink 3 as "large/UI only", but the pages had used it for small text.

## Round 2: re-test after fixes

- Horizontal scroll: none, on 84 of 84 page loads.
- Minimum font size: 12 px in every engine and at every viewport.
- Text below AA contrast: 0 in every engine and at every viewport. Text on gradient or image backgrounds (hero, dark CTA band) was checked by eye: white on dark green, and dark green on a near-white gradient.
- Targets below 24 px: 0.
- Targets 24–43 px: 10–11 per viewport. These are all intentional secondary controls that meet the WCAG 2.2 AA minimum: breadcrumb links, three inline text links, and the 24 px checkboxes, whose whole label row is clickable.
- Responsive behaviour confirmed:
  - Navigation: hamburger below 768 px, horizontal nav at 768 px and above, header CTA at 1024 px and above.
  - Pest grid: 1 column on mobile, 2 on tablet, 4 on laptop and desktop.
- JavaScript errors: 0.
- Task flows: **48 of 48 passed** (see `results.md`).

## Still to do by hand

These cannot be automated from here. Record the device, browser and result for each.

- [ ] Real iPhone (Safari): open the prototype over the local network (`python3 -m http.server 8766` on the Mac, then `http://<Mac-IP>:8766/` on the phone). Run the booking flow and check the date strip scrolls sideways and the keyboard type is right for Mobile/Email.
- [ ] Real Android phone or tablet (Chrome), if available.
- [ ] Desktop Safari on the Mac: do a quick visual pass of Home and Booking at full width.
