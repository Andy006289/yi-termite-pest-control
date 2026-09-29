# YI Termite & Pest Control — web application

ICT6400 Web and Mobile Application Development · Assessment 2 (Web Programming Project) · Trimester 2, 2026

A responsive website for Melbourne householders. It follows one journey: **identify a pest → get an estimate → book a technician → view the service report**. It implements the Assessment 1 wireframes, mockups and style guide using HTML5, CSS3 and JavaScript. All application data is kept in XML.

## How to run it

The pages load their data from XML files with `fetch()`. Browsers block `fetch()` on pages opened straight from disk (`file://`), so the site must be served by a local web server:

```bash
cd Assessment2_YI_Termite_Pest_Control_App
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

Any static server works, for example VS Code's *Live Server* extension or `npx serve`. The site has no build step, no dependencies and no back end. It works in current Chrome, Edge, Safari and Firefox.

To try the site on a phone, connect it to the same Wi-Fi as the computer and open `http://<computer's IP address>:8000/`.

**Reset the demo:** My Services → Account → *Reset demo data*. This removes the bookings made in your browser.

## Pages and features

| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Pest grid built from `pests.xml`, with "from" prices from `pricing.xml`. The hero preview card shows your last estimate and the next free arrival window. |
| Pest Guide | `identify.html` | Three-question identification quiz built from `<quiz>` in `pests.xml`. Every answer re-scores all pests against their `<cue>` weights and updates the "Most likely" panel live: confidence meter, safety advice and a second suggestion. The guide cards open a details dialog; `identify.html?pest=rodent` opens it directly. |
| Get an Estimate | `estimate.html` | Five-step wizard. Each step is validated before Continue. The postcode must fall inside a service zone in `pricing.xml`. The price range is calculated from the pricing rules and revealed on the last step. Optional photo previews. |
| Estimate result | `estimate-result.html` | Price range, a line-by-line breakdown of the calculation, what is included and what can change the price (`pests.xml`), and the next three free windows (`timeslots.xml`), which link to the booking page pre-selected. |
| Book a Service | `booking.html` | The next nine days and six arrival windows come from the roster in `timeslots.xml`. Each window shows *Popular*, *1 left* or *Full* after existing demand and your own bookings are counted. Form validation covers required fields, Australian mobile numbers (landlines are rejected, `+61` is normalised), optional email format and the pricing acknowledgement. Errors appear inline, are summarised, and move focus to the first problem. A valid booking is saved as XML. |
| Booking confirmed | `booking-confirmed.html` | Summary of the saved booking, preparation steps for that pest (`pests.xml`), and an **Add to calendar** `.ics` file generated in the browser. |
| My Services | `my-services.html` | Tabbed dashboard (click or arrow keys) that merges the sample account in `bookings.xml` with bookings made in the browser. **Upcoming**: bookings made in the app can be cancelled (their XML status becomes `cancelled`). **Service reports**: printable reports. **Properties**: visit history per address. **Account**: download your bookings as XML, or reset the demo. |

## How XML is used

| File | Contents | Used by |
|---|---|---|
| `data/pests.xml` | 8 pests (name, species, advice, what is included, preparation steps, identification cues with weights) and the quiz questions | Home, Pest Guide, Estimate, Result, Booking, Confirmation |
| `data/pricing.xml` | Base range per pest, property factors, size and area adjustments, service zones by postcode with travel cost | Estimate, Result, Booking |
| `data/timeslots.xml` | Arrival windows with capacity, opening days (Saturday closes at 1pm, Sunday closed), existing demand per weekday | Home, Result, Booking, My Services |
| `data/bookings.xml` | Sample customer, technicians, one upcoming booking and two completed bookings with service reports | My Services, Confirmation |

- **Reading:** `js/data.js` fetches each file once per page, parses it with `DOMParser`, reports files that are missing or not well-formed, and converts elements into plain objects (`getPests`, `getQuiz`, `getPricing`, `getSchedule`, …).
- **Writing:** `js/store.js` builds each new booking as a `<booking>` element with the XML DOM (`createElement`, `setAttribute`). It uses the same structure as `bookings.xml`, adds the booking to a `<localBookings>` document, and saves it in `localStorage` with `XMLSerializer`. My Services reads it back with `DOMParser` and merges it with `bookings.xml`.
- **Validation:** every file has an XML Schema in `data/schema/`. The schemas define types (postcodes, times, `YI-00000` references, Australian mobiles), allowed values and unique ids. Bookings created by the app follow `bookings.xsd` as well. To check the files:

  ```bash
  cd data
  for f in pests pricing timeslots bookings; do xmllint --noout --schema schema/$f.xsd $f.xml; done
  ```

- Upcoming sample visits use `daysFromToday` rather than fixed dates, so the demo never shows past appointments.

## Project structure

```
index.html … my-services.html   7 pages (semantic HTML5: header/nav/main/footer, labelled forms, ARIA tabs and live regions)
css/styles.css                  design tokens and components from the Assessment 1 style guide;
                                mobile-first, media queries at 768px and 1024px; A2 additions at the end
js/
  icons.js                      SVG icon sprite (UI icons i-*, pest glyphs p-*)
  ui.js                         shared helpers: DOM, escaping, money/date formatting, menu, option groups, toasts
  data.js                       XML loading and pests.xml queries, including the identification scoring
  pricing.js                    pricing.xml rules and the estimate calculation
  schedule.js                   timeslots.xml roster and remaining places per window
  store.js                      saved estimate (sessionStorage) and bookings as XML (localStorage)
  components.js                 HTML snippets used on several pages
  pages/*.js                    one ES module per page
data/*.xml, data/schema/*.xsd   sample data and XML Schemas
testing/run_tests.py            automated cross-browser tests (see below)
```

## Responsive design

The layout is mobile-first: the base styles serve phones with a single column, and media queries add layout at **768px** (horizontal navigation, two-column cards and forms, a sidebar in My Services) and **1024px** (header call to action, four-column pest grid, three-column wizard, sticky summaries). Widths are fluid (92% container, up to 1200px), images and icons scale inside aspect-ratio boxes, and the date strip scrolls sideways on narrow screens. Touch targets are 44px for primary controls and at least 24px elsewhere, and every text colour meets WCAG 2.2 AA contrast.

## Testing

`testing/run_tests.py` runs the site in **Chromium, WebKit (Safari's engine) and Firefox** at **390, 768, 1024 and 1440px** using Playwright:

- **Layout:** each of the 7 pages at each viewport in each engine (84 page loads). Checks horizontal scrolling, smallest text, WCAG AA text contrast, touch-target sizes, navigation pattern, grid columns and JavaScript errors.
- **Functional:** 8 journeys at mobile and desktop widths in each engine (48 checks). Covers XML loading, the menu, keyboard focus, quiz scoring, the details dialog, wizard validation and the calculated price, booking validation and the XML save, and cancelling in My Services.

```bash
pip install playwright && python3 -m playwright install chromium webkit firefox
python3 testing/run_tests.py
```

Results are written to `testing/results.md` and `testing/results.json`, and evidence screenshots to `testing/screenshots/`. The latest run passed 48 of 48 checks, with no horizontal scrolling, no text below AA contrast and no JavaScript errors.

## Limitations

This is a front-end prototype with no server. Bookings and estimates are stored only in the browser that made them, photos are previewed but not uploaded, and no SMS or payment is sent. The pricing, roster, customer and reviews are sample data for the demonstration.

## Credits

Fonts: Poppins and Inter (Google Fonts, SIL Open Font License). Icons are drawn for this project. All content is fictional sample data.
