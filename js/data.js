/* data.js — loads the XML files in /data and turns them into plain JavaScript objects.
   Every file is fetched once per page (cached promise) and parsed with DOMParser.
   A file that is missing or not well-formed raises an error the page can show. */

const cache = new Map();

/** Fetches data/<name>.xml and returns the parsed XML Document. */
export function loadXML(name) {
  if (!cache.has(name)) {
    const doc = fetch(`data/${name}.xml`)
      .then((res) => {
        if (!res.ok) throw new Error(`data/${name}.xml could not be loaded (HTTP ${res.status})`);
        return res.text();
      })
      .then((text) => {
        const xml = new DOMParser().parseFromString(text, 'application/xml');
        if (xml.getElementsByTagName('parsererror').length) throw new Error(`data/${name}.xml is not well-formed XML`);
        return xml;
      });
    cache.set(name, doc);
  }
  return cache.get(name);
}

/** Trimmed text of the first matching child element ('' if there is none). */
export const text = (el, selector) => el.querySelector(selector)?.textContent.trim() ?? '';
/** Numeric attribute value. */
export const num = (el, attr) => Number(el.getAttribute(attr));

/* ---------------- pests.xml ---------------- */

/** All pests, in file order. */
export async function getPests() {
  const xml = await loadXML('pests');
  return [...xml.querySelectorAll('catalogue > pest')].map((p) => ({
    id: p.getAttribute('id'),
    tag: p.getAttribute('tag'),
    tone: p.getAttribute('tone'),
    name: text(p, 'name'),
    species: text(p, 'species'),
    scientific: p.querySelector('species').getAttribute('scientific'),
    where: text(p, 'where'),
    advice: text(p, 'advice'),
    included: text(p, 'included'),
    variables: text(p, 'variables'),
    prep: [...p.querySelectorAll('prep > step')].map((s) => s.textContent.trim()),
    alsoConsider: text(p, 'alsoConsider'),
    cues: [...p.querySelectorAll('cues > cue')].map((c) => ({
      question: c.getAttribute('question'),
      answer: c.getAttribute('answer'),
      weight: num(c, 'weight'),
    })),
  }));
}

/** One pest by id (undefined if unknown). */
export async function getPest(id) {
  return (await getPests()).find((p) => p.id === id);
}

/** The identification quiz: questions with their answer options. */
export async function getQuiz() {
  const xml = await loadXML('pests');
  return [...xml.querySelectorAll('quiz > question')].map((q) => ({
    id: q.getAttribute('id'),
    title: q.getAttribute('title'),
    style: q.getAttribute('style') || 'tiles',
    options: [...q.querySelectorAll('option')].map((o) => ({
      id: o.getAttribute('id'),
      label: o.textContent.trim(),
      icon: o.getAttribute('icon'),
      hint: o.getAttribute('hint'),
    })),
  }));
}

/**
 * Scores every pest against the quiz answers ({ where: 'kitchen', look: 'brown-flat', … }).
 * A pest earns each cue's weight when that answer was chosen. Returns the pests sorted
 * best first, each with score and confidence (score as a share of the pest's maximum).
 */
export function rankPests(pests, answers) {
  return pests
    .map((pest) => {
      const max = pest.cues.reduce((sum, c) => sum + c.weight, 0);
      const score = pest.cues.filter((c) => answers[c.question] === c.answer).reduce((sum, c) => sum + c.weight, 0);
      return { pest, score, confidence: max ? score / max : 0 };
    })
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence);
}
