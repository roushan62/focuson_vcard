/* Layout verification with a real browser engine.
 * Checks every viewport the brief calls out for horizontal overflow,
 * touch-target size, sidebar placement and drawer state, and writes
 * screenshots for visual review.
 *   node saarthi-src/layout.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'saarthi-preview', '_shots');
const BASE = 'http://localhost:8080/';

const MOBILE = [320, 360, 375, 390, 414, 430];
const TABLET = [600, 768, 820, 912];
const DESKTOP = [1024, 1280, 1366, 1440, 1600, 1920];
const ALL = MOBILE.concat(TABLET, DESKTOP);

let pass = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  \u2717 ' + name + (detail ? ' — ' + detail : '')); }
}

(async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const pages = ['index.html', 'post.html', 'page.html', 'label.html',
                 'search-empty.html', 'label-empty.html', '404.html'];

  console.log('\nHorizontal overflow check (%d pages x %d viewports)', pages.length, ALL.length);
  const overflow = [];
  for (const page of pages) {
    for (const width of ALL) {
      const b = await browser.newPage();
      await b.setViewport({ width: width, height: 900, deviceScaleFactor: 1 });
      await b.goto(BASE + page, { waitUntil: 'networkidle2', timeout: 30000 });
      const res = await b.evaluate(function () {
        const vw = document.documentElement.clientWidth;
        const doc = document.documentElement.scrollWidth;
        const bad = [];
        document.querySelectorAll('body *').forEach(function (el) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) { return; }
          if (r.right > vw + 1.5 || r.left < -1.5) {
            const st = getComputedStyle(el);
            if (st.position === 'fixed') { return; }
            bad.push((el.tagName.toLowerCase()) +
                     (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') +
                     ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
          }
        });
        return { vw: vw, doc: doc, bad: bad.slice(0, 4) };
      });
      if (res.doc > res.vw + 1 || res.bad.length) {
        overflow.push(page + ' @' + width + 'px  scrollWidth=' + res.doc + ' vw=' + res.vw +
                      (res.bad.length ? '  offenders: ' + res.bad.join(', ') : ''));
      }
      await b.close();
    }
  }
  ok('no horizontal overflow at any tested viewport', overflow.length === 0,
     '\n      ' + overflow.join('\n      '));

  /* ------------------------------------------------ responsive behaviour */
  console.log('\nResponsive behaviour');
  async function at(page, width, fn) {
    const b = await browser.newPage();
    await b.setViewport({ width: width, height: 900 });
    await b.goto(BASE + page, { waitUntil: 'networkidle2' });
    const out = await b.evaluate(fn);
    await b.close();
    return out;
  }

  const m = await at('index.html', 375, function () {
    const drawer = document.getElementById('st-drawer');
    const sidebar = document.querySelector('.st-sidebar');
    const content = document.querySelector('.st-content');
    const grid = document.querySelector('.st-grid');
    const toggle = document.getElementById('st-navtoggle');
    const btns = [].slice.call(document.querySelectorAll('button, .st-btn, .st-share__btn, .st-iconbtn'));
    const small = btns.filter(function (el) {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 30 || r.width < 28);
    }).map(function (el) { return el.id || el.className; });
    return {
      drawerHidden: getComputedStyle(drawer).visibility === 'hidden',
      drawerOffscreen: drawer.getBoundingClientRect().right <= 1,
      toggleVisible: getComputedStyle(toggle).display !== 'none',
      sidebarBelow: sidebar.getBoundingClientRect().top > content.getBoundingClientRect().bottom - 2,
      oneColumn: getComputedStyle(grid).gridTemplateColumns.split(' ').length === 1,
      smallTargets: small,
      headerVisible: document.querySelector('.st-header').getBoundingClientRect().height > 40,
    };
  });
  ok('mobile: drawer closed, off-canvas and hidden from AT', m.drawerHidden && m.drawerOffscreen);
  ok('mobile: hamburger visible', m.toggleVisible);
  ok('mobile: sidebar stacked below the content', m.sidebarBelow);
  ok('mobile: content grid is a single column', m.oneColumn);
  ok('mobile: no undersized touch targets', m.smallTargets.length === 0, m.smallTargets.join(', '));
  ok('mobile: header still usable', m.headerVisible);

  const mo = await at('index.html', 375, function () {
    document.getElementById('st-navtoggle').click();
    const d = document.getElementById('st-drawer');
    const r = d.getBoundingClientRect();
    return { visible: getComputedStyle(d).visibility === 'visible',
             onscreen: r.left >= 0 && r.width > 200 && r.width < 400 };
  });
  ok('mobile: drawer opens on-screen after tapping the hamburger', mo.visible && mo.onscreen);

  const dsk = await at('index.html', 1440, function () {
    const drawer = document.getElementById('st-drawer');
    const sidebar = document.querySelector('.st-sidebar');
    const content = document.querySelector('.st-content');
    const nav = document.querySelector('.st-nav');
    const navLink = document.querySelector('#navigation ul a');
    return {
      drawerInline: getComputedStyle(drawer).position !== 'fixed',
      toggleHidden: getComputedStyle(document.getElementById('st-navtoggle')).display === 'none',
      sidebarBeside: sidebar.getBoundingClientRect().left > content.getBoundingClientRect().right - 2,
      navSticky: getComputedStyle(nav).position === 'sticky',
      navText: getComputedStyle(navLink).color,
      desktopSearchVisible: getComputedStyle(document.querySelector('.st-searchform')).display !== 'none',
    };
  });
  ok('desktop: nav is inline, not an off-canvas panel', dsk.drawerInline);
  ok('desktop: hamburger hidden', dsk.toggleHidden);
  ok('desktop: sidebar sits beside the content', dsk.sidebarBeside);
  ok('desktop: nav strip is sticky', dsk.navSticky);
  ok('desktop: inline search field shown', dsk.desktopSearchVisible);

  const tab = await at('index.html', 768, function () {
    const hero = document.querySelector('.st-hero');
    const feed = document.querySelector('.st-feed');
    return { heroCols: getComputedStyle(hero).gridTemplateColumns.split(' ').length,
             feedCols: getComputedStyle(feed).gridTemplateColumns.split(' ').length };
  });
  ok('tablet: hero collapses to one column below 960px', tab.heroCols === 1, 'got ' + tab.heroCols);
  ok('tablet: feed uses a multi-column grid', tab.feedCols >= 2, 'got ' + tab.feedCols);

  /* ------------------------------------------------ visual sanity */
  console.log('\nVisual sanity');
  const vis = await at('post.html', 1280, function () {
    const body = document.querySelector('.post-body');
    const h2 = document.querySelector('.post-body h2');
    return {
      measure: Math.round(body.getBoundingClientRect().width),
      lineHeight: getComputedStyle(body).lineHeight,
      fontSize: getComputedStyle(body).fontSize,
      h2Border: getComputedStyle(h2).borderLeftWidth,
      bg: getComputedStyle(document.body).backgroundColor,
      color: getComputedStyle(document.body).color,
      progressExists: !!document.querySelector('.st-progress__bar'),
      tocOpen: !!document.querySelector('.st-toc[open]'),
    };
  });
  ok('article measure is a comfortable reading width', vis.measure >= 520 && vis.measure <= 900,
     vis.measure + 'px');
  ok('article line-height is generous for long-form', parseFloat(vis.lineHeight) / parseFloat(vis.fontSize) >= 1.6,
     vis.lineHeight + ' / ' + vis.fontSize);
  ok('theme is light', vis.bg === 'rgb(244, 246, 244)' || vis.bg.startsWith('rgb(2'), vis.bg);
  ok('reading progress bar present', vis.progressExists);
  ok('TOC open by default on desktop', vis.tocOpen);

  /* ------------------------------------------------ screenshots */
  fs.mkdirSync(SHOTS, { recursive: true });
  const shots = [
    ['index.html', 1440, 2400, 'home-desktop.png'],
    ['index.html', 390, 2600, 'home-mobile.png'],
    ['post.html', 1440, 2600, 'post-desktop.png'],
    ['post.html', 390, 2400, 'post-mobile.png'],
    ['404.html', 1280, 1200, '404.png'],
    ['label.html', 1280, 1800, 'label.png'],
    ['search-empty.html', 1280, 1200, 'empty.png'],
  ];
  for (const [page, w, h, name] of shots) {
    const b = await browser.newPage();
    await b.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await b.goto(BASE + page, { waitUntil: 'networkidle2' });
    await new Promise(function (r) { setTimeout(r, 500); });
    await b.screenshot({ path: path.join(SHOTS, name), fullPage: false });
    await b.close();
  }
  /* open mobile drawer for a screenshot too */
  const mb = await browser.newPage();
  await mb.setViewport({ width: 390, height: 844 });
  await mb.goto(BASE + 'index.html', { waitUntil: 'networkidle2' });
  await mb.click('#st-navtoggle');
  await new Promise(function (r) { setTimeout(r, 500); });
  await mb.screenshot({ path: path.join(SHOTS, 'home-mobile-menu.png') });
  await mb.close();
  console.log('  screenshots written to saarthi-preview/_shots/');

  await browser.close();

  console.log('\n' + '='.repeat(58));
  if (fails.length) {
    console.log('FAILED ' + fails.length + ' layout check(s):');
    fails.forEach(function (f) { console.log('  - ' + f); });
    process.exit(1);
  }
  console.log('All ' + pass + ' layout checks passed.');
}());
