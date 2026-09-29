"""
Cross-browser / cross-viewport tests for the YI Termite & Pest Control web application (Assessment 2).

Engines  : Chromium (Chrome/Edge), WebKit (Safari, all iPhone browsers), Firefox — via Playwright
Viewports: 390x844 mobile, 768x1024 tablet, 1024x768 small laptop, 1440x900 desktop

What it checks
  layout      every page at every viewport: horizontal scroll, smallest text, WCAG AA text contrast,
              touch-target sizes, navigation pattern, pest-grid columns, JavaScript errors
  functional  real user journeys: menu, keyboard focus, XML data loading, identification quiz,
              pest details dialog, estimate wizard (validation + calculation), booking form
              (validation + XML save), confirmation page, My Services (listing, cancel, reports)

Usage (from the project folder):
    pip install playwright && python3 -m playwright install
    python3 testing/run_tests.py            # all three engines
    python3 testing/run_tests.py webkit     # one engine
    YI_BASE=https://andy006289.github.io/yi-termite-pest-control/ python3 testing/run_tests.py   # the live site
Writes testing/results.json, testing/results.md and evidence screenshots in testing/screenshots/.
"""
import json, os, sys, http.server, socketserver, threading, functools, datetime
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "testing")
SHOTS = os.path.join(OUT, "screenshots")
PORT = 8778
# set YI_BASE to test a deployed copy, e.g. YI_BASE=https://andy006289.github.io/yi-termite-pest-control/
BASE = os.environ.get("YI_BASE", f"http://127.0.0.1:{PORT}/")

PAGES = ["index", "identify", "estimate", "estimate-result", "booking", "booking-confirmed", "my-services"]
VIEWPORTS = [("mobile", 390, 844), ("tablet", 768, 1024), ("laptop", 1024, 768), ("desktop", 1440, 900)]
ENGINES = ["chromium", "webkit", "firefox"]

# a saved estimate, so the result and booking pages have content during layout checks
SEED_ESTIMATE = {"ref": "EST-00001", "createdAt": "2026-09-29T09:00:00+10:00",
                 "answers": {"pest": "cockroach", "property": "house", "size": "3", "area": "both", "postcode": "3056", "pets": False, "notes": ""},
                 "pestName": "Cockroaches", "label": "Cockroach treatment", "duration": "60–90 min", "zoneLabel": "Inner Melbourne",
                 "labels": {"property": "House", "size": "3 bed", "area": "Inside & outside"}, "min": 180, "max": 260,
                 "lines": [{"item": "Cockroach treatment", "basis": "Standard house", "min": 150, "max": 190},
                           {"item": "Property size", "basis": "3 bed", "min": 20, "max": 40, "adjust": True},
                           {"item": "Treatment area", "basis": "Inside & outside", "min": 10, "max": 30, "adjust": True},
                           {"item": "Travel", "basis": "3056 — Inner Melbourne", "min": 0, "max": 0, "adjust": True}], "photos": 0}
PAGE_QUERY = {"booking-confirmed": "?ref=YI-10394"}   # a sample booking from data/bookings.xml


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer.daemon_threads = True
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=httpd.serve_forever, daemon=True).start()

# Runs inside the page: layout measurements for one page at one viewport.
LAYOUT_JS = r"""
() => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const de = document.documentElement;
  // smallest rendered font size among visible text nodes
  let minFont = 99, minFontText = '';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || !vis(el) || el.closest('.note-badge,.note-legend,.proto-bar,svg')) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < minFont) { minFont = fs; minFontText = t.textContent.trim().slice(0, 40); }
  }
  // interactive targets smaller than 24px (WCAG 2.2 AA minimum) and smaller than 44px (design target)
  const sel = 'a[href], button, input, select, textarea, .choice, .slot, .date, .pill';
  const targets = [...document.querySelectorAll(sel)].filter(el => vis(el) && !el.closest('.proto-bar'));
  const small24 = [], small44 = [];
  for (const el of targets) {
    const r = el.getBoundingClientRect();
    const label = (el.innerText || el.getAttribute('aria-label') || el.name || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
    // inline links inside running text are exempt from the WCAG target-size rule
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, small, span');
    if (inline) continue;
    if (r.width < 24 || r.height < 24) small24.push(`${label} (${Math.round(r.width)}×${Math.round(r.height)})`);
    else if (r.width < 44 || r.height < 44) small44.push(`${label} (${Math.round(r.width)}×${Math.round(r.height)})`);
  }
  // elements wider than the viewport
  const overflow = [...document.querySelectorAll('body *')].filter(el => {
    if (!vis(el) || el.closest('.note-legend,.proto-bar')) return false;
    const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 && !el.closest('[style*="overflow"], .date-strip, .scroll-x');
  }).slice(0, 5).map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''));
  const imgs = [...document.querySelectorAll('img')].filter(vis);
  const imgOverflow = imgs.filter(i => i.getBoundingClientRect().width > i.parentElement.getBoundingClientRect().width + 1).length;
  const q = s => document.querySelector(s);
  const shown = s => { const e = q(s); return !!e && vis(e); };
  // pest-card grid columns on the home page
  let gridCols = null;
  const ph = [...document.querySelectorAll('h2')].find(x => /Common Melbourne pests/i.test(x.textContent));
  const pg = ph && ph.closest('section') && ph.closest('section').querySelector('.grid-4');
  const cards = pg ? [...pg.children].filter(vis) : [];
  if (cards.length) { const top = cards[0].getBoundingClientRect().top; gridCols = cards.filter(c => Math.abs(c.getBoundingClientRect().top - top) < 2).length; }
  // WCAG 2.2 AA text contrast (1.4.3): 4.5:1, or 3:1 for large text (>= 24px, or >= 18.66px bold)
  const rgb = c => { const m = c.match(/[\d.]+/g); if (!m) return [0, 0, 0, 0]; const n = m.map(Number);
    if (c.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n.length > 3 ? n[3] : 1];  // color(srgb r g b / a)
    return n; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none') return null;  // image or gradient: not measurable automatically, checked by eye
      const c = rgb(s.backgroundColor); if (c.length < 4 || c[3] > 0.85) return c.slice(0, 3); } return [255, 255, 255]; };
  const lowContrast = []; const seenC = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const t = tw.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || !vis(el) || seenC.has(el) || el.closest('.note-badge,.note-legend,.proto-bar,svg,[disabled],.off,.full,[aria-disabled="true"],.placeholder')) continue;
    seenC.add(el);
    const s = getComputedStyle(el); if (parseFloat(s.opacity) < 1) continue;
    const bg = bgOf(el); if (!bg) continue;
    const fg = rgb(s.color); const a = fg.length > 3 ? fg[3] : 1;
    const f2 = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const l1 = lum(f2), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < need) lowContrast.push(`${t.textContent.trim().slice(0, 28)} (${ratio.toFixed(2)}:1, ${s.color})`);
  }
  return {
    lowContrast,
    scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, horizontalScroll: de.scrollWidth > de.clientWidth + 1,
    minFont, minFontText, small24, small44, targetCount: targets.length, overflow, images: imgs.length, imgOverflow,
    hamburger: shown('.menu-btn'), desktopNav: shown('.nav'), headerCta: shown('.site-header .header-cta'), gridCols,
  };
}
"""


def settle(page):
    """Waits until the page's XML-driven sections have rendered."""
    page.wait_for_load_state("load")
    page.evaluate("document.fonts.ready.then(() => 1)")
    page.wait_for_function("!document.querySelector('[aria-busy=\"true\"]')", timeout=10000)
    page.wait_for_timeout(250)


def layout_tests(browser, engine, results):
    for vname, w, h in VIEWPORTS:
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE + "index.html")
        page.evaluate("e => sessionStorage.setItem('yi.estimate', JSON.stringify(e))", SEED_ESTIMATE)
        for p in PAGES:
            page.goto(f"{BASE}{p}.html{PAGE_QUERY.get(p, '')}")
            settle(page)
            m = page.evaluate(LAYOUT_JS)
            m.update(engine=engine, viewport=vname, width=w, page=p, jsErrors=list(errors))
            errors.clear()
            results["layout"].append(m)
            if p in ("index", "booking"):
                d = os.path.join(SHOTS, engine); os.makedirs(d, exist_ok=True)
                page.screenshot(path=os.path.join(d, f"{p}__{vname}_{w}.png"))
        ctx.close()


def check(results, engine, vname, name, ok, detail=""):
    results["functional"].append(dict(engine=engine, viewport=vname, test=name, passed=bool(ok), detail=str(detail)))


def run(results, engine, vname, name, fn):
    """Runs one test step; an exception is recorded as a failure instead of stopping the run."""
    try:
        ok, detail = fn()
    except Exception as e:  # noqa: BLE001
        ok, detail = False, f"error: {str(e).splitlines()[0][:120]}"
    check(results, engine, vname, name, ok, detail)


def functional_tests(browser, engine, results):
    d = os.path.join(SHOTS, engine); os.makedirs(d, exist_ok=True)
    for vname, w, h in [("mobile", 390, 844), ("desktop", 1440, 900)]:
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto(BASE + "index.html"); settle(page)

        # 1. XML data: every file loads and parses in the browser
        def xml_ok():
            r = page.evaluate("""async () => {
              const out = {};
              for (const f of ['pests', 'pricing', 'timeslots', 'bookings']) {
                const t = await (await fetch(`data/${f}.xml`)).text();
                const x = new DOMParser().parseFromString(t, 'application/xml');
                out[f] = x.getElementsByTagName('parsererror').length ? 'ERROR' : x.documentElement.children.length;
              }
              out.cards = document.querySelectorAll('#pest-grid .pest-card').length;
              return out; }""")
            return all(v != "ERROR" for v in r.values()) and r["cards"] == 8, r
        run(results, engine, vname, "XML data files parse; home grid built from pests.xml (8 cards)", xml_ok)

        # 2. navigation
        if vname == "mobile":
            def menu():
                page.click(".menu-btn"); opened = page.is_visible(".mobile-nav") and page.get_attribute(".menu-btn", "aria-expanded") == "true"
                page.screenshot(path=os.path.join(d, f"menu-open__{vname}.png"))
                page.click(".menu-btn"); closed = not page.is_visible(".mobile-nav")
                return opened and closed, f"open={opened} closed={closed}"
            run(results, engine, vname, "Hamburger menu opens and closes (aria-expanded updates)", menu)
        else:
            run(results, engine, vname, "Horizontal navigation shows all 5 links",
                lambda: (lambda n: (n == 5, f"{n} links"))(page.eval_on_selector_all(".site-header .nav a", "els => els.filter(e => e.offsetParent).length")))

        # 3. keyboard: first Tab lands on the skip link, which is visible when focused
        def focus():
            page.keyboard.press("Alt+Tab" if engine == "webkit" else "Tab")
            f = page.evaluate("""() => { const e = document.activeElement; const s = getComputedStyle(e);
                return { cls: e.className, visible: e.getBoundingClientRect().top >= 0, outline: s.outlineStyle !== 'none' || s.boxShadow !== 'none' || e.classList.contains('skip-link') }; }""")
            return f["visible"] and f["outline"], f
        run(results, engine, vname, "Keyboard: first Tab shows the skip link / a visible focus", focus)

        # 4. identification quiz scores pests from the XML cues
        def quiz():
            page.goto(BASE + "identify.html"); settle(page)
            pick = lambda q, a: page.click(f'[data-question="{q}"] [data-value="{a}"]')
            pick("where", "kitchen"); pick("look", "brown-flat"); pick("count", "few")
            first = page.inner_text("#result h3")
            pick("where", "timber"); pick("look", "pale-soft"); pick("count", "signs")
            second = page.inner_text("#result h3")
            return first == "German cockroach" and second == "Subterranean termite", f"{first} → {second}"
        run(results, engine, vname, "Identify: answers re-rank pests (cockroach, then termite)", quiz)

        def dialog():
            page.click("#guide-grid .pest-card >> nth=3")
            opened = page.is_visible("#pest-dialog") and "Rats" in page.inner_text("#pest-dialog-title")
            page.keyboard.press("Escape"); page.wait_for_timeout(200)
            return opened and not page.is_visible("#pest-dialog"), f"opened={opened}"
        run(results, engine, vname, "Pest guide: card opens details dialog, Escape closes it", dialog)

        # 5. estimate wizard: validation and the calculated range
        def wizard():
            page.goto(BASE + "estimate.html?pest=cockroach"); settle(page)
            page.evaluate("sessionStorage.clear()"); page.reload(); settle(page)
            page.click("#next")                                   # step 1 → 2 (pest pre-selected)
            page.click("#next"); blocked = page.is_visible(".wstep.active .step-error")
            page.click('#opt-property [data-value="house"]'); page.click("#next")
            page.click('#opt-size [data-value="3"]'); page.fill("#postcode", "2000"); page.click("#next")
            pc_blocked = "error" in page.get_attribute("#postcode-field", "class")
            page.fill("#postcode", "3056"); page.click("#next")
            page.click('#opt-area [data-value="both"]'); page.click("#next")
            price = page.inner_text("#sum-price")
            page.screenshot(path=os.path.join(d, f"estimate-step5__{vname}.png"))
            page.click("#next"); page.wait_for_url("**/estimate-result.html"); settle(page)
            total = page.inner_text("tfoot")
            ok = blocked and pc_blocked and price == "$180 – $260" and "$180 – $260" in total
            return ok, f"missing answer blocked={blocked}; postcode 2000 blocked={pc_blocked}; {price}"
        run(results, engine, vname, "Estimate wizard validates steps and calculates $180–$260 from pricing.xml", wizard)

        # 6. booking: validation, then a valid booking saved as XML
        def booking():
            page.click("a.slot >> nth=0"); page.wait_for_url("**/booking.html?**"); settle(page)
            page.click("#submit"); page.wait_for_timeout(200)
            errs = page.locator(".field.error").count()
            page.locator(".field.error").first.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(d, f"booking-errors__{vname}.png"))
            page.fill("#fn", "Test"); page.fill("#ln", "User"); page.fill("#ad", "1 Test St, Brunswick VIC 3056")
            page.fill("#ph", "0312 345 678"); bad_mobile = "error" in page.get_attribute('[data-rule="mobile"]', "class")
            page.fill("#ph", "0412 345 678"); page.check("#terms")
            page.click("#submit"); page.wait_for_url("**/booking-confirmed.html?ref=YI-*"); settle(page)
            ref = page.url.split("ref=")[1]
            xml = page.evaluate("localStorage.getItem('yi.bookings.xml')")
            page.screenshot(path=os.path.join(d, f"booking-confirmed__{vname}.png"))
            ok = errs >= 4 and bad_mobile and ref in xml and "<booking " in xml
            return ok, f"{errs} fields flagged; landline rejected={bad_mobile}; saved {ref}"
        run(results, engine, vname, "Booking: validation, then booking saved as XML and confirmed", booking)

        # 7. My Services lists the new booking and can cancel it
        def services():
            ref = page.url.split("ref=")[1]
            page.goto(BASE + "my-services.html"); page.wait_for_selector(f'[data-cancel="{ref}"]')
            listed = page.locator("#panel-upcoming .booking-card").count()
            page.click(f'[data-cancel="{ref}"]'); page.click(f'[data-cancel="{ref}"]')
            page.wait_for_timeout(400)
            status = page.evaluate("localStorage.getItem('yi.bookings.xml').match(/status=\"(\\w+)\"/)[1]")
            page.click("#tab-reports"); reports = page.locator("[data-report]").count()
            page.screenshot(path=os.path.join(d, f"my-services-reports__{vname}.png"))
            return listed >= 2 and status == "cancelled" and reports == 2, f"{listed} upcoming; status={status}; {reports} reports"
        run(results, engine, vname, "My Services: new booking listed, cancelled in XML, reports shown", services)
        ctx.close()


def summarise(results):
    L = results["layout"]; F = results["functional"]
    lines = [f"# Test results — YI Termite & Pest Control web application (Assessment 2)", "",
             f"Run: {results['run']}  ", f"Target: {BASE}  ", f"Engines: " + ", ".join(f"{k} {v}" for k, v in results["versions"].items()), ""]
    lines += ["## Layout checks (7 pages × 4 viewports × 3 engines)", "",
              "| Engine | Viewport | Pages with horizontal scroll | Min font (px) | Text below AA contrast | Targets < 24px | Targets 24–43px | Nav pattern | Pest grid columns | JS errors |",
              "|---|---|---|---|---|---|---|---|---|---|"]
    for e in results["versions"]:
        for vname, w, _ in VIEWPORTS:
            rows = [r for r in L if r["engine"] == e and r["viewport"] == vname]
            hs = [r["page"] for r in rows if r["horizontalScroll"]]
            mf = min(r["minFont"] for r in rows)
            s24 = sum(len(r["small24"]) for r in rows); s44 = sum(len(r["small44"]) for r in rows)
            home = next(r for r in rows if r["page"] == "index")
            nav = "hamburger" if home["hamburger"] else ("full nav + CTA" if home["headerCta"] else "full nav")
            je = sum(len(r["jsErrors"]) for r in rows)
            lc = sum(len(r["lowContrast"]) for r in rows)
            lines.append(f"| {e} | {vname} {w}px | {', '.join(hs) or 'none'} | {mf:g} | {lc} | {s24} | {s44} | {nav} | {home['gridCols']} | {je} |")
    lines += ["", "## Functional checks", "", "| Engine | Viewport | Test | Result | Detail |", "|---|---|---|---|---|"]
    for r in F:
        lines.append(f"| {r['engine']} | {r['viewport']} | {r['test']} | {'PASS' if r['passed'] else 'FAIL'} | {r['detail']} |")
    passed = sum(r["passed"] for r in F)
    lines += ["", f"**Functional: {passed}/{len(F)} passed.**", ""]
    # detail lists for small targets
    lines += ["## Low-contrast text (detail, chromium)", ""]
    seenlc = set()
    for r in L:
        if r["engine"] != "chromium": continue
        for t in r["lowContrast"]:
            if (r["page"], t) in seenlc: continue
            seenlc.add((r["page"], t)); lines.append(f"- {r['viewport']} · {r['page']} · {t}")
    lines += ["", "## Small touch targets (detail)", ""]
    seen = set()
    for r in L:
        for kind in ("small24", "small44"):
            for t in r[kind]:
                key = (r["viewport"], r["page"], kind, t)
                if key in seen or r["engine"] != "chromium":
                    continue
                seen.add(key)
                lines.append(f"- chromium · {r['viewport']} · {r['page']} · {'<24px' if kind == 'small24' else '24–43px'} · {t}")
    return "\n".join(lines) + "\n"


def main():
    only = sys.argv[1:] or ENGINES
    results = {"run": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "versions": {}, "layout": [], "functional": []}
    with sync_playwright() as pw:
        for e in only:
            b = getattr(pw, e).launch()
            results["versions"][e] = b.version
            print(f"[{e} {b.version}] layout…", flush=True); layout_tests(b, e, results)
            print(f"[{e}] functional…", flush=True); functional_tests(b, e, results)
            b.close()
    json.dump(results, open(os.path.join(OUT, "results.json"), "w"), indent=1)
    md = summarise(results)
    open(os.path.join(OUT, "results.md"), "w").write(md)
    print(md)


if __name__ == "__main__":
    main()
