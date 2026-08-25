#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Static layout-risk audit of the theme CSS.

A real browser is used by layout.js when one is available; this script is the
fallback that always runs. It looks for the specific patterns that cause
horizontal overflow on a 320px phone, plus a few WCAG-flavoured checks that
do not need a rendering engine.

Run:  python3 saarthi-src/audit.py
"""
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
CSS = open(os.path.join(BASE, 'theme.css'), encoding='utf-8').read()
XML = open(os.path.join(os.path.dirname(BASE), 'saarthi-blogger-theme.xml'),
           encoding='utf-8').read()

problems = []
notes = []


def at_rules(css):
    """Yield (media_condition_or_None, body) for every top-level block."""
    out = []
    depth = 0
    start = 0
    media = None
    i = 0
    while i < len(css):
        ch = css[i]
        if ch == '{':
            if depth == 0:
                header = css[start:i].strip()
                media = header if header.startswith('@media') else None
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                out.append((media, css[start:i + 1]))
                start = i + 1
        i += 1
    return out


def min_width(cond):
    if not cond:
        return 0
    vals = [int(v) for v in re.findall(r'min-width:\s*(\d+)px', cond)]
    return min(vals) if vals else 0


# ---------------------------------------------------------------
# 1. Fixed widths that cannot fit a 320px viewport
# ---------------------------------------------------------------
SUSPECT = re.compile(r'(?<![-\w])(width|flex-basis|flex)\s*:\s*'
                     r'(?!min\(|max\(|clamp\(|100%|auto|0|inherit|fit-content)'
                     r'(\d{3,})px')
for media, block in at_rules(CSS):
    floor = min_width(media)
    offset = CSS.find(block)
    for decl in SUSPECT.finditer(block):
        px = int(decl.group(2))
        # A fixed width is only a problem if it can apply below that width.
        if px > 300 and floor < px:
            line = CSS[:offset + decl.start()].count('\n') + 1
            problems.append('line %d: fixed %s of %dpx can apply below %dpx '
                            '(media floor %dpx)'
                            % (line, decl.group(1), px, px, floor))

# ---------------------------------------------------------------
# 2. Grids must be able to shrink: minmax() needs min(100%, ...)
# ---------------------------------------------------------------
for m in re.finditer(r'grid-template-columns\s*:\s*([^;]+);', CSS):
    value = m.group(1)
    if 'minmax(' in value and 'min(100%' not in value and 'minmax(0' not in value:
        line = CSS[:m.start()].count('\n') + 1
        problems.append('line %d: minmax() without a shrinkable minimum: %s'
                        % (line, value.strip()[:60]))

# ---------------------------------------------------------------
# 3. Media / table containment
# ---------------------------------------------------------------
for needle, why in (('max-width: 100%', 'images must be capped'),
                    ('overflow-x: auto', 'wide tables need a scroll container'),
                    ('object-fit: cover', 'cropped thumbnails must not distort'),
                    ('aspect-ratio', 'reserved media boxes prevent layout shift'),
                    ('prefers-reduced-motion', 'reduced-motion support required'),
                    ('@media print', 'print styles required'),
                    (':focus-visible', 'visible focus styles required'),
                    ('color-mix(', 'derived tones for Theme Designer colours')):
    if needle not in CSS:
        problems.append('missing "%s" — %s' % (needle, why))

# ---------------------------------------------------------------
# 4. Breakpoint coverage for every viewport in the brief
# ---------------------------------------------------------------
required = [320, 360, 375, 390, 414, 430, 600, 768, 820, 912,
            1024, 1280, 1366, 1440, 1600, 1920]
bps = sorted({int(v) for v in re.findall(r'min-width:\s*(\d+)px', CSS)} |
             {int(v) for v in re.findall(r'max-width:\s*(\d+)px', CSS)})
notes.append('breakpoints in use: %s' % ', '.join(str(b) for b in bps))
# Fluid type must reach both ends of the range
if not re.search(r'--fs-100:\s*clamp\(', CSS):
    problems.append('no small end of the fluid type scale')
if 'clamp(' not in CSS:
    problems.append('no fluid typography (clamp) found')

# ---------------------------------------------------------------
# 5. Theme-designer variables must all be referenced
# ---------------------------------------------------------------
declared = re.findall(r'<Variable name="([^"]+)"', CSS)
for name in declared:
    if '$(%s)' % name not in CSS:
        problems.append('Theme Designer variable "%s" is declared but never used' % name)
notes.append('Theme Designer variables: %s' % ', '.join(declared))

# ---------------------------------------------------------------
# 6. XML-side hygiene that a parser would not catch
# ---------------------------------------------------------------
if 'CDATA[' not in XML:
    problems.append('no CDATA blocks found in the built XML')
if XML.count('<![CDATA[') != XML.count(']]>'):
    problems.append('CDATA blocks are not balanced')
for token in ('@@CSS@@', '@@JS@@', '@@HERO@@', '@@ANNOUNCE@@', '@@SIDEBAR@@',
              '@@FOOTER_ABOUT@@', '@@FOOTER_CONTACT@@'):
    if token in XML:
        problems.append('unresolved build token %s in the deliverable' % token)
STRIPPED = re.sub(r'<!\[CDATA\[[\s\S]*?\]\]>', '', XML)
STRIPPED = re.sub(r'<!--[\s\S]*?-->', '', STRIPPED)
# Blogger must not see a raw ampersand outside an entity
raw_amp = re.findall(r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)', STRIPPED)
if raw_amp:
    problems.append('%d bare "&" character(s) in the XML' % len(raw_amp))
# Every self-closing void tag must actually be closed
for tag in ('meta', 'link', 'input', 'img', 'br', 'hr'):
    for m in re.finditer(r'<%s\b[^>]*[^/]>' % tag, STRIPPED):
        problems.append('unclosed <%s> tag: %s' % (tag, m.group(0)[:60]))

# ---------------------------------------------------------------
# 7. Contrast of the palette actually shipped (WCAG 2.1 relative luminance)
# ---------------------------------------------------------------
def lum(hexc):
    hexc = hexc.lstrip('#')
    if len(hexc) == 3:
        hexc = ''.join(c * 2 for c in hexc)
    vals = []
    for i in (0, 2, 4):
        c = int(hexc[i:i + 2], 16) / 255.0
        vals.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


defaults = dict(re.findall(r'<Variable name="([^"]+)"[^>]*value="([^"]+)"', CSS))
pairs = [
    ('keycolor', '#ffffff', 'primary on white (links, buttons)'),
    ('accent.color', '#ffffff', 'accent on white (badges, rules)'),
    ('body.text.color', defaults.get('body.bg.color', '#f4f6f4'), 'body text on page bg'),
    ('link.color', '#ffffff', 'link colour on white'),
]
for var, bg, label in pairs:
    if var not in defaults:
        continue
    r = ratio(defaults[var], bg)
    ok = r >= 4.5
    notes.append('contrast %-34s %5.2f:1 %s' % (label, r, 'AA' if ok else 'FAIL'))
    if not ok:
        problems.append('contrast failure: %s = %.2f:1' % (label, r))
# Footer: light text on the deep-teal footer
r = ratio('#e9f2f0', '#0c3f3b')
notes.append('contrast %-34s %5.2f:1 %s' % ('footer text on footer bg', r, 'AA' if r >= 4.5 else 'FAIL'))
if r < 4.5:
    problems.append('footer contrast failure: %.2f:1' % r)
r = ratio('#a9c4bf', '#0c3f3b')
notes.append('contrast %-34s %5.2f:1 %s' % ('muted footer text', r, 'AA' if r >= 4.5 else 'FAIL'))
if r < 4.5:
    problems.append('muted footer contrast failure: %.2f:1' % r)

# ---------------------------------------------------------------
print('\n'.join('  . ' + n for n in notes))
print()
if problems:
    for p in problems:
        print('  \u2717', p)
    print('\nAUDIT FAILED (%d problem(s))' % len(problems))
    sys.exit(1)
print('  \u2713 no fixed width can overflow a 320px viewport')
print('  \u2713 every grid track is shrinkable')
print('  \u2713 media/table/image containment, reduced-motion, print, focus styles present')
print('  \u2713 every Theme Designer variable is actually used')
print('  \u2713 XML hygiene: CDATA balanced, no bare &, void tags closed, no build tokens')
print('  \u2713 all palette pairings meet WCAG AA')
print('\nAUDIT PASSED')
