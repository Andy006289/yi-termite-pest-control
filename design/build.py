#!/usr/bin/env python3
"""Builds mockups/ (hi-fi) and wireframes/ (lo-fi) pages from the shared templates below.
Run:  python3 build.py
"""
import os, re
ROOT = os.path.dirname(os.path.abspath(__file__))

NAV = [("home.html","Home"),("identify.html","Pest Guide"),("estimate.html","Get an Estimate"),("booking.html","Book a Service"),("my-services.html","My Services")]

def head(title, skin):
    return f'''<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · YI Termite &amp; Pest Control ({'Wireframe' if skin=='wire' else 'Mockup'})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/base.css">
</head>
<body class="{skin}">
'''

def header(current):
    links = "".join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if h==current else '', t) for h,t in NAV)
    mlinks = "".join(f'<a href="{h}">{t}<svg width="18" height="18"><use href="#i-chev"/></svg></a>' for h,t in NAV)
    return f'''
<header class="site-header" data-note-m="Sticky compact header (64px). Navigation collapses into a hamburger menu so the logo and menu button both stay within thumb reach; the primary CTA moves inside the menu." data-note-t="At ≥768px the hamburger is replaced by the full horizontal navigation with tighter padding; the header CTA is held back until desktop so five items fit on one line." data-note-d="Full-width sticky header with all five navigation items and the amber Book Now CTA. Background is semi-transparent with blur so content context is kept while scrolling.">
  <div class="container header-inner">
    <a class="logo" href="home.html"><span class="logo-mark"><svg><use href="#i-bug"/></svg></span><span>YI Termite &amp; Pest Control<small>Melbourne</small></span></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <a class="btn btn-accent btn-sm header-cta" href="booking.html">Book now</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu"><svg class="ico-menu"><use href="#i-menu"/></svg><svg class="ico-close"><use href="#i-close"/></svg></button>
  </div>
  <div class="mobile-nav" id="mobile-nav"><div class="container">{mlinks}<a class="btn btn-accent" href="booking.html">Book now</a></div></div>
</header>
'''

FOOTER = '''
<footer class="site-footer" data-note-m="Footer columns stack into a single column; link lists remain full-width tap targets." data-note-t="Footer becomes a 4-column grid (brand column wider) at ≥768px." data-note-d="Four-column footer grid: brand summary + three link groups.">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="logo" href="home.html"><span class="logo-mark"><svg><use href="#i-bug"/></svg></span><span>YI Termite &amp; Pest Control<small>Melbourne</small></span></a>
        <p class="small" style="margin-top:12px;max-width:340px;opacity:.85">Identify the pest, get an upfront estimate and book a licensed technician — all from your phone.</p>
      </div>
      <div><h4>Services</h4><ul><li><a href="#">Cockroaches</a></li><li><a href="#">Ants</a></li><li><a href="#">Spiders</a></li><li><a href="#">Rodents</a></li><li><a href="#">Termite inspection</a></li></ul></div>
      <div><h4>Company</h4><ul><li><a href="#">About</a></li><li><a href="#">Service areas</a></li><li><a href="#">Licences &amp; insurance</a></li><li><a href="#">Contact</a></li></ul></div>
      <div><h4>Help</h4><ul><li><a href="#">Pricing guide</a></li><li><a href="#">FAQs</a></li><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© 2026 YI Termite &amp; Pest Control · ICT6400 design concept</span><span>Licensed pest management technicians · VIC</span></div>
  </div>
</footer>
<script src="../assets/app.js"></script>
</body>
</html>
'''

PESTS = [
  ("cockroach","Cockroaches","Kitchens, bathrooms, warm appliances","from $150","Common"),
  ("ant","Ants","Trails near food, paving, gardens","from $140","Common"),
  ("spider","Spiders","Eaves, sheds, window frames","from $160","Common"),
  ("rodent","Rats &amp; mice","Roof spaces, walls, pantries","from $190","Urgent"),
  ("termite","Termites","Timber, skirting, mud tubes","Inspection $220","Inspect first"),
  ("wasp","Wasps &amp; bees","Nests under eaves, in walls","from $180","Seasonal"),
  ("bedbug","Bed bugs","Mattress seams, bed frames","from $260","Multi-visit"),
  ("flea","Fleas","Carpets, pet bedding, yards","from $170","Common"),
]
def pest_cards(limit=8):
    out=[]
    for key,name,where,price,tag in PESTS[:limit]:
        cls = "badge-red" if tag=="Urgent" else "badge-amber" if tag in ("Inspect first","Multi-visit") else ""
        out.append(f'''<a class="card card-hover pest-card" href="identify.html">
        <div class="pest-visual" data-label="Photo"><svg><use href="#p-{key}"/></svg></div>
        <h3>{name}</h3><p class="small muted" style="margin:0">{where}</p>
        <div class="meta"><span class="small" style="font-weight:600">{price}</span><span class="badge {cls}">{tag}</span></div></a>''')
    return "\n".join(out)

# ------------------------------------------------------------------ HOME
HOME = '''
<section class="hero">
  <div class="container hero-grid">
    <div data-note-m="Hero stacks: heading, lead copy, then two full-width CTAs so the primary actions are reachable without scrolling on a 390px screen." data-note-d="Two-column hero (1.1fr / 0.9fr). Copy left, live estimate preview right, giving desktop users an immediate sense of the product outcome.">
      <div class="eyebrow">Melbourne · Residential pest control</div>
      <h1>Know the pest.<br>Know the <em>price</em>.<br>Book in minutes.</h1>
      <p class="lead">Snap a photo or answer three quick questions to identify what you've found, see an upfront estimate, and lock in a licensed technician — no phone call needed.</p>
      <div class="hero-actions" data-note="Two CTAs, one primary (green) and one accent (amber). Buttons are pill-shaped, 48px tall — above the WCAG 2.2 target minimum — and become full-width on mobile.">
        <a class="btn btn-primary" href="identify.html"><svg><use href="#i-search"/></svg> Identify a pest</a>
        <a class="btn btn-accent" href="estimate.html"><svg><use href="#i-dollar"/></svg> Get an estimate</a>
      </div>
      <div class="trust"><ul>
        <li><svg><use href="#i-shield"/></svg> Licensed &amp; insured technicians</li>
        <li><svg><use href="#i-clock"/></svg> Same-week appointments</li>
        <li><svg><use href="#i-check"/></svg> Upfront price ranges</li>
      </ul></div>
    </div>
    <div class="preview" data-note-m="Estimate preview card is shown after the CTAs on mobile so it never pushes the primary actions below the fold." data-note-d="Estimate preview card floats with two overlapping status chips (booking confirmed / technician assigned) to illustrate the end-to-end flow.">
      <div class="card preview-card">
        <div class="row between"><span class="badge">Indicative estimate</span><span class="tiny muted">2 min ago</span></div>
        <div class="result-hero" style="margin-top:16px">
          <div class="pest-visual" data-label="Pest"><svg><use href="#p-cockroach"/></svg></div>
          <div><div class="tiny muted">Likely pest</div><h3 style="margin:0 0 4px">German cockroach</h3><span class="badge badge-amber"><span class="dot"></span> Kitchen · 3-bed house</span></div>
        </div>
        <div class="divider"></div>
        <div class="row between"><div><div class="tiny muted">Indicative range</div><div class="price">$180 – $260</div></div><a class="btn btn-primary btn-sm" href="booking.html">Book</a></div>
        <p class="tiny muted" style="margin:12px 0 0">Final price confirmed by technician after inspection.</p>
      </div>
      <div class="preview-float a"><span class="ico ico-amber" style="width:32px;height:32px;border-radius:9px"><svg style="width:16px;height:16px"><use href="#i-cal"/></svg></span> Thu 17 Sep · 9–11am</div>
      <div class="preview-float b"><span class="ico" style="width:32px;height:32px;border-radius:9px"><svg style="width:16px;height:16px"><use href="#i-check"/></svg></span> Technician confirmed</div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head"><div class="eyebrow">How it works</div><h2>From “what is that?” to “sorted” in four steps</h2></div>
    <div class="grid grid-4" data-note-m="Process steps stack vertically in reading order." data-note-t="Steps arrange as a 2×2 grid." data-note-d="Four equal columns, one per journey stage: Identify → Estimate → Book → Report.">
      <div class="card step"><div class="step-num">1</div><h3>Identify</h3><p class="small muted" style="margin:0">Browse pest cards or answer three questions about what you saw and where.</p></div>
      <div class="card step"><div class="step-num">2</div><h3>Estimate</h3><p class="small muted" style="margin:0">Tell us your property type and size to get an honest price range instantly.</p></div>
      <div class="card step"><div class="step-num">3</div><h3>Book</h3><p class="small muted" style="margin:0">Pick a date and a 2-hour window. We confirm your technician within the hour.</p></div>
      <div class="card step"><div class="step-num">4</div><h3>Report</h3><p class="small muted" style="margin:0">Get a digital service report with findings, treatment and follow-up advice.</p></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="row between" style="margin-bottom:24px"><div><div class="eyebrow">Pest guide</div><h2 style="margin:0">Common Melbourne pests</h2></div><a class="btn btn-ghost btn-sm" href="identify.html">Not sure? Identify it <svg><use href="#i-arrow"/></svg></a></div>
    <div class="grid grid-4" data-note-m="Pest cards are a single column at <768px; each card is a full-width tap target with the price and status visible without opening it." data-note-t="Cards become a 2-column grid; images keep a fixed 4:3 aspect ratio via CSS aspect-ratio so rows stay aligned." data-note-d="Four-column card grid at ≥1024px. Card images are flexible (max-width:100%, aspect-ratio 4/3) so they scale with the column width rather than the viewport.">
''' + pest_cards() + '''
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="stats" data-note-m="Stats strip stacks: heading first, then three stat blocks." data-note-d="Dark brand panel with heading and three key figures side by side.">
      <div class="stats-title"><div class="eyebrow" style="color:var(--amber-500)">Why YI Termite &amp; Pest Control</div><h2 style="margin:0">Transparent, fast and fully digital</h2></div>
      <div class="stat"><b>&lt;60s</b><span>to an indicative price range</span></div>
      <div class="stat"><b>2-hr</b><span>arrival windows you choose</span></div>
      <div class="stat"><b>100%</b><span>of jobs get a digital report</span></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container grid grid-2" style="gap:32px">
    <div class="stack">
      <div class="feature"><span class="ico"><svg><use href="#i-search"/></svg></span><div><h3>Visual identification, not jargon</h3><p class="small muted" style="margin:0">Compare photos and simple cues — where you saw it, size, colour — instead of scrolling service menus.</p></div></div>
      <div class="feature"><span class="ico ico-amber"><svg><use href="#i-dollar"/></svg></span><div><h3>Ranges, not surprises</h3><p class="small muted" style="margin:0">We show a realistic min–max before you commit and explain what can change it.</p></div></div>
      <div class="feature"><span class="ico"><svg><use href="#i-doc"/></svg></span><div><h3>A record you can keep</h3><p class="small muted" style="margin:0">Every visit produces a digital report — handy for landlords, tenants and insurance.</p></div></div>
    </div>
    <div class="card">
      <div class="stars"><svg style="width:16px;height:16px;display:inline"><use href="#i-star"/></svg><svg style="width:16px;height:16px;display:inline"><use href="#i-star"/></svg><svg style="width:16px;height:16px;display:inline"><use href="#i-star"/></svg><svg style="width:16px;height:16px;display:inline"><use href="#i-star"/></svg><svg style="width:16px;height:16px;display:inline"><use href="#i-star"/></svg></div>
      <p class="quote" style="margin-top:12px">“I photographed the thing in my pantry at 10pm, had a price by 10:02 and a technician booked for Thursday. The report even told me what to seal up.”</p>
      <div class="row"><span class="ico" style="border-radius:50%"><svg><use href="#i-user"/></svg></span><div><b>Priya N.</b><div class="small muted">Renter · Brunswick</div></div></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band" data-note-m="CTA band stacks text over a full-width button." data-note-d="CTA band uses two columns: message left, action right.">
      <div><h2>Found something you'd rather not have?</h2><p>Get an upfront estimate in under a minute. No account needed.</p></div>
      <a class="btn btn-accent" href="estimate.html">Start your estimate <svg><use href="#i-arrow"/></svg></a>
    </div>
  </div>
</section>
'''

# ------------------------------------------------------------------ IDENTIFY
IDENTIFY = '''
<div class="container page-head">
  <div class="breadcrumb"><a href="home.html">Home</a><span>/</span><span>Pest guide</span></div>
  <h1 style="font-size:clamp(1.7rem,4vw,2.5rem)">Identify your pest</h1>
  <p class="lead muted" style="max-width:600px">Answer three quick questions. We'll suggest the most likely pest and the right service — you can still browse the full guide below.</p>
</div>

<div class="container grid identify-layout" style="gap:24px;align-items:start">
  <div class="card" data-note-m="The quiz is a single column; each question's options are 2-per-row tiles with icon + label, 96px tall for easy tapping." data-note-t="Option tiles move to 3 per row." data-note-d="Quiz occupies the main column; the live result panel sits in a 340px sidebar and updates as answers change.">
    <div class="row between" style="margin-bottom:16px"><span class="badge"><span class="dot"></span> Question 1 of 3</span><a class="small" href="#" style="color:var(--green-700);font-weight:600">Upload a photo instead</a></div>
    <h2 style="font-size:1.4rem">Where did you see it?</h2>
    <div class="choices cols-3" data-select data-out="where" style="margin-bottom:28px">
      <button class="choice selected" data-value="Kitchen"><svg><use href="#i-home"/></svg>Kitchen<small>benches, appliances</small></button>
      <button class="choice" data-value="Bathroom"><svg><use href="#i-inside"/></svg>Bathroom<small>drains, damp areas</small></button>
      <button class="choice" data-value="Roof / walls"><svg><use href="#i-house"/></svg>Roof or walls<small>noises, droppings</small></button>
      <button class="choice" data-value="Bedroom"><svg><use href="#i-apt"/></svg>Bedroom<small>bed, mattress</small></button>
      <button class="choice" data-value="Garden / exterior"><svg><use href="#i-leaf"/></svg>Garden / outside<small>eaves, paving</small></button>
      <button class="choice" data-value="Timber"><svg><use href="#i-warn"/></svg>Timber or skirting<small>mud tubes, hollow sound</small></button>
    </div>

    <h2 style="font-size:1.4rem">What did it look like?</h2>
    <div class="choices" data-select data-out="look" style="margin-bottom:28px" data-note="Answer tiles use pest glyphs plus plain-language labels, and a text description in small type, so users don't need to know species names.">
      <button class="choice selected" data-value="Brown, flat, fast"><svg><use href="#p-cockroach"/></svg>Brown &amp; flat<small>runs fast, 1–2 cm</small></button>
      <button class="choice" data-value="Tiny, in a line"><svg><use href="#p-ant"/></svg>Tiny, in trails<small>black or brown</small></button>
      <button class="choice" data-value="Eight legs"><svg><use href="#p-spider"/></svg>Eight legs<small>web nearby</small></button>
      <button class="choice" data-value="Furry, tail"><svg><use href="#p-rodent"/></svg>Furry with tail<small>droppings, gnawing</small></button>
      <button class="choice" data-value="Pale, soft"><svg><use href="#p-termite"/></svg>Pale &amp; soft<small>in timber, wings shed</small></button>
      <button class="choice" data-value="Striped, flying"><svg><use href="#p-wasp"/></svg>Striped, flying<small>nest nearby</small></button>
      <button class="choice" data-value="Bites at night"><svg><use href="#p-bedbug"/></svg>Bites at night<small>marks on sheets</small></button>
      <button class="choice" data-value="Jumps"><svg><use href="#p-flea"/></svg>Jumps<small>pets scratching</small></button>
    </div>

    <h2 style="font-size:1.4rem">How many have you seen?</h2>
    <div class="pills" data-select data-out="count" data-note="Pill selectors are 44px tall (the design's minimum touch target) with generous horizontal padding; they wrap onto new lines on narrow screens rather than shrinking.">
      <button class="pill">Just one</button><button class="pill selected">A few</button><button class="pill">Lots / daily</button><button class="pill">Signs only (droppings, damage)</button>
    </div>
  </div>

  <aside class="card summary" data-note-m="Result panel drops beneath the quiz on mobile. Its CTA carries the pest and location into the estimate flow so nothing is re-typed." data-note-d="Sticky result sidebar: likely pest, confidence bar, safety guidance and a CTA that pre-fills the estimate wizard.">
    <div class="eyebrow">Most likely</div>
    <div class="result-hero"><div class="pest-visual" data-label="Pest"><svg><use href="#p-cockroach"/></svg></div><div><h3 style="margin:0 0 4px">German cockroach</h3><span class="small muted">Blattella germanica</span></div></div>
    <div style="margin:16px 0 6px" class="row between small"><span>Match confidence</span><b>High</b></div>
    <div class="confidence"><span style="width:82%"></span></div>
    <dl style="margin-top:16px"><dt>Seen in</dt><dd data-bind="where">Kitchen</dd><dt>Looked</dt><dd data-bind="look">Brown, flat, fast</dd><dt>Amount</dt><dd data-bind="count">A few</dd></dl>
    <div class="divider"></div>
    <div class="notice notice-green"><svg><use href="#i-info"/></svg><span>Common in Melbourne kitchens; usually treated in one visit with gel baiting. Not dangerous, but multiplies quickly.</span></div>
    <a class="btn btn-primary btn-block" style="margin-top:16px" href="estimate.html">Estimate for cockroaches <svg><use href="#i-arrow"/></svg></a>
    <a class="btn btn-ghost btn-block btn-sm" style="margin-top:8px" href="#">Also consider: Australian cockroach</a>
  </aside>
</div>

<section class="section">
  <div class="container">
    <div class="row between" style="margin-bottom:24px"><div><div class="eyebrow">Browse the guide</div><h2 style="margin:0">All pests we treat</h2></div></div>
    <div class="grid grid-4">
''' + pest_cards() + '''
    </div>
  </div>
</section>
'''

# ------------------------------------------------------------------ ESTIMATE WIZARD
ESTIMATE = '''
<div class="container page-head">
  <div class="breadcrumb"><a href="home.html">Home</a><span>/</span><span>Get an estimate</span></div>
  <h1 style="font-size:clamp(1.7rem,4vw,2.5rem)">Get an instant estimate</h1>
  <p class="lead muted" style="max-width:600px">Five quick questions. We'll show a realistic price range and what can change it — no contact details required.</p>
</div>

<div class="container wizard-layout" data-wizard>
  <ol class="wizard-steps" data-note-d="Desktop shows a vertical step list (220px column) so users can see the whole journey and their position in it.">
    <li><span class="n">1</span>Pest</li><li><span class="n">2</span>Property</li><li><span class="n">3</span>Size</li><li><span class="n">4</span>Area</li><li><span class="n">5</span>Estimate</li>
  </ol>

  <div class="card" data-note-m="Wizard is one question per screen. A slim segmented progress bar replaces the step list to save vertical space; the Continue button is full-width and pinned under the content." data-note-t="Same linear flow; option tiles show 3 per row. Actions right-align." data-note-d="Question card in the centre column; option tiles show 4 per row. The task sequence stays linear at every breakpoint — only the surrounding chrome changes.">
    <div class="progress" aria-hidden="true"><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span></div>
    <div class="row between" style="margin-bottom:16px"><span class="badge" data-step-label>Step 1 of 5</span><span class="tiny muted">About 1 minute</span></div>

    <section class="wstep active">
      <h2 style="font-size:1.4rem">What pest do you need help with?</h2>
      <p class="muted small">Pick the closest match. Not sure? <a href="identify.html" style="color:var(--green-700);font-weight:600">Identify it first</a>.</p>
      <div class="choices" data-select data-out="pest">
        <button class="choice selected" data-value="Cockroaches"><svg><use href="#p-cockroach"/></svg>Cockroaches</button>
        <button class="choice" data-value="Ants"><svg><use href="#p-ant"/></svg>Ants</button>
        <button class="choice" data-value="Spiders"><svg><use href="#p-spider"/></svg>Spiders</button>
        <button class="choice" data-value="Rodents"><svg><use href="#p-rodent"/></svg>Rats &amp; mice</button>
        <button class="choice" data-value="Termites"><svg><use href="#p-termite"/></svg>Termites<small>inspection</small></button>
        <button class="choice" data-value="Wasps"><svg><use href="#p-wasp"/></svg>Wasps &amp; bees</button>
        <button class="choice" data-value="Bed bugs"><svg><use href="#p-bedbug"/></svg>Bed bugs</button>
        <button class="choice" data-value="Fleas"><svg><use href="#p-flea"/></svg>Fleas</button>
      </div>
    </section>

    <section class="wstep">
      <h2 style="font-size:1.4rem">What type of property is it?</h2>
      <p class="muted small">This affects access, treatment area and how long the visit takes.</p>
      <div class="choices cols-3" data-select data-out="property">
        <button class="choice selected" data-value="House"><svg><use href="#i-house"/></svg>House<small>detached</small></button>
        <button class="choice" data-value="Townhouse"><svg><use href="#i-town"/></svg>Townhouse<small>or unit</small></button>
        <button class="choice" data-value="Apartment"><svg><use href="#i-apt"/></svg>Apartment<small>single level</small></button>
      </div>
    </section>

    <section class="wstep">
      <h2 style="font-size:1.4rem">How big is the property?</h2>
      <p class="muted small">Bedrooms is a good proxy — we'll confirm on the day.</p>
      <div class="pills" data-select data-out="size">
        <button class="pill">1 bed</button><button class="pill">2 bed</button><button class="pill selected">3 bed</button><button class="pill">4 bed</button><button class="pill">5+ bed</button>
      </div>
      <div class="field" style="margin-top:20px"><label for="postcode">Suburb or postcode</label><input class="input" id="postcode" placeholder="e.g. 3056 Brunswick" value="3056"><span class="hint">Used to check we service your area and travel time.</span></div>
    </section>

    <section class="wstep">
      <h2 style="font-size:1.4rem">Where is the problem?</h2>
      <p class="muted small">Interior-only treatments are quicker; exterior barrier sprays take longer.</p>
      <div class="choices cols-3" data-select data-out="area">
        <button class="choice" data-value="Inside only"><svg><use href="#i-inside"/></svg>Inside only</button>
        <button class="choice" data-value="Outside only"><svg><use href="#i-outside"/></svg>Outside only</button>
        <button class="choice selected" data-value="Inside &amp; outside"><svg><use href="#i-both"/></svg>Both</button>
      </div>
      <label class="check" style="margin-top:20px"><input type="checkbox"> There are pets or young children in the home (we'll use low-toxicity products)</label>
    </section>

    <section class="wstep">
      <h2 style="font-size:1.4rem">Anything else we should know?</h2>
      <p class="muted small">Optional. Photos help us confirm the pest and prepare the right treatment.</p>
      <div class="upload" data-note="Photo upload is optional and placed last so it never blocks the estimate. On mobile it opens the camera directly."><svg><use href="#i-camera"/></svg><b>Add photos</b><div class="small muted">Tap to take a photo or choose from library</div></div>
      <div class="field" style="margin-top:16px"><label for="notes">Notes</label><textarea class="textarea" id="notes" placeholder="e.g. mostly under the dishwasher, worse at night"></textarea></div>
    </section>

    <div class="wizard-actions">
      <button class="btn btn-outline" data-prev><svg><use href="#i-back"/></svg> Back</button>
      <button class="btn btn-primary" data-next>Continue <svg><use href="#i-arrow"/></svg></button>
    </div>
  </div>

  <aside class="card summary" data-note-m="Running summary is hidden behind the flow on mobile and appears at the bottom; the price range is only revealed on the final step to avoid anchoring on an incomplete estimate." data-note-d="Sticky 300px summary column shows selected answers as they're made and a placeholder for the price range until the final step.">
    <div class="eyebrow">Your answers</div>
    <dl><dt>Pest</dt><dd data-bind="pest">Cockroaches</dd><dt>Property</dt><dd data-bind="property">House</dd><dt>Size</dt><dd data-bind="size">3 bed</dd><dt>Area</dt><dd data-bind="area">Inside &amp; outside</dd></dl>
    <div class="divider"></div>
    <div class="tiny muted">Indicative range</div>
    <div class="price-range" style="filter:blur(6px);opacity:.5">$180 – $260</div>
    <div class="small muted" style="margin-top:8px">Revealed on the last step</div>
    <div class="notice" style="margin-top:16px"><svg><use href="#i-info"/></svg><span>Final price is confirmed by the technician after inspection. No payment is taken online.</span></div>
  </aside>
</div>
'''

# ------------------------------------------------------------------ ESTIMATE RESULT
ESTIMATE_RESULT = '''
<div class="container page-head">
  <div class="breadcrumb"><a href="home.html">Home</a><span>/</span><a href="estimate.html">Get an estimate</a><span>/</span><span>Result</span></div>
  <span class="badge"><span class="dot"></span> Estimate ready</span>
  <h1 style="font-size:clamp(1.7rem,4vw,2.5rem);margin-top:12px">Your indicative estimate</h1>
</div>

<div class="container grid booking-layout" style="gap:24px;align-items:start">
  <div class="stack">
    <div class="card" data-note-m="Price range is the hero element, set in 2.2rem Poppins so it reads instantly; the Book CTA is full-width beneath it." data-note-d="Result card pairs the price range with an explanation of what moves it; the CTA sits inline on the right.">
      <div class="result-hero">
        <div class="pest-visual" data-label="Pest"><svg><use href="#p-cockroach"/></svg></div>
        <div><div class="tiny muted">Cockroach treatment · 3-bed house · inside &amp; outside · 3056</div><div class="price-range" style="margin-top:6px">$180 – $260<small>incl. GST · typical visit 60–90 min</small></div></div>
      </div>
      <div class="divider"></div>
      <div class="grid grid-2" style="gap:16px">
        <div class="feature"><span class="ico"><svg><use href="#i-check"/></svg></span><div><h4>Included</h4><p class="small muted" style="margin:0">Inspection, gel bait + residual spray in kitchen &amp; wet areas, exterior perimeter, 3-month warranty.</p></div></div>
        <div class="feature"><span class="ico ico-amber"><svg><use href="#i-warn"/></svg></span><div><h4>Can change the price</h4><p class="small muted" style="margin:0">Heavy infestation, roof-void access, multiple units, or German cockroaches needing a follow-up visit.</p></div></div>
      </div>
      <div class="row" style="margin-top:20px;gap:12px">
        <a class="btn btn-primary" href="booking.html">Book with these details <svg><use href="#i-arrow"/></svg></a>
        <a class="btn btn-outline" href="estimate.html">Change answers</a>
      </div>
    </div>

    <div class="card">
      <h3>How we calculated this</h3>
      <div class="table-wrap" data-note="Breakdown table scrolls horizontally inside its own container on narrow screens so the page body never scrolls sideways."><table>
        <thead><tr><th>Item</th><th>Basis</th><th>Range</th></tr></thead>
        <tbody>
          <tr><td>Base treatment — cockroaches</td><td>Standard residential</td><td>$150 – $190</td></tr>
          <tr><td>Property size</td><td>3 bedrooms</td><td>+$20 – $40</td></tr>
          <tr><td>Exterior perimeter</td><td>Inside &amp; outside</td><td>+$10 – $30</td></tr>
          <tr><td>Travel</td><td>3056 — within zone 1</td><td>$0</td></tr>
        </tbody>
      </table></div>
    </div>
  </div>

  <aside class="stack" data-note-d="Sidebar shows next-available windows so the user can see availability before committing to the booking form.">
    <div class="card">
      <div class="eyebrow">Next available</div>
      <div class="slots" style="grid-template-columns:1fr">
        <div class="slot selected"><span>Thu 17 Sep · 9–11am</span><span class="badge">Recommended</span></div>
        <div class="slot"><span>Thu 17 Sep · 1–3pm</span></div>
        <div class="slot"><span>Fri 18 Sep · 8–10am</span><span class="badge badge-amber">2 left</span></div>
      </div>
      <a class="btn btn-accent btn-block" style="margin-top:16px" href="booking.html">Choose a time</a>
    </div>
    <div class="panel small"><b>Prefer to talk?</b><div class="muted" style="margin-top:4px">Call 1300 000 000 · 7am–7pm. Quote ref <b>EST-48211</b> and we'll pick up where you left off.</div></div>
  </aside>
</div>
'''

# ------------------------------------------------------------------ BOOKING
DATES = [("Mon","14"),("Tue","15"),("Wed","16"),("Thu","17"),("Fri","18"),("Sat","19"),("Sun","20"),("Mon","21"),("Tue","22")]
def dates():
    out=[]
    for i,(d,n) in enumerate(DATES):
        cls = "selected" if n=="17" else "off" if d=="Sun" else ""
        out.append(f'<button class="date {cls}" data-value="{d} {n} Sep"><small>{d}</small>{n}</button>')
    return "".join(out)

BOOKING = '''
<div class="container page-head">
  <div class="breadcrumb"><a href="home.html">Home</a><span>/</span><span>Book a service</span></div>
  <h1 style="font-size:clamp(1.7rem,4vw,2.5rem)">Book your technician</h1>
  <p class="lead muted" style="max-width:600px">Pick a day and a 2-hour arrival window. You'll get an SMS confirmation and can reschedule free up to 24 hours before.</p>
</div>

<form class="container grid booking-layout" style="gap:24px;align-items:start" data-validate novalidate>
  <div class="stack">
    <div class="card" data-note-m="Date strip scrolls horizontally with 64px day tiles — a familiar mobile pattern that avoids a cramped month calendar." data-note-d="Date tiles widen to 72px and all nine days fit without scrolling.">
      <h3>1 · Choose a day</h3>
      <div class="dates" data-select data-out="day">''' + dates() + '''</div>
      <h3 style="margin-top:24px">2 · Arrival window</h3>
      <div class="slots" data-select data-out="slot" data-note-m="Time windows stack as full-width rows (52px min height)." data-note-t="Time windows form a 2-column grid." data-note-d="Time windows form a 3-column grid.">
        <button type="button" class="slot" data-value="7–9am"><span>7 – 9am</span><span class="badge badge-amber">1 left</span></button>
        <button type="button" class="slot selected" data-value="9–11am"><span>9 – 11am</span><span class="badge">Popular</span></button>
        <button type="button" class="slot" data-value="11am–1pm"><span>11am – 1pm</span></button>
        <button type="button" class="slot" data-value="1–3pm"><span>1 – 3pm</span></button>
        <button type="button" class="slot" data-value="3–5pm"><span>3 – 5pm</span></button>
        <button type="button" class="slot off" disabled><span>5 – 7pm</span><span class="badge badge-grey">Full</span></button>
      </div>
    </div>

    <div class="card">
      <h3>3 · Your details</h3>
      <div class="form-grid" data-note-m="All fields are single-column and 48px tall. Labels sit above inputs (never placeholder-only) so they stay visible once typing starts." data-note-t="Form switches to a 2-column grid; address and notes span both columns." data-note-d="Two-column form grid with full-width address row.">
        <div class="field" data-required><label for="fn">First name</label><input class="input" id="fn" autocomplete="given-name" placeholder="Priya"><span class="error-msg"><svg style="width:14px;height:14px"><use href="#i-warn"/></svg> Please enter your first name</span></div>
        <div class="field" data-required><label for="ln">Last name</label><input class="input" id="ln" autocomplete="family-name" placeholder="Nair"><span class="error-msg"><svg style="width:14px;height:14px"><use href="#i-warn"/></svg> Please enter your last name</span></div>
        <div class="field" data-required><label for="ph">Mobile</label><input class="input" id="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="04xx xxx xxx"><span class="hint">For SMS confirmation and technician updates</span><span class="error-msg"><svg style="width:14px;height:14px"><use href="#i-warn"/></svg> Enter an Australian mobile number</span></div>
        <div class="field"><label for="em">Email <span class="muted" style="font-weight:400">(optional)</span></label><input class="input" id="em" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></div>
        <div class="field span-2" data-required><label for="ad">Property address</label><input class="input" id="ad" autocomplete="street-address" placeholder="Start typing your address…" value="12 Sydney Rd, Brunswick VIC 3056"><span class="error-msg"><svg style="width:14px;height:14px"><use href="#i-warn"/></svg> We need the property address</span></div>
        <div class="field"><label for="acc">Access</label><select class="select" id="acc"><option>I'll be home</option><option>Key with agent / neighbour</option><option>Lockbox — I'll share the code</option></select></div>
        <div class="field"><label>Pets or children at home?</label><div class="pills" data-select><button type="button" class="pill selected">Yes</button><button type="button" class="pill">No</button></div></div>
        <div class="field span-2"><label for="nt">Notes for the technician</label><textarea class="textarea" id="nt" placeholder="e.g. side gate is unlocked, dog is friendly"></textarea></div>
      </div>
    </div>

    <div class="card">
      <h3>4 · Confirm</h3>
      <label class="check"><input type="checkbox" checked> Send me SMS updates about my booking</label>
      <label class="check" style="margin-top:10px"><input type="checkbox"> I understand the estimate is indicative and the final price is confirmed on site before any work starts</label>
      <div class="notice notice-blue" style="margin-top:16px"><svg><use href="#i-info"/></svg><span>No payment now. You pay the technician after the job by card or bank transfer.</span></div>
      <button class="btn btn-primary btn-block" style="margin-top:20px" type="submit" data-note="Single, clearly labelled submit button with the price range repeated so the user confirms with full context. Client-side validation highlights missing required fields inline before the request is sent to the server.">Confirm booking · $180–$260 <svg><use href="#i-arrow"/></svg></button>
    </div>
  </div>

  <aside class="card summary" data-note-m="Booking summary sits below the form on mobile and repeats the key choices; the confirm button in the form is the primary action." data-note-d="Sticky 340px summary keeps pest, estimate, date and window visible while the user completes the form.">
    <div class="eyebrow">Booking summary</div>
    <div class="result-hero"><div class="pest-visual" data-label="Pest"><svg><use href="#p-cockroach"/></svg></div><div><h3 style="margin:0 0 4px">Cockroach treatment</h3><span class="small muted">3-bed house · inside &amp; outside</span></div></div>
    <dl style="margin-top:16px"><dt>Day</dt><dd data-bind="day">Thu 17 Sep</dd><dt>Window</dt><dd data-bind="slot">9–11am</dd><dt>Address</dt><dd>Brunswick 3056</dd><dt>Estimate</dt><dd>$180 – $260</dd></dl>
    <div class="divider"></div>
    <ul class="timeline">
      <li><span class="tdot done"><svg><use href="#i-check"/></svg></span><div class="small"><b>Estimate</b><div class="muted">EST-48211</div></div></li>
      <li><span class="tdot now"></span><div class="small"><b>Booking request</b><div class="muted">You're here</div></div></li>
      <li><span class="tdot"></span><div class="small"><b>Technician confirmed</b><div class="muted">Usually within 1 hour</div></div></li>
      <li><span class="tdot"></span><div class="small"><b>Service &amp; report</b></div></li>
    </ul>
    <a class="small" href="estimate.html" style="color:var(--green-700);font-weight:600">Edit estimate answers</a>
  </aside>
</form>
'''

BOOKING_CONFIRMED = '''
<div class="container narrow" style="padding-block:48px 24px">
  <div class="card center" style="padding:40px 24px" data-note="Confirmation screen keeps the summary compact and offers three next actions: add to calendar, view in My Services, or return home.">
    <span class="ico" style="width:72px;height:72px;border-radius:50%;margin:0 auto 16px"><svg style="width:36px;height:36px"><use href="#i-check"/></svg></span>
    <span class="badge"><span class="dot"></span> Request received</span>
    <h1 style="font-size:clamp(1.6rem,4vw,2.2rem);margin-top:12px">You're booked in, Priya</h1>
    <p class="muted">Booking ref <b>YI-10394</b>. We'll text you when a technician is assigned — usually within the hour.</p>
    <div class="panel" style="text-align:left;margin-top:24px">
      <div class="kv">
        <div><b>Service</b>Cockroach treatment</div>
        <div><b>When</b>Thu 17 Sep · 9–11am</div>
        <div><b>Where</b>12 Sydney Rd, Brunswick</div>
        <div><b>Estimate</b>$180 – $260</div>
      </div>
    </div>
    <div class="row" style="justify-content:center;margin-top:24px">
      <a class="btn btn-primary" href="my-services.html">View in My Services</a>
      <a class="btn btn-outline" href="#"><svg><use href="#i-cal"/></svg> Add to calendar</a>
    </div>
    <p class="small muted" style="margin:24px 0 0">Need to change it? Reschedule free up to 24 hours before via My Services or the SMS link.</p>
  </div>
  <div class="card" style="margin-top:16px">
    <h3>Before we arrive</h3>
    <ul class="small muted" style="margin:0;padding-left:18px;display:grid;gap:6px">
      <li>Clear benches and under-sink cupboards in the kitchen.</li>
      <li>Keep pets in a separate room or outside for 2 hours after treatment.</li>
      <li>You'll receive your digital service report within 24 hours of the visit.</li>
    </ul>
  </div>
</div>
'''

# ------------------------------------------------------------------ MY SERVICES
MY_SERVICES = '''
<div class="container page-head">
  <div class="row between">
    <div><div class="eyebrow">My Services</div><h1 style="font-size:clamp(1.7rem,4vw,2.5rem);margin:0">Hi Priya</h1></div>
    <a class="btn btn-accent btn-sm" href="booking.html">New booking</a>
  </div>
</div>

<div class="container dash-layout">
  <nav class="side-nav" data-note-m="Section navigation becomes a horizontally scrolling tab row so the content starts within the first screen." data-note-t="Section navigation becomes a sticky 200px sidebar." data-note-d="Sticky 240px sidebar navigation with icons.">
    <a class="active" href="#"><svg><use href="#i-cal"/></svg> Upcoming</a>
    <a href="#"><svg><use href="#i-doc"/></svg> Service reports</a>
    <a href="#"><svg><use href="#i-pin"/></svg> Properties</a>
    <a href="#"><svg><use href="#i-user"/></svg> Account</a>
  </nav>

  <div class="stack">
    <div class="card booking-card" data-note-m="Upcoming booking card: status badge and reference on one line, key facts as a 2×2 grid, actions stacked full-width." data-note-d="Key facts spread across four columns; actions sit inline.">
      <div class="head"><div><span class="badge badge-blue"><span class="dot"></span> Technician confirmed</span><h3 style="margin:10px 0 0">Cockroach treatment</h3><span class="small muted">Ref YI-10394</span></div><div class="pest-visual" data-label="Pest" style="width:64px;aspect-ratio:1;border-radius:12px"><svg><use href="#p-cockroach"/></svg></div></div>
      <div class="kv">
        <div><b>When</b>Thu 17 Sep · 9–11am</div>
        <div><b>Where</b>12 Sydney Rd, Brunswick</div>
        <div><b>Technician</b>Marcus T. · Lic. 12345</div>
        <div><b>Estimate</b>$180 – $260</div>
      </div>
      <ul class="timeline" style="margin-top:4px">
        <li><span class="tdot done"><svg><use href="#i-check"/></svg></span><div class="small"><b>Request received</b><div class="muted">Tue 15 Sep, 10:02pm</div></div></li>
        <li><span class="tdot done"><svg><use href="#i-check"/></svg></span><div class="small"><b>Technician confirmed</b><div class="muted">Tue 15 Sep, 10:41pm</div></div></li>
        <li><span class="tdot now"></span><div class="small"><b>On the way</b><div class="muted">You'll get an SMS with a live ETA</div></div></li>
        <li><span class="tdot"></span><div class="small"><b>Service report</b><div class="muted">Within 24h of the visit</div></div></li>
      </ul>
      <div class="row"><a class="btn btn-outline btn-sm" href="#"><svg><use href="#i-cal"/></svg> Reschedule</a><a class="btn btn-ghost btn-sm" href="#"><svg><use href="#i-phone"/></svg> Contact technician</a></div>
    </div>

    <div>
      <div class="row between" style="margin-bottom:12px"><h2 style="font-size:1.3rem;margin:0">Past services</h2><a class="small" href="#" style="color:var(--green-700);font-weight:600">View all</a></div>
      <div class="report-list">
        <a class="card report-row card-hover" href="#"><span class="ico"><svg><use href="#p-ant"/></svg></span><div class="grow"><h4>Ant treatment — exterior</h4><div class="small muted">Sat 21 Mar 2026 · 12 Sydney Rd · $165</div></div><span class="badge">Report ready</span><svg style="width:18px;height:18px;color:var(--ink-3)"><use href="#i-chev"/></svg></a>
        <a class="card report-row card-hover" href="#"><span class="ico"><svg><use href="#p-spider"/></svg></span><div class="grow"><h4>Spider spray — eaves &amp; windows</h4><div class="small muted">Thu 6 Nov 2025 · 12 Sydney Rd · $180</div></div><span class="badge">Report ready</span><svg style="width:18px;height:18px;color:var(--ink-3)"><use href="#i-chev"/></svg></a>
      </div>
    </div>

    <div class="card report-section" data-note-m="Service report sections stack; treated areas use wrapping tags rather than a table so nothing overflows." data-note-d="Report sections form a 2-column grid with the technician summary spanning full width.">
      <div class="row between"><div><div class="eyebrow">Service report</div><h3 style="margin:0">Ant treatment — exterior</h3><span class="small muted">Completed Sat 21 Mar 2026 · Technician Marcus T.</span></div><a class="btn btn-outline btn-sm" href="#"><svg><use href="#i-doc"/></svg> Download PDF</a></div>
      <div class="grid grid-2" style="gap:20px">
        <div><h4><svg><use href="#i-search"/></svg> Findings</h4><p class="small muted" style="margin:0">Black house ant trails along rear paving and into kitchen via a gap under the sliding door. Nest located under the east side path.</p></div>
        <div><h4><svg><use href="#i-check"/></svg> Treatment</h4><p class="small muted" style="margin:0">Non-repellent perimeter spray, granular bait at nest entry and along paving joints. Low-toxicity product (pets/children).</p></div>
        <div><h4><svg><use href="#i-pin"/></svg> Treated areas</h4><div class="tag-list"><span class="tag">Rear paving</span><span class="tag">East side path</span><span class="tag">Kitchen skirting</span><span class="tag">Sliding door track</span></div></div>
        <div><h4><svg><use href="#i-cal"/></svg> Recommendations</h4><p class="small muted" style="margin:0">Seal gap under sliding door. Re-inspect in spring; a follow-up perimeter treatment is recommended in <b>Sep 2026</b>.</p></div>
      </div>
      <div class="notice notice-green"><svg><use href="#i-shield"/></svg><span>Covered by 3-month warranty until 21 Jun 2026. If ants return inside that period, book a free re-treat from this page.</span></div>
    </div>
  </div>
</div>
'''

PAGES = [
  ("home.html", "Home", HOME),
  ("identify.html", "Identify your pest", IDENTIFY),
  ("estimate.html", "Get an estimate", ESTIMATE),
  ("estimate-result.html", "Your estimate", ESTIMATE_RESULT),
  ("booking.html", "Book a service", BOOKING),
  ("booking-confirmed.html", "Booking confirmed", BOOKING_CONFIRMED),
  ("my-services.html", "My Services", MY_SERVICES),
]

for skin, folder in (("hifi","mockups"),("wire","wireframes")):
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    for fname, title, body in PAGES:
        html = head(title, skin) + header(fname) + body + FOOTER
        with open(os.path.join(ROOT, folder, fname), "w", encoding="utf-8") as f:
            f.write(html)
        print("wrote", folder + "/" + fname)
