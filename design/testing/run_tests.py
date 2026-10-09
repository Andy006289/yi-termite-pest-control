"""
Cross-browser / cross-viewport test run for the YI Termite & Pest Control prototype.

Engines : Chromium (Chrome/Edge engine), WebKit (Safari engine), Firefox (Gecko) via Playwright
Viewports: 390x844 mobile, 768x1024 tablet, 1024x768 small desktop, 1440x900 desktop

Usage (from this folder's parent):
    python3 testing/run_tests.py
Writes testing/results.json, testing/results.md and evidence screenshots in testing/screenshots/.
"""
import json, os, sys, http.server, socketserver, threading, functools, datetime
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "testing")
SHOTS = os.path.join(OUT, "screenshots")
PORT = 8768
BASE = f"http://127.0.0.1:{PORT}/mockups/"

PAGES = ["home", "identify", "estimate", "estimate-result", "booking", "booking-confirmed", "my-services"]
VIEWPORTS = [("mobile", 390, 844), ("tablet", 768, 1024), ("laptop", 1024, 768), ("desktop", 1440, 900)]
ENGINES = ["chromium", "webkit", "firefox"]


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


def layout_tests(browser, engine, results):
    for vname, w, h in VIEWPORTS:
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        for p in PAGES:
            page.goto(f"{BASE}{p}.html?clean=1", wait_until="load"); page.evaluate("document.fonts.ready.then(() => 1)")
            page.wait_for_timeout(250)
            m = page.evaluate(LAYOUT_JS)
            m.update(engine=engine, viewport=vname, width=w, page=p, jsErrors=list(errors))
            errors.clear()
            results["layout"].append(m)
            if p == "home":
                d = os.path.join(SHOTS, engine); os.makedirs(d, exist_ok=True)
                page.screenshot(path=os.path.join(d, f"home__{vname}_{w}.png"))
        ctx.close()


def check(results, engine, vname, name, ok, detail=""):
    results["functional"].append(dict(engine=engine, viewport=vname, test=name, passed=bool(ok), detail=detail))


def functional_tests(browser, engine, results):
    d = os.path.join(SHOTS, engine); os.makedirs(d, exist_ok=True)
    for vname, w, h in [("mobile", 390, 844), ("desktop", 1440, 900)]:
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()

        # 1. navigation
        page.goto(f"{BASE}home.html?clean=1", wait_until="load"); page.evaluate("document.fonts.ready.then(() => 1)")
        if vname == "mobile":
            page.click(".menu-btn")
            opened = page.is_visible(".mobile-nav") and page.get_attribute(".menu-btn", "aria-expanded") == "true"
            page.screenshot(path=os.path.join(d, f"menu-open__{vname}.png"))
            page.click(".menu-btn")
            closed = not page.is_visible(".mobile-nav") and page.get_attribute(".menu-btn", "aria-expanded") == "false"
            check(results, engine, vname, "Hamburger menu opens and closes (aria-expanded updates)", opened and closed,
                  f"open={opened} closed={closed}")
        else:
            links = page.eval_on_selector_all(".site-header .nav a", "els => els.filter(e => e.offsetParent).length")
            check(results, engine, vname, "Horizontal navigation shows all 5 links", links == 5, f"{links} visible links")

        # 2. keyboard focus is visible (Safari/WebKit only moves focus to links with Option+Tab by default)
        page.keyboard.press("Alt+Tab" if engine == "webkit" else "Tab")
        focus = page.evaluate("""() => { const e = document.activeElement; const s = getComputedStyle(e);
            return { tag: e.tagName, outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, shadow: s.boxShadow !== 'none' }; }""")
        check(results, engine, vname, "Keyboard focus indicator visible on first Tab stop",
              focus["outline"] or focus["shadow"], f"{focus['tag']} outline={focus['outline']} shadow={focus['shadow']}")

        # 3. pest identification quiz: selecting a card
        page.goto(f"{BASE}identify.html?clean=1", wait_until="load"); page.evaluate("document.fonts.ready.then(() => 1)")
        group = page.locator("[data-select]").first
        idx = group.locator(".choice").evaluate_all("els => els.findIndex(e => !e.classList.contains('selected'))")
        choice = group.locator(".choice").nth(idx)
        choice.click()
        sel_ok = "selected" in (choice.get_attribute("class") or "") and group.locator(".selected").count() == 1
        check(results, engine, vname, "Identify: tapping a pest option selects exactly one card", sel_ok)

        # 4. estimate wizard: forward, back, finish
        page.goto(f"{BASE}estimate.html?clean=1", wait_until="load"); page.evaluate("document.fonts.ready.then(() => 1)")
        label = lambda: page.inner_text("[data-step-label]").strip()
        first = label(); back_disabled = page.is_disabled("[data-prev]")
        for _ in range(4):
            page.click("[data-next]")
        at_last = label()
        page.screenshot(path=os.path.join(d, f"estimate-step5__{vname}.png"))
        page.click("[data-prev]"); after_back = label()
        page.click("[data-next]"); page.click("[data-next]")
        page.wait_for_url("**/estimate-result.html**", timeout=5000)
        check(results, engine, vname, "Estimate wizard: Back disabled on step 1", back_disabled, first)
        check(results, engine, vname, "Estimate wizard: Continue advances 1→5, Back returns to 4",
              first == "Step 1 of 5" and at_last == "Step 5 of 5" and after_back == "Step 4 of 5",
              f"{first} → {at_last} → {after_back}")
        check(results, engine, vname, "Estimate wizard: last step opens the estimate result page",
              "estimate-result.html" in page.url)

        # 5. booking form validation and submission
        page.goto(f"{BASE}booking.html?clean=1", wait_until="load"); page.evaluate("document.fonts.ready.then(() => 1)")
        page.click("form[data-validate] button[type=submit]")
        page.wait_for_timeout(200)
        errs = page.locator(".field.error").count()
        still_here = "booking.html" in page.url
        err_el = page.locator(".field.error").first
        err_el.scroll_into_view_if_needed()
        page.screenshot(path=os.path.join(d, f"booking-errors__{vname}.png"))
        check(results, engine, vname, "Booking: empty submit is blocked and required fields are flagged",
              errs >= 1 and still_here, f"{errs} fields flagged")
        fields = page.locator(".field[data-required]")
        values = ["Test", "User", "0400 000 000", "1 Test Street, Brunswick VIC 3056", "test@example.com"]
        for i in range(fields.count()):
            inp = fields.nth(i).locator("input, select, textarea").first
            tag = inp.evaluate("e => e.tagName")
            if tag == "SELECT":
                inp.select_option(index=1)
            else:
                inp.fill(values[i % len(values)])
        page.click("form[data-validate] button[type=submit]")
        page.wait_for_url("**/booking-confirmed.html**", timeout=5000)
        check(results, engine, vname, "Booking: completed form submits and shows the confirmation page",
              "booking-confirmed.html" in page.url)
        page.screenshot(path=os.path.join(d, f"booking-confirmed__{vname}.png"))
        ctx.close()


def summarise(results):
    L = results["layout"]; F = results["functional"]
    lines = [f"# Test results — YI Termite & Pest Control prototype", "",
             f"Run: {results['run']}  ", f"Engines: " + ", ".join(f"{k} {v}" for k, v in results["versions"].items()), ""]
    lines += ["## Layout checks (7 pages × 4 viewports × 3 engines)", "",
              "| Engine | Viewport | Pages with horizontal scroll | Min font (px) | Text below AA contrast | Targets < 24px | Targets 24–43px | Nav pattern | Pest grid columns | JS errors |",
              "|---|---|---|---|---|---|---|---|---|---|"]
    for e in results["versions"]:
        for vname, w, _ in VIEWPORTS:
            rows = [r for r in L if r["engine"] == e and r["viewport"] == vname]
            hs = [r["page"] for r in rows if r["horizontalScroll"]]
            mf = min(r["minFont"] for r in rows)
            s24 = sum(len(r["small24"]) for r in rows); s44 = sum(len(r["small44"]) for r in rows)
            home = next(r for r in rows if r["page"] == "home")
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
