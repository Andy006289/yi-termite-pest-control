/* identify.js — Pest Guide / identification page.
   - Builds the three quiz questions from <quiz> in pests.xml.
   - Every answer re-scores all pests (rankPests) and updates the "Most likely" panel.
   - The guide grid opens a details dialog; identify.html?pest=<id> opens it directly. */

import { startPage, $, $$, esc, selectGroup, showError } from '../ui.js';
import { getPests, getQuiz, rankPests } from '../data.js';
import { getPricing } from '../pricing.js';
import { pestCard } from '../components.js';

startPage();

const answers = {};          // { where: 'kitchen', look: 'brown-flat', count: 'few' }
let pests = [];
let pricing = null;

/* ---------- quiz ---------- */

function renderQuiz(quiz) {
  const quizEl = $('#quiz');
  quizEl.innerHTML = `<div class="row between" style="margin-bottom:16px"><span class="badge" id="progress-badge"><span class="dot"></span> 0 of ${quiz.length} answered</span>
      <button type="button" class="btn btn-ghost btn-sm" id="reset-quiz">Start again</button></div>` +
    quiz.map((q) => {
      const items = q.options.map((o) => q.style === 'pills'
        ? `<button type="button" class="pill" data-value="${esc(o.id)}">${esc(o.label)}</button>`
        : `<button type="button" class="choice" data-value="${esc(o.id)}"><svg aria-hidden="true"><use href="#${esc(o.icon)}"/></svg>${esc(o.label)}<small>${esc(o.hint)}</small></button>`).join('');
      const cls = q.style === 'pills' ? 'pills' : q.id === 'where' ? 'choices cols-3' : 'choices';
      return `<h2 style="font-size:1.4rem" id="q-${esc(q.id)}">${esc(q.title)}</h2>
        <div class="${cls}" data-question="${esc(q.id)}" role="group" aria-labelledby="q-${esc(q.id)}" style="margin-bottom:28px">${items}</div>`;
    }).join('');
  quizEl.setAttribute('aria-busy', 'false');

  $$('[data-question]', quizEl).forEach((group) => {
    selectGroup(group, (value) => { answers[group.dataset.question] = value; update(quiz); });
  });
  $('#reset-quiz').addEventListener('click', () => {
    Object.keys(answers).forEach((k) => delete answers[k]);
    $$('.selected', quizEl).forEach((el) => { el.classList.remove('selected'); el.setAttribute('aria-pressed', 'false'); });
    update(quiz);
  });
  update(quiz);
}

/* ---------- live result ---------- */

function update(quiz) {
  const answered = Object.keys(answers).length;
  $('#progress-badge').innerHTML = `<span class="dot"></span> ${answered} of ${quiz.length} answered`;
  const box = $('#result');
  const labelOf = (qid) => quiz.find((q) => q.id === qid).options.find((o) => o.id === answers[qid])?.label ?? '—';

  if (!answered) {
    box.innerHTML = `<div class="eyebrow">Most likely</div>
      <div class="empty"><span class="ico"><svg><use href="#i-search"/></svg></span><p class="small muted" style="margin:0">Answer the questions and we'll suggest the most likely pest here.</p></div>`;
    return;
  }

  const [best, second] = rankPests(pests, answers);
  if (!best.score) {
    box.innerHTML = `<div class="eyebrow">Most likely</div><p class="small muted">No clear match yet — try another answer, or browse the guide below.</p>`;
    return;
  }
  const level = best.confidence >= 0.7 ? 'High' : best.confidence >= 0.4 ? 'Medium' : 'Low';
  const pct = Math.round(best.confidence * 100);
  const p = best.pest;
  box.innerHTML = `
    <div class="eyebrow">Most likely</div>
    <div class="result-hero"><div class="pest-visual"><svg aria-hidden="true"><use href="#p-${esc(p.id)}"/></svg></div>
      <div><h3 style="margin:0 0 4px">${esc(p.species)}</h3><span class="small muted"><i>${esc(p.scientific)}</i></span></div></div>
    <div style="margin:16px 0 6px" class="row between small"><span>Match confidence</span><b>${level}</b></div>
    <div class="confidence" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Match confidence ${pct}%"><span style="width:${pct}%"></span></div>
    <dl style="margin-top:16px"><dt>Seen in</dt><dd>${esc(labelOf('where'))}</dd><dt>Looked</dt><dd>${esc(labelOf('look'))}</dd><dt>Amount</dt><dd>${esc(labelOf('count'))}</dd></dl>
    <div class="divider"></div>
    <div class="notice ${p.tone === 'red' ? 'notice-red' : p.tone === 'amber' ? '' : 'notice-green'}"><svg><use href="#i-info"/></svg><span>${esc(p.advice)}</span></div>
    <a class="btn btn-primary btn-block" style="margin-top:16px" href="estimate.html?pest=${esc(p.id)}">Estimate for ${esc(p.name.toLowerCase())} <svg><use href="#i-arrow"/></svg></a>
    ${second && second.score ? `<button type="button" class="btn btn-ghost btn-block btn-sm" style="margin-top:8px" data-open="${esc(second.pest.id)}">Also consider: ${esc(second.pest.name)}</button>` : ''}`;
}

/* ---------- guide + details dialog ---------- */

function openDetails(id) {
  const p = pests.find((x) => x.id === id);
  if (!p) return;
  const base = pricing.bases.get(p.id);
  const dlg = $('#pest-dialog');
  dlg.innerHTML = `<button class="dialog-close" type="button" aria-label="Close"><svg><use href="#i-close"/></svg></button>
    <div class="dialog-body">
      <div class="pest-visual"><svg aria-hidden="true"><use href="#p-${esc(p.id)}"/></svg></div>
      <div><div class="eyebrow">${esc(p.tag)}</div><h2 id="pest-dialog-title" style="margin:0">${esc(p.name)}</h2>
        <span class="small muted">${esc(p.species)} · <i>${esc(p.scientific)}</i></span></div>
      <p class="small" style="margin:0">${esc(p.advice)}</p>
      <div class="kv"><div><b>Usually found</b>${esc(p.where)}</div><div><b>Typical price</b>$${base.min} – $${base.max}</div><div><b>Visit length</b>${esc(base.duration)}</div><div><b>Included</b>${esc(p.included)}</div></div>
      <a class="btn btn-primary btn-block" href="estimate.html?pest=${esc(p.id)}">Get an estimate <svg><use href="#i-arrow"/></svg></a>
    </div>`;
  $('.dialog-close', dlg).addEventListener('click', () => dlg.close());
  dlg.showModal();
}

function renderGuide() {
  const grid = $('#guide-grid');
  grid.innerHTML = pests.map((p) => pestCard(p, pricing.bases.get(p.id))).join('');
  grid.setAttribute('aria-busy', 'false');
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.pest-card');
    if (!card) return;
    e.preventDefault();
    const id = new URL(card.href).searchParams.get('pest');
    history.replaceState(null, '', `?pest=${id}`);
    openDetails(id);
  });
}

// "Also consider" buttons open the second match's details
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (btn) openDetails(btn.dataset.open);
});
// closing the dialog clears ?pest= from the address bar
$('#pest-dialog').addEventListener('close', () => history.replaceState(null, '', location.pathname));
// clicking the backdrop closes the dialog
$('#pest-dialog').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

(async () => {
  try {
    const [quiz, list, prices] = await Promise.all([getQuiz(), getPests(), getPricing()]);
    pests = list;
    pricing = prices;
    renderQuiz(quiz);
    renderGuide();
    const wanted = new URLSearchParams(location.search).get('pest');
    if (wanted) openDetails(wanted);
  } catch (err) {
    showError($('#quiz'), err);
  }
})();
