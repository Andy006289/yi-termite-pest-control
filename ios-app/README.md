# YI Termite & Pest Control — iOS app

ICT6400 Web and Mobile Application Development · Assessment 3 (Mobile Application Development Project) · Trimester 2, 2026

This is the mobile version of the Assessment 2 website (<https://andy006289.github.io/yi-termite-pest-control/>). It follows the same journey: **identify a pest → get an estimate → book a technician → view the service report**. It is built with **React Native + Expo (SDK 57)** and targets **iOS**.

The app reads the **same XML data files** as the website. They are loaded over **HTTPS** from GitHub Pages, so the website and the app share one source of truth.

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS or newer (tested with 24) | <https://nodejs.org> |
| iPhone with **Expo Go** | iOS 16+ | Free from the App Store. Supports Expo SDK 57. |
| Xcode (optional) | latest from the Mac App Store | Only needed for the iOS Simulator or a native build |

## Run the app

```bash
cd Assessment3_YI_Termite_Pest_Control_iOS_App
npm install
npx expo start
```

- **On an iPhone:** connect the phone to the same Wi-Fi as the computer, open the Camera app, and scan the QR code shown in the terminal. The app opens in Expo Go.
  If the networks are different (for example a campus network), run `npx expo start --tunnel` instead.
- **On the iOS Simulator (needs Xcode):** press `i` in the terminal.
- **In a browser (quick preview only):** press `w`. Camera, haptics, PDF sharing and the share sheet only work on a phone.

**Reset the demo:** My Services → Account → *Reset demo data*.

## Checks

```bash
npm test              # 36 Jest unit tests (pricing, quiz, roster, validation, HTTPS, XML storage)
npm run typecheck     # TypeScript, strict mode
npm run lint          # ESLint (eslint-config-expo)
npx expo-doctor       # Expo dependency and config checks
```

## Screens and features

| Screen | File | What it does |
|---|---|---|
| Home | `src/app/(tabs)/index.tsx` | Hero with the two main actions. Preview card showing your last estimate and the next free arrival window. How it works. Pest grid built from `pests.xml` with "from" prices from `pricing.xml`. Call button. Pull to refresh. |
| Pest Guide | `src/app/(tabs)/identify.tsx` | Three-question quiz built from `<quiz>` in `pests.xml`. Every answer re-scores all pests. The *Most likely* card shows the confidence meter, the advice and a second suggestion. |
| Pest details | `src/app/pest/[id].tsx` | iOS modal sheet (swipe down to close): price range, visit length, what is included, preparation steps. |
| Get an estimate | `src/app/(tabs)/estimate.tsx` | Five-step wizard. Each step is validated. The postcode must be in a service zone and uses the number keypad. Photos come from the **camera** or the **photo library** (kept on the phone). The price is revealed on the last step. |
| Your estimate | `src/app/result.tsx` | Price range, line-by-line calculation, what can change the price, and the next three free windows. Tapping a window opens the booking with it pre-selected. |
| Book a service | `src/app/booking.tsx` | Swipeable date strip and arrival windows from `timeslots.xml` (*Popular*, *1 left*, *Full*). Form fields use iOS autofill types and the right keyboards. *Use my saved details* fills in the form. Validation covers required fields, Australian mobiles and optional email. On an error the screen scrolls to the first problem. The booking is saved as XML. |
| Booking confirmed | `src/app/confirmed/[ref].tsx` | Summary and preparation steps. **Add to calendar** creates an `.ics` event and opens the iOS share sheet (→ Calendar). |
| My Services | `src/app/(tabs)/services.tsx` | Segmented control: **Upcoming** (with a native confirmation before cancelling), **Reports**, **Properties** and **Account** (share bookings as XML, reset the demo, open *Data & security*). The tab shows a badge with the number of open requests. |
| Service report | `src/app/report/[ref].tsx` | Findings, treatment, treated areas, recommendations and warranty. **Share PDF** renders the report with `expo-print` and opens the share sheet. |
| Data & security | `src/app/security.tsx` | Evidence for the HTTPS requirement: data source, where each file came from, live request log (status, HSTS header, time), and a button that tries an `http://` request to show it is refused. |

## How the web UI was adapted for iOS

| Website (Assessment 2) | iOS app |
|---|---|
| Header navigation and hamburger menu | Bottom tab bar with 4 tabs within thumb reach, plus a stack navigator for detail screens |
| Two-column layouts (form + summary sidebar) | Single column. Summaries move above the form, and the wizard has a sticky Back / Continue bar |
| `<dialog>` for pest details | Native modal sheet |
| ARIA tabs in My Services | iOS segmented control |
| "Tap again to confirm" cancel button | Native `Alert` with a destructive action |
| Print report / download `.ics` / download XML | `expo-print` PDF + iOS share sheet (Files, AirDrop, Mail, Calendar) |
| `<input type="file">` photos | Camera and photo library through `expo-image-picker`, with permission prompts |
| CSS tokens in `styles.css` | Same colours, radii, spacing and fonts (Poppins + Inter) in `src/lib/theme.ts` |
| SVG sprite (`icons.js`) | The same paths redrawn with `react-native-svg` (`src/components/Icon.tsx`) |
| Hover states | Pressed states and haptic feedback (`expo-haptics`) |
| `localStorage` / `sessionStorage` | `AsyncStorage` (app sandbox) |

Touch targets are at least 44 × 44 pt (Apple HIG). Every control has an accessibility role and label for VoiceOver.

## HTTPS and data security

1. **HTTPS-only network layer** — `src/lib/secureFetch.ts` is the only place that calls `fetch`. It refuses any URL that is not `https://` *before* a request is made, uses a 10-second timeout, and logs every request.
2. **iOS App Transport Security** — ATS blocks cleartext HTTP for the whole app. `app.json` sets `NSAllowsArbitraryLoads: false`, and no domain exceptions are configured.
3. **HTTPS server** — GitHub Pages serves the XML over TLS with `Strict-Transport-Security: max-age=31556952`.
4. **Well-formed data only** — every file is parsed with a strict XML parser. A damaged or partial response is rejected, and the last good copy is used instead.
5. **Offline copy** — the last good response for each file is kept in AsyncStorage. The app still works without a connection, and the Data & security screen shows *Offline copy*.
6. **Personal data stays on the phone** — bookings, contact details and photos are stored only in the app sandbox. Nothing personal is sent over the network. Special characters are escaped by the XML serializer.

The tests in `__tests__/security.test.ts` check points 1, 2, 4 and 5.

## Data

| File (loaded from `https://andy006289.github.io/yi-termite-pest-control/data/`) | Used for |
|---|---|
| `pests.xml` | Pest guide, quiz, advice, preparation steps |
| `pricing.xml` | Estimate rules and service zones |
| `timeslots.xml` | Days, arrival windows, capacity |
| `bookings.xml` | Sample customer, technicians, past visits with service reports |

New bookings are created with the XML DOM (`@xmldom/xmldom`: `createElement`, `setAttribute`, `XMLSerializer`). They use the same `<booking>` structure as `bookings.xml` and are stored as an XML document on the phone.

## Project structure

```
app.json                     Expo config: iOS bundle id, ATS, permissions, splash, plugins
src/app/                     Screens (Expo Router: every file is a route)
  _layout.tsx                Fonts, app data provider, stack navigator
  (tabs)/_layout.tsx         Bottom tab bar
  (tabs)/index|identify|estimate|services.tsx
  pest/[id].tsx  result.tsx  booking.tsx  confirmed/[ref].tsx  report/[ref].tsx  security.tsx
src/components/              Icon (SVG), PestCard, shared UI building blocks (ui.tsx)
src/lib/
  config.ts                  HTTPS data URL, timeout
  secureFetch.ts             HTTPS-only fetch + request log
  xml.ts                     xmldom helpers (parse, serialize, child lookups)
  data.ts                    Load XML (network → offline copy) and parse pests/quiz/pricing/schedule
  pricing.ts  schedule.ts    Estimate calculation and roster (ported from the website)
  store.ts                   Saved estimate and bookings as XML (AsyncStorage)
  validation.ts              Booking form rules
  share.ts                   .ics calendar file, PDF report, XML export through the share sheet
  AppData.tsx                App-wide state (React context)
  theme.ts  format.ts        Design tokens, money/date formatting
__tests__/                   Jest tests + XML fixtures
assets/                      App icon, splash, favicon
```

## Building an installable app (optional)

Expo Go is enough for development and the live demo. For a standalone `.ipa` (TestFlight/App Store) you need an Apple Developer account and EAS Build:

```bash
npx eas-cli@latest build -p ios --profile preview
```
