/* YI Termite & Pest Control prototype behaviour: icon sprite, nav, wizard, quiz, slots, annotations, toolbar */
(function () {
  'use strict';

  /* ---------- 1. SVG icon sprite (injected so every page can <use href="#i-…">) ---------- */
  var SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
  /* UI icons (stroke) */
  '<symbol id="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
  '<symbol id="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></symbol>' +
  '<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>' +
  '<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
  '<symbol id="i-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>' +
  '<symbol id="i-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></symbol>' +
  '<symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></symbol>' +
  '<symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>' +
  '<symbol id="i-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></symbol>' +
  '<symbol id="i-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></symbol>' +
  '<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>' +
  '<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></symbol>' +
  '<symbol id="i-dollar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M16 7.5c0-1.5-1.8-2.5-4-2.5s-4 1-4 2.5S10 10 12 10s4 .5 4 2.5S14 16 12 16s-4-1-4-2.5"/></symbol>' +
  '<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></symbol>' +
  '<symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></symbol>' +
  '<symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></symbol>' +
  '<symbol id="i-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></symbol>' +
  '<symbol id="i-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/></symbol>' +
  '<symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></symbol>' +
  '<symbol id="i-leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/></symbol>' +
  '<symbol id="i-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></symbol>' +
  '<symbol id="i-bug" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 9a4 4 0 018 0v6a4 4 0 01-8 0z"/><path d="M8 11H4M20 11h-4M8 15l-3 3M16 15l3 3M9 5L7 3M15 5l2-2M12 9v10"/></symbol>' +
  '<symbol id="i-house" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/></symbol>' +
  '<symbol id="i-apt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/></symbol>' +
  '<symbol id="i-town" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V9l4-4 4 4v11M11 20V12l4-4 4 4v8M3 20h18"/></symbol>' +
  '<symbol id="i-inside" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 12h6M12 9v6"/></symbol>' +
  '<symbol id="i-outside" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v7M8 7l4-4 4 4"/><rect x="4" y="12" width="16" height="8" rx="2"/></symbol>' +
  '<symbol id="i-both" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="8" height="12" rx="1.5"/><rect x="13" y="6" width="8" height="12" rx="1.5"/></symbol>' +
  /* Pest glyphs (filled, simple, consistent stroke weight) */
  '<symbol id="p-cockroach" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="32" cy="36" rx="13" ry="18"/><path d="M32 18v36M26 24c-4-8-8-12-14-14M38 24c4-8 8-12 14-14M20 34H9M44 34h11M21 44l-9 8M43 44l9 8"/></symbol>' +
  '<symbol id="p-ant" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="24" r="6"/><circle cx="32" cy="32" r="6"/><ellipse cx="47" cy="41" rx="9" ry="7"/><path d="M15 19l-4-7M21 19l4-7M27 28l-9-6M38 28l9-6M26 36l-8 8M38 36l8 8M30 38l-4 10M34 38l4 10"/></symbol>' +
  '<symbol id="p-spider" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="36" r="10"/><circle cx="32" cy="22" r="5"/><path d="M23 30L10 22M41 30l13-8M22 36H8M42 36h14M23 42l-12 9M41 42l12 9M27 46l-6 12M37 46l6 12"/></symbol>' +
  '<symbol id="p-rodent" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 40c0-10 8-18 20-18s18 8 18 16c0 4-3 6-7 6H17c-3 0-5-2-5-4z"/><circle cx="18" cy="24" r="6"/><circle cx="40" cy="33" r="1.5" fill="currentColor"/><path d="M50 40c6 0 8 4 4 8M46 44l4 0"/></symbol>' +
  '<symbol id="p-termite" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="32" r="7"/><ellipse cx="30" cy="32" rx="6" ry="5"/><ellipse cx="46" cy="32" rx="11" ry="8"/><path d="M12 27l-5-8M20 27l5-8M28 28l-6-7M28 36l-6 7M34 28l6-7M34 36l6 7"/></symbol>' +
  '<symbol id="p-wasp" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="34" cy="40" rx="9" ry="14"/><circle cx="34" cy="20" r="6"/><path d="M27 36h14M27 44h14M43 30c10-8 16-6 12 2M25 30C15 22 9 24 13 32M31 15l-4-6M37 15l4-6"/></symbol>' +
  '<symbol id="p-bedbug" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="32" cy="36" rx="16" ry="14"/><path d="M18 36h28M22 28h20M22 44h20M32 22v-6M20 22l-6-6M44 22l6-6M17 44l-8 6M47 44l8 6"/></symbol>' +
  '<symbol id="p-flea" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="34" cy="32" rx="11" ry="14" transform="rotate(-20 34 32)"/><path d="M24 24l-8-2M26 32H14M22 40l-9 8M40 44l4 12M46 40c8 2 10 8 6 14M30 14l-2-6"/></symbol>' +
  '<symbol id="p-possum" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="34" cy="38" rx="16" ry="11"/><circle cx="20" cy="26" r="7"/><path d="M15 21l-3-7M25 21l3-7"/><circle cx="18" cy="26" r="1.5" fill="currentColor"/><path d="M50 40c6 2 8 8 2 12"/></symbol>' +
  '</svg>';
  var holder = document.createElement('div');
  holder.innerHTML = SPRITE;
  document.body.insertBefore(holder.firstChild, document.body.firstChild);

  var q = new URLSearchParams(location.search);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 2. skin from URL (?mode=wire|hifi) ---------- */
  if (q.get('mode') === 'wire') { document.body.classList.remove('hifi'); document.body.classList.add('wire'); }
  if (q.get('mode') === 'hifi') { document.body.classList.remove('wire'); document.body.classList.add('hifi'); }
  if (q.get('clean') === '1') document.body.classList.add('clean');
  if (q.get('legend') === 'top') document.body.classList.add('legend-top');
  /* expose page height for the headless screenshot script */
  function reportHeight() { document.documentElement.setAttribute('data-h', document.documentElement.scrollHeight); document.documentElement.setAttribute('data-w', innerWidth + 'x' + document.documentElement.scrollWidth); }
  window.addEventListener('load', reportHeight); setTimeout(reportHeight, 300); setTimeout(reportHeight, 1500);

  /* ---------- 3. mobile navigation ---------- */
  var menuBtn = $('.menu-btn'), mobileNav = $('.mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (q.get('menu') === 'open') { mobileNav.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); }
  }

  /* ---------- 4. generic single-select groups (data-select="group") ---------- */
  $$('[data-select]').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var item = e.target.closest('.choice, .pill, .slot, .date');
      if (!item || !group.contains(item) || item.classList.contains('off')) return;
      $$('.selected', group).forEach(function (el) { el.classList.remove('selected'); });
      item.classList.add('selected');
      var out = group.getAttribute('data-out');
      if (out && $('[data-bind="' + out + '"]')) $('[data-bind="' + out + '"]').textContent = item.getAttribute('data-value') || item.textContent.trim();
    });
  });

  /* ---------- 5. wizard (estimate / identify) ---------- */
  var wiz = $('[data-wizard]');
  if (wiz) {
    var steps = $$('.wstep', wiz), segs = $$('.progress .seg'), items = $$('.wizard-steps li');
    var cur = parseInt(q.get('step') || '1', 10) - 1;
    if (isNaN(cur) || cur < 0 || cur >= steps.length) cur = 0;
    function render() {
      steps.forEach(function (s, i) { s.classList.toggle('active', i === cur); });
      segs.forEach(function (s, i) { s.className = 'seg' + (i < cur ? ' done' : i === cur ? ' active' : ''); });
      items.forEach(function (s, i) { s.className = i < cur ? 'done' : i === cur ? 'active' : ''; });
      var lbl = $('[data-step-label]'); if (lbl) lbl.textContent = 'Step ' + (cur + 1) + ' of ' + steps.length;
      var back = $('[data-prev]'); if (back) back.disabled = cur === 0;
      var next = $('[data-next]');
      if (next) { next.innerHTML = (cur === steps.length - 1 ? 'See my estimate' : 'Continue') + ' <svg><use href="#i-arrow"/></svg>'; }
      var pr = $('.summary .price-range'), prNote = pr && pr.nextElementSibling;
      if (pr) { var last = cur === steps.length - 1; pr.style.filter = last ? '' : 'blur(6px)'; pr.style.opacity = last ? '' : '.5'; if (prNote) prNote.textContent = last ? 'Based on your answers' : 'Revealed on the last step'; }
      window.scrollTo({ top: 0 });
    }
    wiz.addEventListener('click', function (e) {
      if (e.target.closest('[data-next]')) { if (cur < steps.length - 1) { cur++; render(); } else { location.href = 'estimate-result.html' + location.search.replace(/[?&]step=\d+/, '').replace(/^&/, '?'); } }
      if (e.target.closest('[data-prev]')) { if (cur > 0) { cur--; render(); } }
    });
    render();
  }

  /* ---------- 6. simple field validation demo (booking) ---------- */
  var form = $('[data-validate]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = false;
      $$('.field[data-required]', form).forEach(function (f) {
        var inp = $('input, select, textarea', f);
        var ok = inp && inp.value.trim().length > 0;
        f.classList.toggle('error', !ok); if (!ok) bad = true;
      });
      if (!bad) location.href = 'booking-confirmed.html' + location.search;
    });
    if (q.get('errors') === '1') $$('.field[data-required]', form).forEach(function (f) { f.classList.add('error'); });
  }

  /* ---------- 7. annotations ---------- */
  var annotate = false;
  function bp() { var w = innerWidth; return w >= 1024 ? 'd' : w >= 768 ? 't' : 'm'; }
  function renderNotes() {
    $$('.note-badge, .note-legend').forEach(function (el) { el.remove(); });
    $$('.has-note').forEach(function (el) { el.classList.remove('has-note'); el.style.position = el.__pos || ''; });
    if (!annotate) return;
    var k = bp(), n = 0, list = [];
    $$('[data-note],[data-note-m],[data-note-t],[data-note-d]').forEach(function (el) {
      var text = el.getAttribute('data-note-' + k) || el.getAttribute('data-note');
      if (!text) return;
      if (getComputedStyle(el).display === 'none' || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;
      n++;
      el.__pos = el.style.position;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('has-note');
      var b = document.createElement('span'); b.className = 'note-badge'; b.textContent = n;
      var r = el.getBoundingClientRect(), inside = (r.top + scrollY) < 16 || r.left < 16 || getComputedStyle(el).overflowX !== 'visible';
      b.style.top = inside ? '6px' : '-12px'; b.style.left = inside ? '6px' : '-12px';
      el.appendChild(b);
      list.push(text);
    });
    var lg = document.createElement('aside'); lg.className = 'note-legend';
    var title = { m: 'Mobile', t: 'Tablet', d: 'Desktop' }[k] + ' · ' + innerWidth + 'px';
    lg.innerHTML = '<h5>Design annotations — ' + title + '</h5><ol>' + list.map(function (t, i) { return '<li><b>' + (i + 1) + '</b><span>' + t + '</span></li>'; }).join('') + '</ol>';
    if (document.body.classList.contains('legend-top')) document.body.insertBefore(lg, document.body.firstChild); else document.body.appendChild(lg);
  }

  /* ---------- 8. prototype toolbar ---------- */
  var bar = document.createElement('div'); bar.className = 'proto-bar';
  bar.innerHTML = '<span class="vp"></span>' +
    '<button data-t="skin">Wire / Hi-fi</button>' +
    '<button data-t="notes">Annotations</button>' +
    '<button data-t="hide" title="Hide toolbar (press H to show)">✕</button>';
  document.body.appendChild(bar);
  function vp() { var w = innerWidth; $('.vp', bar).textContent = w + '×' + innerHeight + ' · ' + (w >= 1024 ? 'Desktop' : w >= 768 ? 'Tablet' : 'Mobile'); }
  bar.addEventListener('click', function (e) {
    var t = e.target.getAttribute('data-t');
    if (t === 'skin') { document.body.classList.toggle('wire'); document.body.classList.toggle('hifi'); }
    if (t === 'notes') { annotate = !annotate; e.target.classList.toggle('on', annotate); renderNotes(); }
    if (t === 'hide') { document.body.classList.add('clean'); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('clean'); });
  if (q.get('annotate') === '1') { annotate = true; $('[data-t="notes"]', bar).classList.add('on'); renderNotes(); }
  var rt; window.addEventListener('resize', function () { vp(); clearTimeout(rt); rt = setTimeout(renderNotes, 120); });
  vp();
})();
