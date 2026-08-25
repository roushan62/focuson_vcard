#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render the real Blogger skeleton into static HTML for visual review.

This is NOT a hand-written mock-up: it parses saarthi-src/skeleton.xml and
interprets the Blogger tags actually used by the theme (b:if / b:else /
b:loop / b:include / b:section / b:widget / data: / expr:), so the preview
and the shipped theme cannot drift apart.

Run through build.py, or:  python3 saarthi-src/preview.py
"""
import json
import os
import re
import shutil
import xml.etree.ElementTree as ET

BASE = os.path.dirname(os.path.abspath(__file__))

B = '{http://www.google.com/2005/gml/b}'
D = '{http://www.google.com/2005/gml/data}'
E = '{http://www.google.com/2005/gml/expr}'

VOID = {'meta', 'link', 'input', 'img', 'br', 'hr', 'source', 'area', 'base',
        'col', 'embed', 'param', 'track', 'wbr'}

# Preview-only link rewriting so the static pages navigate to each other.
LINK_MAP = {
    '/': 'index.html',
    '/search': 'label.html',
    '/search/label/Topic-One': 'label.html',
    '/search/label/Topic-Two': 'label.html',
    '/p/about.html': 'page.html',
    '/p/contact.html': 'page.html',
    '/p/privacy-policy.html': 'page.html',
    '/p/disclaimer.html': 'page.html',
    '/p/terms.html': 'page.html',
}

# Palette for the generated placeholder artwork (theme colours, so the
# preview looks intentional rather than stock).
ART = [
    ('#0d5f57', '#12776d'), ('#a63d2f', '#c25b48'), ('#31544f', '#4a7b73'),
    ('#8a6a1f', '#b08c2c'), ('#204a5c', '#356b82'), ('#5c3a4a', '#835569'),
]


# ---------------------------------------------------------------------------
# Mock content
# ---------------------------------------------------------------------------
def body(n, with_media=True):
    """A realistic long-form article body (drives TOC, typography tests)."""
    lead = ('<p>' + ('Field practice changes faster than the guidance that describes it. '
            'This piece walks through what actually works on the ground, what the '
            'common failure modes are, and how to check your own setup against '
            'both. It is written for people who have to make this work on a '
            'Tuesday afternoon, not for people writing about it later. ') * 2 + '</p>')
    media = ('<p><img alt="Diagram of the recommended workflow" src="img%d.svg"/></p>' % n
             ) if with_media else ''
    return lead + media + """
<h2>Where most setups go wrong</h2>
<p>Three failure modes account for almost every problem we are asked about. None
of them are exotic, and all three are cheap to rule out before you change
anything else.</p>
<ul>
<li><strong>Assumed defaults.</strong> The documented default is not always the
shipped default, and the shipped default is not always the configured one.</li>
<li><strong>Order of operations.</strong> Two steps that look independent are
not, and swapping them produces a result that looks correct until it is not.</li>
<li><strong>Missing feedback.</strong> When nothing reports failure, a silent
failure is indistinguishable from success.</li>
</ul>
<blockquote><p>The cheapest diagnostic is the one that tells you the system is
lying to you. Build that first, then optimise.</p></blockquote>
<h2>A working baseline</h2>
<p>Start from a configuration you can reproduce. Write it down, keep it under
version control, and treat any change to it as a change worth reviewing.</p>
<h3>Step one: measure before you change</h3>
<p>Record the current numbers. Without a baseline, every later comparison is an
argument rather than a measurement.</p>
<h3>Step two: change one thing</h3>
<p>Change a single variable, re-measure, and only then move on. It feels slower
and it is faster, because you always know which change did what.</p>
<pre><code># the smallest useful check
run --report --format=text --limit=10
# compare against the recorded baseline
diff baseline.txt report.txt</code></pre>
<h2>Reference values</h2>
<p>The table below is the range we see on healthy setups. Treat the edges of the
range as a prompt to investigate, not as an automatic failure.</p>
<table>
<thead><tr><th>Measure</th><th>Typical</th><th>Investigate above</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Response time</td><td>120&#8211;240 ms</td><td>600 ms</td><td>p95, warm cache</td></tr>
<tr><td>Error rate</td><td>under 0.4%</td><td>1.5%</td><td>rolling 24 hours</td></tr>
<tr><td>Queue depth</td><td>0&#8211;40</td><td>200</td><td>steady state, not peak</td></tr>
<tr><td>Cache hit ratio</td><td>88&#8211;96%</td><td>below 70%</td><td>after warm-up</td></tr>
</tbody>
</table>
<h2>What to do when it still fails</h2>
<p>Reproduce it on the smallest possible case. A failure you can trigger on
demand is half solved, because you can now test a fix instead of hoping for one.
Keep notes as you go: the sequence that turned out to matter is rarely the
sequence you expected.</p>
<h3>Escalation checklist</h3>
<ol>
<li>Confirm the failure still reproduces after a clean restart.</li>
<li>Capture one full trace, not a summary of several.</li>
<li>State what you changed and what you ruled out, in that order.</li>
</ol>
<p>Finally, write the fix down somewhere the next person will find it. An
unwritten fix is a future incident.</p>
"""


def post(n, title, label, excerpt=None):
    return {
        'id': '70000000000000000%02d' % n,
        'title': title,
        'url': 'post.html',
        'body': body(n),
        'author': 'Roushan Gupta',
        'authorProfileUrl': 'https://www.blogger.com/profile/0000000000000000',
        'authorAboutMe': ('Writes about practical field work, measurement, and the '
                          'unglamorous parts of keeping systems running. Based in India.'),
        'timestamp': ['12 August 2026', '4 August 2026', '27 July 2026',
                      '19 July 2026', '8 July 2026', '1 July 2026',
                      '22 June 2026'][n % 7],
        'timestampISO8601': '2026-08-%02dT09:30:00+05:30' % (28 - n * 3),
        'lastUpdatedISO8601': '2026-08-%02dT14:10:00+05:30' % (29 - n * 3),
        'numComments': [7, 0, 3, 12, 1, 0, 5][n % 7],
        'allowComments': True,
        'addCommentUrl': '#comments',
        'isFirstPost': n == 0,
        'labels': [{'name': label, 'url': '/search/label/' + label, 'isLast': True}],
        'comments': [
            {'id': '1', 'author': 'Ananya Sharma', 'authorUrl': '',
             'timestamp': '13 August 2026, 10:12',
             'body': 'The baseline point is the one nobody wants to hear and '
                     'everyone needs. We skipped it for a month and paid for it.'},
            {'id': '2', 'author': 'Vikram Nair', 'authorUrl': 'https://example.com',
             'timestamp': '14 August 2026, 08:44',
             'body': 'Worked through the checklist on our staging setup today. '
                     'Second item was exactly our problem.'},
        ],
    }


TITLES = [
    ('A practical baseline for measuring what actually changed', 'Guides'),
    ('Interview: running a small team through a long migration', 'Interviews'),
    ('What the revised guidelines mean for day-to-day work', 'Policy'),
    ('Seven field errors we see every single month', 'Guides'),
    ('Reading a specification without losing an afternoon', 'Guides'),
    ('Interview: the case for boring, reproducible tooling', 'Interviews'),
    ('A short history of the reporting requirement', 'Policy'),
]
POSTS = [post(i, t, l) for i, (t, l) in enumerate(TITLES)]
LABELS = [('Guides', 18), ('Interviews', 7), ('Policy', 11), ('Archives', 4)]
MONTHS = [('August 2026', 6), ('July 2026', 9), ('June 2026', 7), ('May 2026', 5)]


# ---------------------------------------------------------------------------
# Tiny expression evaluator (covers exactly what the theme uses)
# ---------------------------------------------------------------------------
def atom(tok, ctx):
    tok = tok.strip()
    if len(tok) > 1 and tok[0] == tok[-1] and tok[0] in '"\'':
        return tok[1:-1]
    if tok.startswith('data:'):
        return lookup(tok[5:], ctx)
    return ''


def lookup(path, ctx):
    cur = ctx
    for part in path.split('.'):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return ''
    return cur


def split_top(expr, sep):
    parts, buf, quote = [], '', None
    i = 0
    while i < len(expr):
        ch = expr[i]
        if quote:
            buf += ch
            if ch == quote:
                quote = None
        elif ch in '"\'':
            quote = ch
            buf += ch
        elif expr[i:i + len(sep)] == sep:
            parts.append(buf)
            buf = ''
            i += len(sep)
            continue
        else:
            buf += ch
        i += 1
    parts.append(buf)
    return parts


def resolve(expr, ctx):
    return ''.join(str(atom(p, ctx)) for p in split_top(expr, '+'))


def eval_cond(cond, ctx):
    cond = cond.strip()
    if ' or ' in cond:
        return any(eval_cond(p, ctx) for p in split_top(cond, ' or ') if p.strip())
    if ' and ' in cond:
        return all(eval_cond(p, ctx) for p in split_top(cond, ' and ') if p.strip())
    for op in ('==', '!='):
        if op in cond:
            left, right = cond.split(op, 1)
            lv, rv = atom(left, ctx), atom(right, ctx)
            return lv == rv if op == '==' else lv != rv
    return bool(atom(cond, ctx))


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------
def esc(text):
    return (str(text).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def child_items(el):
    items = []
    if el.text:
        items.append(('t', el.text))
    for kid in el:
        items.append(('e', kid, kid.tail or ''))
    return items


def render_items(items, ctx, out):
    for item in items:
        if item[0] == 't':
            out.append(item[1])
        else:
            render_node(item[1], ctx, out)
            out.append(item[2])


def render_node(el, ctx, out):
    tag = el.tag
    if tag.startswith(B):
        name = tag[len(B):]
        if name == 'if':
            items = child_items(el)
            idx = next((i for i, it in enumerate(items)
                        if it[0] == 'e' and it[1].tag == B + 'else'), None)
            if eval_cond(el.get('cond'), ctx):
                chosen = items[:idx] if idx is not None else items
            else:
                chosen = ([('t', items[idx][2])] if idx is not None and items[idx][2] else [])
                chosen += items[idx + 1:] if idx is not None else []
            render_items(chosen, ctx, out)
        elif name == 'loop':
            values = lookup(el.get('values', '')[5:], ctx)
            if not isinstance(values, list):
                values = []
            for value in values:
                sub = dict(ctx)
                sub[el.get('var')] = value
                render_items(child_items(el), sub, out)
        elif name == 'include':
            includable = None
            widget = ctx.get('__widget__')
            scope = widget if widget is not None else el
            for cand in scope.iter(B + 'includable'):
                if cand.get('id') == el.get('name'):
                    includable = cand
                    break
            if includable is not None:
                sub = dict(ctx)
                ref = el.get('data')
                if ref:
                    # b:include data='post' passes the *variable* called post
                    path = ref[5:] if ref.startswith('data:') else ref
                    var = el.get('var') or includable.get('var') or 'x'
                    sub[var] = lookup(path, ctx)
                render_items(child_items(includable), sub, out)
        elif name == 'skin':
            out.append('<link rel="stylesheet" href="theme.css">')
        elif name == 'section':
            render_section(el, ctx, out)
        elif name == 'widget':
            sub = dict(ctx)
            sub['__widget__'] = el
            out.append(widget_html(el, sub))
        # b:else / b:widget-settings / b:widget-setting / b:includable: parents
        return

    if tag.startswith(D):
        path = tag[len(D):]
        value = lookup(path, ctx)
        # Blogger emits post/comment bodies as trusted HTML; everything else
        # is treated as text here so mock titles cannot break the markup.
        out.append(value if path.endswith('.body') else esc(value))
        return

    local = tag.split('}')[-1]
    if local == 'script' and 'PREVIEW_JS' in (el.text or ''):
        out.append('<script src="theme.js"></script>')
        return

    attrs = []
    for key, val in el.attrib.items():
        if key.startswith(E):
            attrs.append('%s="%s"' % (key[len(E):], esc(resolve(val, ctx))))
        elif key.startswith('{'):
            continue      # xmlns / b: attributes: meaningless in the preview
        else:
            attrs.append('%s="%s"' % (key, esc(val)))
    head = '<' + local + (' ' + ' '.join(attrs) if attrs else '')
    if local in VOID:
        out.append(head + '>')
        return
    out.append(head + '>')
    render_items(child_items(el), ctx, out)
    out.append('</%s>' % local)


# ---------------------------------------------------------------------------
# Gadget mocks — markup mirrors Blogger's own output for each gadget type
# ---------------------------------------------------------------------------
def settings_of(widget):
    out = {}
    for setting in widget.iter(B + 'widget-setting'):
        out[setting.get('name')] = (setting.text or '').strip()
    return out


def widget_html(widget, ctx=None):
    wtype = widget.get('type')
    wid = widget.get('id')
    title = widget.get('title') or ''
    s = settings_of(widget)
    head = '<div class="widget %s" id="%s">' % (wtype, wid)
    h2 = '<h2>%s</h2>' % esc(title) if title else ''
    tail = '</div>'

    if wtype == 'Blog':
        # The Blog gadget runs its own includables, exactly like Blogger.
        out = [head]
        sub = dict(ctx or {})
        sub['__widget__'] = widget
        for inc in widget.findall(B + 'includable'):
            if inc.get('id') == 'main':
                render_items(child_items(inc), sub, out)
        out.append(tail)
        return ''.join(out)

    if wtype == 'Header':
        return (head + '<div class="header-widget"><h1 class="title">'
                '<a href="/">SITE NAME</a></h1>'
                '<p class="description">YOUR TAGLINE</p></div>' + tail)

    if wtype == 'HTML':
        return head + h2 + '<div class="widget-content">%s</div>' % s.get('content', '') + tail

    if wtype == 'LinkList':
        items = []
        i = 0
        while 'text-%d' % i in s:
            items.append('<li><a href="%s">%s</a></li>'
                         % (esc(s.get('link-%d' % i, '#')), esc(s['text-%d' % i])))
            i += 1
        return (head + h2 + '<div class="widget-content"><ul>%s</ul></div>' % ''.join(items) + tail)

    if wtype == 'PopularPosts':
        thumbs = s.get('showThumbnails') == 'true'
        snippets = s.get('showSnippets') == 'true'
        n = int(s.get('numItemsToShow') or 5)
        items = []
        for k, p in enumerate(POSTS[1:n + 1]):
            thumb = ('<div class="item-thumbnail"><a href="%s">'
                     '<img alt="" height="72" src="img%d.svg" width="72"/></a></div>'
                     % (p['url'], k + 1)) if thumbs else ''
            snip = '<div class="item-snippet">A short extract of the article, ' \
                   'clamped by the theme.</div>' if snippets else ''
            items.append('<li><div class="item-content">%s<div class="item-title">'
                         '<a href="%s">%s</a></div>%s</div></li>'
                         % (thumb, p['url'], esc(p['title']), snip))
        return (head + h2 + '<div class="widget-content popular-posts"><ul>%s</ul></div>'
                % ''.join(items) + tail)

    if wtype == 'Label':
        counts = s.get('showFreqNumbers') == 'true'
        items = ''.join('<li><a dir="ltr" href="/search/label/%s">%s</a>%s</li>'
                        % (name, name,
                           '<span class="label-count" dir="ltr">(%d)</span>' % count if counts else '')
                        for name, count in LABELS)
        return (head + h2 + '<div class="widget-content list-label-widget-content">'
                '<ul>%s</ul></div>' % items + tail)

    if wtype == 'BlogArchive':
        items = ''.join('<li class="archivedate"><a href="/2026_%02d_01_archive.html">%s</a>'
                        '<span class="post-count" dir="ltr">(%d)</span></li>'
                        % (i + 5, name, count) for i, (name, count) in enumerate(MONTHS))
        return (head + h2 + '<div class="widget-content"><div id="ArchiveList">'
                '<div id="%s_ArchiveList"><ul class="flat">%s</ul></div></div></div>'
                % (wid, items) + tail)

    if wtype == 'BlogSearch':
        return (head + h2 + '<div class="widget-content" role="search">'
                '<form action="/search" method="get">'
                '<input class="search-input" name="q" placeholder="Search" type="text" value=""/>'
                '<input class="search-action" type="submit" value="Search"/></form>'
                '</div>' + tail)

    if wtype == 'Attribution':
        return (head + '<div class="widget-content"><div class="copyright">'
                'Powered by <a href="https://www.blogger.com">Blogger</a>.</div></div>' + tail)

    return head + h2 + tail


def render_section(section, ctx, out):
    out.append('<div class="section %s" id="%s">'
               % (section.get('class', ''), section.get('id')))
    for widget in section.findall(B + 'widget'):
        sub = dict(ctx)
        sub['__widget__'] = widget
        out.append(widget_html(widget, sub))
    out.append('</div>')


def render(el, ctx, out):
    if el.tag == B + 'section':
        render_section(el, ctx, out)
        if el.tail:
            out.append(el.tail)
        return
    if el.tag == B + 'widget':
        sub = dict(ctx)
        sub['__widget__'] = el
        out.append(widget_html(el))
        return
    render_node(el, ctx, out)


def render_page(root, ctx):
    out = ['<!DOCTYPE html>\n']
    render_node(root, ctx, out)
    html = ''.join(out)
    html = re.sub(r'<!\[CDATA\[|\]\]>', '', html)
    for src, dst in LINK_MAP.items():
        html = html.replace('href="%s"' % src, 'href="%s"' % dst)
        html = html.replace('action="%s"' % src, 'action="%s"' % dst)
    return html


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
def write_art(folder):
    for i, (a, b) in enumerate(ART, start=1):
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" '
               'width="1200" height="675" role="img">'
               '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
               '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
               '</linearGradient></defs>'
               '<rect width="1200" height="675" fill="url(#g)"/>'
               '<g fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2">'
               '<circle cx="960" cy="150" r="220"/><circle cx="960" cy="150" r="140"/>'
               '<path d="M0 520h1200M0 560h1200M0 600h1200"/></g>'
               '<text x="60" y="620" fill="#ffffff" fill-opacity=".55" '
               'font-family="system-ui,sans-serif" font-size="34" font-weight="600">'
               'Preview artwork %d</text></svg>' % (a, b, i))
        with open(os.path.join(folder, 'img%d.svg' % i), 'w', encoding='utf-8') as fh:
            fh.write(svg)


def write_feeds(folder):
    """Static stand-ins for Blogger's Atom JSON feed so the featured rail and
    the related-posts rail can be exercised in the preview."""
    def entries(label, skip=None):
        out = []
        for p in POSTS:
            if label and p['labels'][0]['name'] != label:
                continue
            if skip and p['title'] == skip:
                continue
            out.append({
                'title': {'$t': p['title']},
                'link': [{'rel': 'alternate', 'href': 'post.html'}],
                'media$thumbnail': {'url': 'img%d.svg' % (POSTS.index(p) + 1)},
                'published': {'$t': '2026-08-%02dT09:30:00+05:30'
                              % (28 - POSTS.index(p) * 3)},
                'author': [{'name': {'$t': p['author']}}],
            })
        return {'feed': {'entry': out}}

    targets = {
        'feeds/posts/default/-/Featured': entries(''),
        'feeds/posts/default/-/Guides': entries('Guides', skip=TITLES[0][0]),
        'feeds/posts/default/-/Interviews': entries('Interviews'),
        'feeds/posts/default/-/Policy': entries('Policy'),
    }
    for rel, payload in targets.items():
        path = os.path.join(folder, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(payload, fh)


# ---------------------------------------------------------------------------
# Page contexts
# ---------------------------------------------------------------------------
def blog_ctx(**over):
    ctx = {
        'blog': {
            'title': 'SITE NAME',
            'homepageUrl': '/',
            'url': '/',
            'pageType': 'index',
            'pageName': '',
            'pageTitle': 'SITE NAME — YOUR TAGLINE',
            'searchLabel': '',
            'searchQuery': '',
            'metaDescription': 'A clear, dependable publication on practical work.',
            'postImageUrl': '',
            'locale': 'en',
            'languageDirection': 'ltr',
        },
        'navMessage': '',
        'commentLabel': 'comments',
        'postLabelsLabel': 'Topics',
        'newerPageUrl': '',
        'olderPageUrl': '/search?updated-max=2026-07-01',
        'newerPageTitle': '',
        'olderPageTitle': 'Older Posts',
        'posts': POSTS,
    }
    for key, value in over.items():
        if key == 'blog':
            ctx['blog'].update(value)
        else:
            ctx[key] = value
    return ctx


PAGES = {
    'index.html': blog_ctx(),
    'post.html': blog_ctx(blog={'pageType': 'item', 'pageName': TITLES[0][0],
                                'pageTitle': TITLES[0][0], 'url': 'post.html',
                                'postImageUrl': 'img1.svg'},
                          posts=[POSTS[0]],
                          newerPageUrl='post.html', newerPageTitle=TITLES[1][0]),
    'page.html': blog_ctx(blog={'pageType': 'static_page', 'pageName': 'About this site',
                                'pageTitle': 'About this site', 'url': 'page.html'},
                          posts=[dict(POSTS[0], title='About this site',
                                      labels=[], allowComments=False)]),
    'label.html': blog_ctx(blog={'pageType': 'index', 'searchLabel': 'Guides',
                                 'pageTitle': 'Guides — Topics', 'url': 'label.html'},
                           posts=[p for p in POSTS if p['labels'][0]['name'] == 'Guides']),
    'search-empty.html': blog_ctx(blog={'pageType': 'index', 'searchQuery': 'nothing here',
                                        'pageTitle': 'Search: nothing here',
                                        'url': 'search-empty.html'},
                                  posts=[], navMessage='No posts matching the query. Show all posts'),
    'label-empty.html': blog_ctx(blog={'pageType': 'index', 'searchLabel': 'Policy',
                                       'pageTitle': 'Policy', 'url': 'label-empty.html'},
                                 posts=[]),
    '404.html': blog_ctx(blog={'pageType': 'error_page', 'pageTitle': 'Page not found',
                               'url': '404.html'}, posts=[]),
}


def build(root):
    folder = os.path.join(root, 'saarthi-preview')
    if os.path.isdir(folder):
        shutil.rmtree(folder)
    os.makedirs(folder)

    skeleton = open(os.path.join(BASE, 'skeleton.xml'), encoding='utf-8').read()
    for token, value in (('@CSS@@', 'PREVIEW_CSS'), ('@@JS@@', 'PREVIEW_JS'),
                         ('@@ANNOUNCE@@', ''), ('@@HERO@@', ''), ('@@SIDEBAR@@', ''),
                         ('@@FOOTER_ABOUT@@', ''), ('@@FOOTER_CONTACT@@', '')):
        skeleton = skeleton.replace(token, value)
    # Re-inject the real (unescaped) gadget HTML the build step would store.
    import build as builder
    for token, value in builder.TOKENS.items():
        from xml.sax.saxutils import unescape
        skeleton = skeleton.replace(token, unescape(value))

    tree = ET.fromstring(skeleton)

    for name, ctx in PAGES.items():
        html = render_page(tree, ctx)
        with open(os.path.join(folder, name), 'w', encoding='utf-8') as fh:
            fh.write(html)

    shutil.copyfile(os.path.join(BASE, 'theme.css'), os.path.join(folder, 'theme.css'))
    shutil.copyfile(os.path.join(BASE, 'theme.js'), os.path.join(folder, 'theme.js'))
    write_art(folder)
    write_feeds(folder)

    index = ('<ul style="font:16px system-ui;line-height:2">'
             + ''.join('<li><a href="%s">%s</a></li>' % (n, n) for n in PAGES)
             + '</ul>')
    for name in PAGES:
        path = os.path.join(folder, name)
        with open(path, encoding='utf-8') as fh:
            content = fh.read()
        content = content.replace('</body>',
                                  '<div style="background:#16211f;color:#fff;padding:10px 16px;'
                                  'font:13px system-ui">Preview: %s %s</div></body>'
                                  % (name, index.replace('<ul', '<span').replace('</ul>', '</span>')
                                     .replace('<li>', ' ').replace('</li>', ' ·')),
                                  1)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)

    print('  ✓ preview: saarthi-preview/ (%d pages)' % len(PAGES))


if __name__ == '__main__':
    build(os.path.dirname(BASE))
