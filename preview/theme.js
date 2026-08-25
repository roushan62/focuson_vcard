/* ============================================================
   SIDH-Style Blogger Theme - UI Controls & Enhancements
   Vanilla JS, defensive, no external dependencies required.
   ============================================================ */
(function () {
  'use strict';

  var d = document, root = d.documentElement, body = d.body;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function bind(id, fn) { var el = d.getElementById(id); if (el) { el.addEventListener('click', fn); } }

  /* ---------- 1. Text size controls (A- / A / A+) ---------- */
  try {
    var SIZES = [87.5, 93.75, 100, 106.25, 112.5, 118.75, 125];
    var fsIdx = 2;
    var savedFs = lsGet('sidh-fs');
    if (savedFs) {
      var fi = SIZES.indexOf(parseFloat(savedFs));
      if (fi > -1) { fsIdx = fi; }
    }
    var applyFs = function () {
      root.style.fontSize = SIZES[fsIdx] + '%';
      lsSet('sidh-fs', String(SIZES[fsIdx]));
    };
    applyFs();
    bind('fs-dec', function () { if (fsIdx > 0) { fsIdx--; applyFs(); } });
    bind('fs-inc', function () { if (fsIdx < SIZES.length - 1) { fsIdx++; applyFs(); } });
    bind('fs-reset', function () { fsIdx = 2; applyFs(); });
  } catch (e) {}

  /* ---------- 2. High contrast + Dark mode toggles ---------- */
  try {
    var bindToggle = function (id, cls, key) {
      var el = d.getElementById(id);
      if (!el) { return; }
      var sync = function () {
        el.setAttribute('aria-pressed', root.classList.contains(cls) ? 'true' : 'false');
      };
      sync();
      el.addEventListener('click', function () {
        root.classList.toggle(cls);
        lsSet(key, root.classList.contains(cls) ? '1' : '0');
        sync();
      });
    };
    bindToggle('t-contrast', 'hc', 'sidh-hc');
    bindToggle('t-dark', 'dark', 'sidh-dark');
  } catch (e) {}

  /* ---------- 3. Mobile nav toggle + active link ---------- */
  try {
    var tog = d.getElementById('nav-toggle'), navList = d.getElementById('LinkList1');
    if (tog && navList) {
      tog.addEventListener('click', function () {
        var open = navList.classList.toggle('open');
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      var here = location.pathname.replace(/\/+$/, '') || '/';
      var navLinks = navList.querySelectorAll('a');
      for (var nl = 0; nl < navLinks.length; nl++) {
        try {
          var u = new URL(navLinks[nl].getAttribute('href') || '', location.href);
          if (u.host === location.host && (u.pathname.replace(/\/+$/, '') || '/') === here) {
            navLinks[nl].classList.add('active');
            navLinks[nl].setAttribute('aria-current', 'page');
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  /* ---------- 4. Back to top + reading progress ---------- */
  try {
    var topBtn = d.getElementById('to-top');
    var bar = d.getElementById('read-progress');
    var onScroll = function () {
      var y = window.pageYOffset || root.scrollTop || 0;
      if (topBtn) {
        if (y > 400) { topBtn.classList.add('show'); } else { topBtn.classList.remove('show'); }
      }
      if (bar) {
        var h = body.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
        bar.style.width = p + '%';
      }
    };
    if (window.addEventListener) { window.addEventListener('scroll', onScroll, { passive: true }); }
    onScroll();
    bind('to-top', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  } catch (e) {}

  /* ---------- 5. Reading time (post pages) ---------- */
  try {
    if (body.classList.contains('item')) {
      var pb = d.querySelector('.post-body');
      if (pb && !d.querySelector('.reading-time')) {
        var words = (pb.textContent || '').trim().split(/\s+/).length;
        var mins = Math.max(1, Math.round(words / 180));
        var rt = d.createElement('p');
        rt.className = 'reading-time';
        rt.textContent = '\u0916\u094B\u091C \u0938\u0947 \u092A\u0939\u0932\u0947 \u092A\u0922\u093C\u0947\u0902 \u2014 Approx. reading time: ' + mins + ' min';
        pb.parentNode.insertBefore(rt, pb);
      }
    }
  } catch (e) {}

  /* ---------- 6. Auto Table of Contents (post pages) ---------- */
  try {
    if (body.classList.contains('item')) {
      var pb2 = d.querySelector('.post-body');
      if (pb2) {
        var heads = pb2.querySelectorAll('h2, h3, h4');
        if (heads.length >= 3) {
          var det = d.createElement('details');
          det.className = 'post-toc';
          var sum = d.createElement('summary');
          sum.textContent = '\u0935\u093F\u0937\u092F-\u0938\u0942\u091A\u0940 / Table of Contents';
          det.appendChild(sum);
          var ol = d.createElement('ol');
          for (var h = 0; h < heads.length; h++) {
            if (!heads[h].id) { heads[h].id = 'sec-' + (h + 1); }
            var a = d.createElement('a');
            a.href = '#' + heads[h].id;
            a.textContent = heads[h].textContent;
            var li = d.createElement('li');
            li.appendChild(a);
            ol.appendChild(li);
          }
          det.appendChild(ol);
          pb2.insertBefore(det, heads[0]);
        }
      }
    }
  } catch (e) {}

  /* ---------- 7. Copy button on code blocks ---------- */
  try {
    var pres = d.querySelectorAll('.post-body pre');
    for (var p = 0; p < pres.length; p++) {
      (function (pre) {
        if (pre.querySelector('.copy-btn')) { return; }
        var btn = d.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.textContent = '\u0915\u0949\u092A\u0940 / Copy';
        btn.addEventListener('click', function () {
          var txt = pre.innerText || pre.textContent || '';
          var ok = function () {
            btn.textContent = '\u2713 Copied';
            setTimeout(function () { btn.textContent = '\u0915\u0949\u092A\u0940 / Copy'; }, 2000);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(ok, function () {});
          } else {
            var ta = d.createElement('textarea');
            ta.value = txt;
            d.body.appendChild(ta);
            ta.select();
            try { d.execCommand('copy'); ok(); } catch (e) {}
            d.body.removeChild(ta);
          }
        });
        pre.appendChild(btn);
      })(pres[p]);
    }
  } catch (e) {}

  /* ---------- 8. Images: lazy load + HD thumbnails (s72-c fix) ---------- */
  try {
    var imgs = d.querySelectorAll('.post-body img, .blog-posts img, .widget img, .PopularPosts img');
    for (var im = 0; im < imgs.length; im++) {
      (function (g) {
        g.setAttribute('loading', 'lazy');
        g.setAttribute('decoding', 'async');
        var src = g.getAttribute('src') || '';
        if (src.indexOf('s72-c') > -1) {
          g.setAttribute('src', src.replace('s72-c', 'w480-h270-c'));
        }
        g.addEventListener('error', function () { g.style.visibility = 'hidden'; }, { once: true });
      })(imgs[im]);
    }
  } catch (e) {}

  /* ---------- 9. External links: new tab + safe rel ---------- */
  try {
    var exts = d.querySelectorAll('.post-body a[href^="http"]');
    for (var ex = 0; ex < exts.length; ex++) {
      try {
        if (exts[ex].host !== location.host) {
          exts[ex].setAttribute('target', '_blank');
          exts[ex].setAttribute('rel', 'noopener nofollow');
          exts[ex].classList.add('ext-link');
        }
      } catch (e) {}
    }
  } catch (e) {}

  /* ---------- 10. Wrap wide tables for horizontal scroll ---------- */
  try {
    var tables = d.querySelectorAll('.post-body table');
    for (var t = 0; t < tables.length; t++) {
      var tn = tables[t].parentNode;
      if (!tn || tn.className !== 'table-scroll') {
        var wrap = d.createElement('div');
        wrap.className = 'table-scroll';
        tn.insertBefore(wrap, tables[t]);
        wrap.appendChild(tables[t]);
      }
    }
  } catch (e) {}

  /* ---------- 11. Footer year ---------- */
  try {
    var y = d.getElementById('fyear');
    if (y) { y.textContent = String(new Date().getFullYear()); }
  } catch (e) {}

  /* ---------- 12. Google Translate (multilingual UI) ---------- */
  try {
    window.googleTranslateElementInit = function () {
      try {
        if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) { return; }
        var pg = (d.documentElement.getAttribute('lang') || 'en').split('-')[0];
        new window.google.translate.TranslateElement({
          pageLanguage: pg,
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          includedLanguages: 'en,hi,as,bn,gu,kn,kok,mai,mr,ne,or,pa,sa,sd,ta,te,ur'
        }, 'google_translate_element');
      } catch (e) {}
    };
    if (!d.getElementById('google_translate_element')) {
      /* element missing - skip silently */
    } else {
      var gt = d.createElement('script');
      gt.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      gt.async = true;
      gt.onerror = function () {};
      (d.head || body).appendChild(gt);
    }
  } catch (e) {}

})();
