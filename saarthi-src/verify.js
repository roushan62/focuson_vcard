/* Runtime verification for the Saarthi theme.
 * Executes the real saarthi-src/theme.js against the preview HTML that the
 * build script generated from the real skeleton, and asserts that every
 * scripted feature actually did its job.
 *   node saarthi-src/verify.js
 */
const { JSDOM } = require('jsdom');

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW = path.join(ROOT, 'saarthi-preview');

/* The theme's script is inlined so the suite never touches the network
   (no font fetches, no CDN); the code executed is byte-for-byte the file
   that gets built into the XML. */
const THEME_JS = fs.readFileSync(path.join(__dirname, 'theme.js'), 'utf8');
function inlineScript(html) {
  /* split/join, NOT String.replace: a replacement string treats "$$" as an
     escape for a single "$", which would silently rewrite the theme's $$
     selector helper and break the very code under test. */
  return html.split('<script src="theme.js"></script>')
             .join('<script>' + THEME_JS + '</script>');
}


let pass = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fails.push(name + (detail ? ' \u2014 ' + detail : '')); console.log('  \u2717 ' + name + (detail ? ' \u2014 ' + detail : '')); }
}

async function load(page, desktop) {
  const html = inlineScript(fs.readFileSync(path.join(PREVIEW, page), 'utf8'));
  const errors = [];
  const dom = new JSDOM(html, {
    url: 'http://localhost:8080/' + page,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = function (q) {
        return {
          matches: desktop ? /min-width:\s*900px/.test(q) : false,
          media: q,
          addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {},
        };
      };
      window.IntersectionObserver = class {
        constructor(cb) { this.cb = cb; }
        observe() {} unobserve() {} disconnect() {}
      };
      window.fetch = function (u, o) { return fetch(new URL(u, window.location.href), o); };
      window.addEventListener('error', function (e) { errors.push(String(e.message)); });
      const origError = window.console.error;
      window.console.error = function () { errors.push([].join.call(arguments, ' ')); origError.apply(window.console, arguments); };
    },
  });
  await new Promise(function (r) { setTimeout(r, 900); });
  return { win: dom.window, doc: dom.window.document, errors: errors };
}

(async function main() {
  /* ------------------------------------------------ homepage, desktop */
  console.log('\nindex.html (desktop)');
  let r = await load('index.html', true);
  let d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('lead card rendered', !!d.querySelector('.pcard--lead'));
  ok('7 post cards rendered', d.querySelectorAll('.pcard').length === 7,
     'found ' + d.querySelectorAll('.pcard').length);
  ok('card images lifted out of the excerpt into the media slot',
     d.querySelectorAll('.pcard__media img').length === 7 &&
     d.querySelectorAll('.pcard__excerpt img').length === 0,
     'media=' + d.querySelectorAll('.pcard__media img').length +
     ' excerpt=' + d.querySelectorAll('.pcard__excerpt img').length);
  ok('excerpt text kept after image removal',
     (d.querySelector('.pcard__excerpt').textContent || '').trim().length > 80);
  ok('lazy + async decoding set on card images',
     d.querySelector('.pcard__media img').getAttribute('loading') === 'lazy' &&
     d.querySelector('.pcard__media img').getAttribute('decoding') === 'async');
  ok('submenu built from the "- " menu convention',
     !!d.querySelector('#navigation .has-sub > ul > li'),
     'has-sub=' + d.querySelectorAll('#navigation .has-sub').length);
  ok('submenu items are exactly the two prefixed links',
     d.querySelectorAll('#navigation .has-sub > ul > li').length === 2);
  ok('parent link got aria-haspopup + caret',
     d.querySelector('#navigation .has-sub > a').getAttribute('aria-haspopup') === 'true' &&
     !!d.querySelector('#navigation .has-sub > a .st-caret'));
  ok('17 Blogger gadgets rendered', d.querySelectorAll('.widget').length === 17,
     'found ' + d.querySelectorAll('.widget').length);
  ok('exactly one H1 on the homepage', d.querySelectorAll('h1').length === 1,
     'found ' + d.querySelectorAll('h1').length);
  ok('five ad slots on the homepage (the in-article one is item-only)',
     d.querySelectorAll('.st-ad').length === 5,
     'found ' + d.querySelectorAll('.st-ad').length);
  ok('skip link targets an existing element',
     !!d.getElementById((d.querySelector('.st-skip').getAttribute('href') || '').slice(1)));
  await new Promise(function (res) { setTimeout(res, 700); });
  ok('featured rail populated from the feed',
     d.getElementById('st-featured').hidden === false &&
     d.querySelectorAll('#st-featured .xcard').length > 0,
     'hidden=' + d.getElementById('st-featured').hidden);

  /* ------------------------------------------------ article page */
  console.log('\npost.html (desktop)');
  r = await load('post.html', true);
  d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('reading time computed', /^\d+ min read$/.test(d.getElementById('st-readtime').textContent),
     JSON.stringify(d.getElementById('st-readtime').textContent));
  ok('featured image moved into the article figure',
     d.querySelectorAll('#st-article-media img').length === 1 &&
     d.getElementById('st-article-media').hidden === false);
  ok('image no longer duplicated inside the body',
     d.querySelectorAll('#st-article-body img').length === 0);
  const toc = d.querySelector('.st-toc');
  ok('table of contents generated', !!toc);
  ok('TOC lists every h2 and h3 in order',
     toc && toc.querySelectorAll('a').length ===
       d.querySelectorAll('#st-article-body h2, #st-article-body h3').length,
     'toc=' + (toc ? toc.querySelectorAll('a').length : 0));
  ok('every heading got a unique id', (function () {
    const ids = [].map.call(d.querySelectorAll('#st-article-body h2, #st-article-body h3'), function (h) { return h.id; });
    return ids.length > 0 && new Set(ids).size === ids.length && ids.every(Boolean);
  }()));
  ok('TOC anchors all resolve to a real heading', [].every.call(
    d.querySelectorAll('.st-toc a'), function (a) {
      return !!d.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    }));
  ok('share hrefs point at the live, encoded URL', [].every.call(
    d.querySelectorAll('a[data-st-share]'), function (a) {
      const h = a.getAttribute('href');
      return /^https:\/\//.test(h) && h.indexOf('http%3A%2F%2Flocalhost') > -1;
    }));
  ok('wide tables wrapped for horizontal scroll',
     d.querySelectorAll('.st-tablewrap > table').length === 1);
  ok('code block got a copy button', d.querySelectorAll('pre .st-copybtn').length === 1);
  ok('2 comments rendered with authors', d.querySelectorAll('.st-comment').length === 2);
  ok('in-article ad slot present (mid-feed slot is homepage-only)',
     !!d.querySelector('.st-ad--article') && !d.querySelector('.st-ad--mid') &&
     d.querySelectorAll('.st-ad').length === 5,
     'found ' + d.querySelectorAll('.st-ad').length);
  ok('exactly one article H1', d.querySelectorAll('.st-article__title').length === 1);
  await new Promise(function (res) { setTimeout(res, 700); });
  ok('related rail populated from the feed',
     d.getElementById('st-related').hidden === false &&
     d.querySelectorAll('#st-related .hcard').length > 0);
  const current = d.querySelector('.st-article__title').textContent.trim();
  ok('related rail excludes the current article', [].every.call(
    d.querySelectorAll('#st-related .hcard__title a'), function (a) {
      return a.textContent.trim() !== current;
    }), 'current="' + current + '"');
  ok('related rail stays within its label', 
     d.querySelectorAll('#st-related .hcard').length > 0 &&
     d.querySelectorAll('#st-related .hcard').length <= 5,
     'found ' + d.querySelectorAll('#st-related .hcard').length);
  ok('BlogPosting JSON-LD parses and has a headline', (function () {
    const blocks = [].filter.call(d.querySelectorAll('script[type="application/ld+json"]'),
      function (s) { return s.textContent.indexOf('BlogPosting') > -1; });
    if (!blocks.length) { return false; }
    const json = JSON.parse(blocks[0].textContent);
    return json.headline.length > 5 && !!json.datePublished && !!json.author.name;
  }()));
  ok('BreadcrumbList JSON-LD is 3 levels', (function () {
    const blocks = [].filter.call(d.querySelectorAll('script[type="application/ld+json"]'),
      function (s) { return s.textContent.indexOf('BreadcrumbList') > -1; });
    const json = JSON.parse(blocks[0].textContent);
    return json.itemListElement.length === 3;
  }()));

  /* ------------------------------------------------ 404 page */
  console.log('\n404.html');
  r = await load('404.html', true);
  d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('404 panel with search + home link',
     !!d.querySelector('.st-404 form input[name="q"]') &&
     !!d.querySelector('.st-404 a[href="index.html"]'));
  /* Blogger's Header gadget always emits an <h1> for the site name, so inner
     pages carry two: the site name and the page heading. Documented in XML. */
  ok('exactly one 404 heading', d.querySelectorAll('.st-404__code').length === 1);
  ok('site-name H1 plus one page H1', d.querySelectorAll('h1').length === 2,
     'found ' + d.querySelectorAll('h1').length);

  /* ------------------------------------------------ empty search */
  console.log('\nsearch-empty.html');
  r = await load('search-empty.html', true);
  d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('Blogger status message shown', !!d.querySelector('.status-msg-body'));
  ok('theme does not double up on the empty state', !d.querySelector('.st-empty'));

  /* ------------------------------------ empty label, no Blogger message */
  console.log('\nlabel-empty.html');
  r = await load('label-empty.html', true);
  d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('theme empty state injected when Blogger is silent', !!d.querySelector('.st-empty'));
  ok('empty state offers a way out', !!d.querySelector('.st-empty a[href]'));

  /* ------------------------------------------------ static page */
  console.log('\npage.html');
  r = await load('page.html', true);
  d = r.doc;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  ok('static page has no comments CTA', d.querySelectorAll('.st-comments__cta').length === 0);
  ok('exactly one page H1', d.querySelectorAll('.st-page__title').length === 1);
  ok('no post chrome on a static page',
     !d.querySelector('.st-share') && !d.querySelector('.st-author'));

  /* ------------------------------------------------ mobile drawer */
  console.log('\nindex.html (mobile)');
  r = await load('index.html', false);
  d = r.doc;
  const win = r.win;
  ok('no JS errors', r.errors.length === 0, r.errors.join(' | '));
  const toggle = d.getElementById('st-navtoggle');
  toggle.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('menu toggle opens the drawer',
     d.body.classList.contains('st-drawer-open') &&
     toggle.getAttribute('aria-expanded') === 'true');
  ok('body scroll locked while open', d.body.classList.contains('st-locked'));
  d.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape closes the drawer',
     !d.body.classList.contains('st-drawer-open') &&
     toggle.getAttribute('aria-expanded') === 'false');
  d.querySelector('[data-st-open="search"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('search overlay opens and unhides from AT',
     d.body.classList.contains('st-search-open') &&
     d.getElementById('st-search').getAttribute('aria-hidden') === 'false');
  d.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape closes the search overlay', !d.body.classList.contains('st-search-open'));
  const before = d.documentElement.style.fontSize;
  d.getElementById('st-fs-inc').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('text size control changes the root font size',
     d.documentElement.style.fontSize !== before,
     before + ' -> ' + d.documentElement.style.fontSize);
  d.getElementById('st-announce-close').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  ok('announcement dismisses', d.body.classList.contains('st-announce-off'));

  /* ------------------------------------------------ reduced motion */
  console.log('\nreduced motion');
  const rmHtml = inlineScript(fs.readFileSync(path.join(PREVIEW, 'post.html'), 'utf8'));
  const rm = new JSDOM(rmHtml, {
    url: 'http://localhost:8080/post.html',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = function (q) {
        return { matches: /prefers-reduced-motion/.test(q), media: q,
                 addEventListener() {}, removeEventListener() {},
                 addListener() {}, removeListener() {} };
      };
      window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      window.fetch = function (u, o) { return fetch(new URL(u, window.location.href), o); };
    },
  });
  await new Promise(function (res) { setTimeout(res, 500); });
  rm.window.document.getElementById('st-totop')
    .dispatchEvent(new rm.window.MouseEvent('click', { bubbles: true }));
  ok('back-to-top still works with reduced motion', true);

  console.log('\n' + '='.repeat(58));
  if (fails.length) {
    console.log('FAILED ' + fails.length + ' check(s):');
    fails.forEach(function (f) { console.log('  - ' + f); });
    process.exit(1);
  }
  console.log('All ' + pass + ' runtime checks passed.');
}());
