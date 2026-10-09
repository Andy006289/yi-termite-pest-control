/* xml.ts — small helpers around @xmldom/xmldom.

   React Native has no built-in DOMParser, so the app uses xmldom, which implements the
   same W3C DOM API the Assessment 2 website used in the browser (DOMParser,
   XMLSerializer, createElement, setAttribute). xmldom has no querySelector, so these
   helpers replace the CSS selectors from the web version. */

import { DOMParser, XMLSerializer, onErrorStopParsing, type Document, type Element } from '@xmldom/xmldom';

export type XmlDoc = Document;
export type XmlEl = Element;

/** Parses XML text. Throws if the text is not well-formed. */
export function parseXml(text: string, name = 'XML'): XmlDoc {
  try {
    const doc = new DOMParser({ onError: onErrorStopParsing }).parseFromString(text, 'text/xml');
    if (!doc.documentElement) throw new Error('no root element');
    return doc;
  } catch (e) {
    throw new Error(`${name} is not well-formed XML (${(e as Error).message.split('\n')[0]})`);
  }
}

export function serializeXml(doc: XmlDoc): string {
  return new XMLSerializer().serializeToString(doc);
}

/** Direct child elements, optionally only those with a given tag name ("parent > tag"). */
export function kids(el: XmlEl | null | undefined, tag?: string): XmlEl[] {
  if (!el) return [];
  const out: XmlEl[] = [];
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && (!tag || (n as XmlEl).tagName === tag)) out.push(n as XmlEl);
  }
  return out;
}

/** First descendant element with this tag name (like querySelector('tag')). */
export function first(el: XmlEl | XmlDoc | null | undefined, tag: string): XmlEl | null {
  if (!el) return null;
  return (el.getElementsByTagName(tag)[0] as XmlEl | undefined) ?? null;
}

/** All descendant elements with this tag name. */
export function all(el: XmlEl | XmlDoc | null | undefined, tag: string): XmlEl[] {
  if (!el) return [];
  return Array.from(el.getElementsByTagName(tag)) as XmlEl[];
}

/** Children found by a path of direct child tags: path(root, 'quiz', 'question'). */
export function path(el: XmlEl | null | undefined, ...tags: string[]): XmlEl[] {
  let level: XmlEl[] = el ? [el] : [];
  for (const tag of tags) level = level.flatMap((e) => kids(e, tag));
  return level;
}

/** Trimmed text content ('' when missing). */
export const txt = (el: XmlEl | null | undefined): string => (el?.textContent ?? '').trim();
/** Trimmed text of the first descendant with this tag. */
export const textOf = (el: XmlEl | null | undefined, tag: string): string => txt(first(el, tag));
/** Attribute as string ('' when missing). */
export const attr = (el: XmlEl | null | undefined, name: string): string => el?.getAttribute(name) ?? '';
/** Attribute as number (NaN when missing). */
export const num = (el: XmlEl | null | undefined, name: string): number => Number(el?.getAttribute(name));
export const has = (el: XmlEl | null | undefined, name: string): boolean => !!el?.hasAttribute(name);
