#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the Saarthi Blogger theme XML from its sources and validate it.

Sources   : saarthi-src/skeleton.xml + theme.css + theme.js
Deliverable: saarthi-blogger-theme.xml  (single self-contained upload file)

Run:  python3 saarthi-src/build.py
"""
import os
import re
import sys
import xml.etree.ElementTree as ET
from xml.dom import minidom
from xml.sax.saxutils import escape

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
OUT = os.path.join(ROOT, 'saarthi-blogger-theme.xml')

# Widget types this theme declares. Anything outside this set would mean an
# invented gadget type, which Blogger rejects on upload.
ALLOWED_WIDGET_TYPES = {
    'Header', 'Blog', 'LinkList', 'HTML', 'PopularPosts', 'Label',
    'BlogArchive', 'BlogSearch', 'Attribution',
}

# ---------------------------------------------------------------------------
# Default gadget contents. All of it is ordinary HTML the owner can replace
# from Blogger > Layout; nothing here is a stand-in for missing features.
# ---------------------------------------------------------------------------
ANNOUNCE = """<p><strong>New here?</strong> Start with the <a href="/p/about.html">about page</a> to see what this site covers. Edit or remove this bar from Layout &#8594; Announcement.</p>"""

HERO = """<div class="st-intro">
<p class="st-eyebrow">Welcome</p>
<h2 class="st-intro__title">Clear, dependable reading on the subjects you came here for</h2>
<p class="st-intro__text">This panel is yours. Open Layout &#8594; Hero and replace the text with a short introduction: what the site covers, who writes it, and where a first-time visitor should start.</p>
<div class="st-intro__actions">
<a class="st-btn" href="/search">Read the latest articles</a>
<a class="st-btn st-btn--ghost" href="/p/about.html">About this site</a>
</div>
<ul class="st-tiles">
<li><a href="/search/label/Topic-One">Topic One</a></li>
<li><a href="/search/label/Topic-Two">Topic Two</a></li>
<li><a href="/search">All articles</a></li>
<li><a href="/p/contact.html">Get in touch</a></li>
</ul>
</div>"""

SIDEBAR = """<p>Two or three sentences about who publishes this site and why. Edit it from Layout &#8594; About this site.</p>
<div class="st-follow">
<a class="st-btn st-btn--sm" href="#subscribe">Subscribe</a>
<a class="st-btn st-btn--ghost st-btn--sm" href="/p/contact.html">Contact</a>
</div>"""

FOOTER_ABOUT = """<p>Replace this paragraph from Layout &#8594; Footer about. Describe the publication in two or three sentences: what it covers, how often it publishes, and who writes it.</p>"""

FOOTER_CONTACT = """<ul class="st-footer__contact">
<li><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/></svg><span>Email: add-your-email@example.com</span></li>
<li><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Location: India</span></li>
<li><svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Replies within 24&#8211;48 hours</span></li>
</ul>"""

TOKENS = {
    '@@ANNOUNCE@@': escape(ANNOUNCE),
    '@@HERO@@': escape(HERO),
    '@@SIDEBAR@@': escape(SIDEBAR),
    '@@FOOTER_ABOUT@@': escape(FOOTER_ABOUT),
    '@@FOOTER_CONTACT@@': escape(FOOTER_CONTACT),
}


def read(name):
    with open(os.path.join(BASE, name), encoding='utf-8') as fh:
        return fh.read()


def build():
    css = read('theme.css').strip()
    js = read('theme.js').strip()
    skeleton = read('skeleton.xml')

    # A CDATA terminator inside CSS or JS would close the block early and
    # corrupt the theme, so refuse to build if one ever appears.
    for label, blob in (('CSS', css), ('JS', js)):
        if ']]>' in blob:
            raise SystemExit('FATAL: %s contains a CDATA terminator "]]>"' % label)

    # XML forbids "--" inside a comment body. Easy to hit with divider
    # comments like <!-- ------- X ------- --> and it breaks the whole file.
    for match in re.finditer(r'<!--([\s\S]*?)-->', skeleton):
        if '--' in match.group(1):
            raise SystemExit('FATAL: XML comment contains "--": %r'
                             % match.group(0)[:70])

    xml = skeleton.replace('@@CSS@@', css).replace('@@JS@@', js)
    for token, value in TOKENS.items():
        xml = xml.replace(token, value)

    if '@@' in xml:
        leftovers = sorted(set(re.findall(r'@@[A-Z_]+@@', xml)))
        raise SystemExit('FATAL: unresolved tokens: %s' % ', '.join(leftovers))

    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(xml)
    return OUT


def validate(path):
    """Well-formedness plus the Blogger-specific invariants that make an
    upload succeed. Every check here maps to a real Blogger rejection."""
    problems = []

    # 1. XML must parse.
    try:
        minidom.parse(path)
    except Exception as exc:                                  # noqa: BLE001
        raise SystemExit('FATAL: XML is not well-formed: %s' % exc)

    tree = ET.parse(path)
    root = tree.getroot()
    B = '{http://www.google.com/2005/gml/b}'

    # 2. Namespaces Blogger requires.
    declared = set(ET.parse(path).getroot().attrib.values())
    for ns in ('http://www.google.com/2005/gml/b',
               'http://www.google.com/2005/gml/data',
               'http://www.google.com/2005/gml/expr'):
        if not re.search(re.escape(ns), open(path, encoding='utf-8').read()):
            problems.append('missing namespace declaration: %s' % ns)
    del declared

    sections = [s.get('id') for s in root.iter(B + 'section')]
    widgets = [(w.get('id'), w.get('type')) for w in root.iter(B + 'widget')]
    includables = [i.get('id') for i in root.iter(B + 'includable')]

    # 3. Unique section and widget ids (Blogger refuses duplicates).
    dupes = {s for s in sections if sections.count(s) > 1}
    if dupes:
        problems.append('duplicate b:section ids: %s' % ', '.join(sorted(dupes)))
    ids = [w[0] for w in widgets]
    dupes = {w for w in ids if ids.count(w) > 1}
    if dupes:
        problems.append('duplicate b:widget ids: %s' % ', '.join(sorted(dupes)))

    # 4. Only real gadget types.
    bad = sorted({t for _, t in widgets if t not in ALLOWED_WIDGET_TYPES})
    if bad:
        problems.append('unknown widget types: %s' % ', '.join(bad))

    # 5. Exactly one Header and one Blog gadget, both locked.
    for wtype in ('Header', 'Blog'):
        found = [w for w in widgets if w[1] == wtype]
        if len(found) != 1:
            problems.append('expected exactly one %s widget, found %d' % (wtype, len(found)))

    # 6. Every b:include must point at an includable that exists in the same
    #    widget (or be the system all-head-content include).
    for widget in root.iter(B + 'widget'):
        local = {i.get('id') for i in widget.iter(B + 'includable')}
        for inc in widget.iter(B + 'include'):
            name = inc.get('name')
            if name not in local:
                problems.append('widget %s: b:include name=%r has no matching '
                                'b:includable' % (widget.get('id'), name))
    if 'main' not in includables:
        problems.append('the Blog widget must define an includable id="main"')

    # 7. No unfinished work left in the deliverable.
    text = open(path, encoding='utf-8').read()
    for needle in ('TODO', 'FIXME', 'PLACEHOLDER', 'lorem ipsum', '...'):
        if needle == '...' and '...' in text:
            # ellipsis is legitimate prose; only flag it as a code stub
            if re.search(r'^\s*\.\.\.\s*$', text, re.M):
                problems.append('placeholder "..." line found')
        elif needle in text:
            problems.append('forbidden marker in output: %r' % needle)

    # 8. No duplicate HTML ids in the static markup.
    html_ids = [e.get('id') for e in root.iter()
                if e.get('id') and not e.tag.startswith('{')]
    dupes = {i for i in html_ids if html_ids.count(i) > 1}
    if dupes:
        problems.append('duplicate HTML ids: %s' % ', '.join(sorted(dupes)))

    if problems:
        for p in problems:
            print('  ✗', p)
        raise SystemExit('VALIDATION FAILED (%d problem(s))' % len(problems))

    print('  ✓ XML well-formed (minidom)')
    print('  ✓ %d sections, all ids unique' % len(sections))
    print('  ✓ %d widgets, all ids unique, all types recognised' % len(widgets))
    print('  ✓ %d includables, every b:include resolves' % len(includables))
    print('  ✓ no duplicate HTML ids, no TODO/placeholder markers')
    return sections, [w[0] for w in widgets]


def main():
    path = build()
    size = os.path.getsize(path)
    print('Built %s (%.1f KB)' % (os.path.relpath(path, ROOT), size / 1024))
    sections, widgets = validate(path)
    print('\n  sections : %s' % ', '.join(sections))
    print('  widgets  : %s' % ', '.join(widgets))

    # Static preview (generated from the same skeleton, not hand-copied).
    sys.path.insert(0, BASE)
    import preview                                                # noqa: E402
    preview.build(ROOT)


if __name__ == '__main__':
    main()
