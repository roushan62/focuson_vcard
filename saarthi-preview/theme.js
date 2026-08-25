/* ==================================================================
   SAARTHI — theme behaviour
   Vanilla JS. No jQuery, no libraries, no globals, no tracking.
   Every feature degrades: with JS disabled the site still reads,
   navigates and searches (all search forms are real Blogger forms).
   ================================================================== */
(function (window, document) {
  'use strict';

  /* >>> CUSTOMIZATION AREA (3 of 3) — THEME BEHAVIOUR <<<
     Change these values, or toggle features, then re-upload. */
  var CFG = {
    /* Label used by the optional homepage "Featured" section.
       Posts without this label simply do not appear there. */
    featuredLabel: 'Featured',
    featuredCount: 4,
    /* Related posts are pulled from the first label of the article
       through Blogger's own feed (same origin, no third party). */
    relatedCount: 5,
    /* Turn a whole feature off without touching any other code. */
    enableFeatured: true,
    enableRelated: true,
    enableProgress: true,
    enableToc: true,
    minTocHeadings: 3,
    readingWpm: 180
  };

  var root = document.documentElement;
  var body = document.body;
  var pageType = body.getAttribute('data-pagetype') || '';
  var isItem = pageType === 'item';
  var reduced = false;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (mqReduce) { reduced = mqReduce.matches; }
  var mqDesktop = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    var out = [];
    var list = (ctx || document).querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) { out.push(list[i]); }
    return out;
  }
  function on(el, ev, fn, opts) { if (el) { el.addEventListener(ev, fn, opts || false); } }
  function storageGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  /* ---------------------------------------------------------------
     1. Accessibility: text size
     --------------------------------------------------------------- */
  (function textControls() {
    var steps = [90, 100, 112, 125];
    var idx = 1;
    var saved = parseFloat(storageGet('st-fs'));
    if (steps.indexOf(saved) > -1) { idx = steps.indexOf(saved); }
    function apply() {
      root.style.fontSize = steps[idx] + '%';
      storageSet('st-fs', String(steps[idx]));
      var dec = $('#st-fs-dec'), inc = $('#st-fs-inc');
      if (dec) { dec.disabled = idx === 0; }
      if (inc) { inc.disabled = idx === steps.length - 1; }
    }
    on($('#st-fs-dec'), 'click', function () { if (idx > 0) { idx--; apply(); } });
    on($('#st-fs-inc'), 'click', function () { if (idx < steps.length - 1) { idx++; apply(); } });
    on($('#st-fs-reset'), 'click', function () { idx = 1; apply(); });
    apply();
  }());

  /* ---------------------------------------------------------------
     2. Mobile navigation drawer
     --------------------------------------------------------------- */
  (function drawer() {
    var toggle = $('#st-navtoggle');
    var panel = $('#st-drawer');
    var scrim = $('#st-scrim');
    var close = $('#st-drawer-close');
    if (!toggle || !panel) { return; }
    var lastFocus = null;

    function focusables() {
      return $$('a[href], button:not([disabled])', panel).filter(function (el) {
        return el.offsetParent !== null;
      });
    }
    function open() {
      lastFocus = document.activeElement;
      body.classList.add('st-locked', 'st-drawer-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      panel.setAttribute('aria-hidden', 'false');
      var f = focusables();
      if (f.length) { f[0].focus(); }
    }
    function closeDrawer() {
      body.classList.remove('st-locked', 'st-drawer-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      if (mqDesktop && mqDesktop.matches) { panel.removeAttribute('aria-hidden'); }
      else { panel.setAttribute('aria-hidden', 'true'); }
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
    on(toggle, 'click', function () {
      if (body.classList.contains('st-drawer-open')) { closeDrawer(); } else { open(); }
    });
    on(close, 'click', closeDrawer);
    on(scrim, 'click', closeDrawer);
    on(document, 'keydown', function (e) {
      if (!body.classList.contains('st-drawer-open')) { return; }
      if (e.key === 'Escape' || e.key === 'Esc') { closeDrawer(); return; }
      if (e.key !== 'Tab') { return; }
      var f = focusables();
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    /* Close the drawer if the viewport grows past the mobile breakpoint */
    if (mqDesktop && mqDesktop.addEventListener) {
      mqDesktop.addEventListener('change', function (e) {
        if (e.matches && body.classList.contains('st-drawer-open')) { closeDrawer(); }
      });
    }
  }());

  /* ---------------------------------------------------------------
     3. Primary menu: submenus, active state
        Submenu convention: in Layout -> Main Menu, prefix a link's
        TEXT with "- " to nest it under the previous top-level link.
     --------------------------------------------------------------- */
  (function menu() {
    var nav = $('#navigation ul');
    if (!nav) { return; }
    var items = $$(':scope > li', nav);
    var i, li, a, text;

    /* Build submenus from the "- " text convention */
    var pending = null;
    for (i = 0; i < items.length; i++) {
      li = items[i];
      a = $('a', li);
      if (!a) { continue; }
      text = (a.textContent || '').replace(/^\s+/, '');
      if (text.indexOf('- ') === 0 || text.indexOf('\u2013 ') === 0) {
        if (pending) {
          a.textContent = text.replace(/^[-\u2013]\s+/, '');
          var sub = $('ul', pending) || document.createElement('ul');
          if (!sub.parentNode) { pending.appendChild(sub); }
          var wrap = document.createElement('li');
          wrap.appendChild(a.parentNode.removeChild(a));
          sub.appendChild(wrap);
          li.parentNode.removeChild(li);
        }
      } else {
        pending = li;
      }
    }

    /* Caret + a11y wiring for every parent that now has children */
    var parents = $$('#navigation ul > li').filter(function (el) { return !!$('ul', el); });
    parents.forEach(function (p) {
      p.classList.add('has-sub');
      var link = $(':scope > a', p);
      if (!link) { return; }
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      var caret = document.createElement('span');
      caret.className = 'st-caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
      link.appendChild(caret);

      function setOpen(state) {
        p.classList.toggle('is-open', state);
        link.setAttribute('aria-expanded', state ? 'true' : 'false');
      }
      on(link, 'click', function (e) {
        /* On touch/mobile the parent only expands; on wide screens the
           parent link still works as a real destination. */
        var narrow = !(mqDesktop && mqDesktop.matches);
        if (narrow) { e.preventDefault(); setOpen(!p.classList.contains('is-open')); }
      });
      on(p, 'mouseenter', function () { if (mqDesktop && mqDesktop.matches) { setOpen(true); } });
      on(p, 'mouseleave', function () { if (mqDesktop && mqDesktop.matches) { setOpen(false); } });
      on(link, 'focus', function () { setOpen(true); });
      on(p, 'focusout', function (e) {
        if (!p.contains(e.relatedTarget)) { setOpen(false); }
      });
    });

    on(document, 'keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') { return; }
      parents.forEach(function (p) {
        p.classList.remove('is-open');
        var l = $(':scope > a', p);
        if (l) { l.setAttribute('aria-expanded', 'false'); }
      });
    });

    /* Mark the current section */
    var here = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    $$('#navigation a[href]').forEach(function (link) {
      try {
        var u = new URL(link.getAttribute('href'), window.location.href);
        if (u.host !== window.location.host) { return; }
        var path = (u.pathname || '/').replace(/\/+$/, '') || '/';
        if (path === here && here !== '/') {
          link.setAttribute('aria-current', 'page');
          var owner = link.closest('#navigation ul > li');
          if (owner) { owner.classList.add('is-active'); }
        } else if (here === '/' && (path === '/' || path === '')) {
          link.setAttribute('aria-current', 'page');
        }
      } catch (err) { /* older browsers */ }
    });
  }());

  /* ---------------------------------------------------------------
     4. Search overlay
     --------------------------------------------------------------- */
  (function searchOverlay() {
    var layer = $('#st-search');
    if (!layer) { return; }
    var input = $('#st-search-input');
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      body.classList.add('st-search-open', 'st-locked');
      layer.setAttribute('aria-hidden', 'false');
      if (input) { window.setTimeout(function () { input.focus(); }, 60); }
    }
    function close() {
      body.classList.remove('st-search-open');
      layer.setAttribute('aria-hidden', 'true');
      if (!body.classList.contains('st-drawer-open')) { body.classList.remove('st-locked'); }
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
    $$('[data-st-open="search"]').forEach(function (btn) { on(btn, 'click', open); });
    on($('#st-search-close'), 'click', close);
    on(layer, 'click', function (e) { if (e.target === layer) { close(); } });
    on(document, 'keydown', function (e) {
      if (!body.classList.contains('st-search-open')) { return; }
      if (e.key === 'Escape' || e.key === 'Esc') { close(); }
    });
    /* "/" focuses the visible search field when not typing */
    on(document, 'keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) { return; }
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) { return; }
      e.preventDefault();
      var field = $('#st-header-search');
      if (field && field.offsetParent !== null) { field.focus(); } else { open(); }
    });
  }());

  /* ---------------------------------------------------------------
     5. Announcement bar (dismissible)
     --------------------------------------------------------------- */
  (function announcement() {
    var bar = $('#st-announce');
    if (!bar) { return; }
    /* No gadget in the strip -> collapse it entirely */
    if (!bar.querySelector('.widget') || storageGet('st-announce') === 'off') {
      body.classList.add('st-announce-off');
      return;
    }
    var btn = $('#st-announce-close');
    on(btn, 'click', function () {
      body.classList.add('st-announce-off');
      storageSet('st-announce', 'off');
    });
  }());

  /* ---------------------------------------------------------------
     6. Reading progress + back to top (one passive scroll handler,
        rAF-throttled, transform-only so no layout is recalculated)
     --------------------------------------------------------------- */
  (function scrollUi() {
    var bar = $('#st-progress-bar');
    var top = $('#st-totop');
    if (!CFG.enableProgress) { body.classList.add('st-no-progress'); bar = null; }
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop || 0;
      if (top) {
        if (y > 480) { top.classList.add('is-visible'); } else { top.classList.remove('is-visible'); }
      }
      if (bar && isItem) {
        var start = 0;
        var art = $('#st-article-body');
        if (art) { start = art.getBoundingClientRect().top + y; }
        var total = (document.documentElement.scrollHeight - start) - window.innerHeight;
        var done = y - start;
        var pct = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
        bar.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
      }
    }
    function request() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    on(window, 'scroll', request, { passive: true });
    on(window, 'resize', request, { passive: true });
    update();

    on(top, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var s = $('.st-skip');
      if (s) { s.focus(); }
    });
  }());

  /* ---------------------------------------------------------------
     7. Post cards: move the first image into the media slot
        (Blogger has no reliable post-thumbnail data tag in classic
        templates, so the image is lifted from the post body itself —
        it is already in the HTML, so nothing extra is downloaded.)
     --------------------------------------------------------------- */
  (function cardImages() {
    $$('.pcard').forEach(function (card) {
      var media = $('.pcard__media', card);
      var excerpt = $('.pcard__excerpt', card);
      if (!media || !excerpt) { return; }
      var img = excerpt.querySelector('img');
      if (img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.removeAttribute('style');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        if (img.alt === '') { img.removeAttribute('alt'); }
        if (!img.hasAttribute('alt')) {
          var t = $('.pcard__title', card);
          img.setAttribute('alt', t ? (t.textContent || '').trim() : '');
        }
        img.src = upgradeImage(img.getAttribute('src') || '');
        media.appendChild(img);
      } else {
        media.classList.add('is-empty');
      }
    });
  }());

  /* Blogger thumbnails arrive at 72px; ask the image service for a
     larger crop without changing the URL host. */
  function upgradeImage(src) {
    if (!src) { return src; }
    if (src.indexOf('/s72-c') > -1) { return src.replace('/s72-c', '/w640-h360-p-k-no-nu'); }
    if (src.indexOf('/s1600/') > -1) { return src.replace('/s1600/', '/w900/'); }
    return src;
  }

  /* ---------------------------------------------------------------
     8. Article enhancements (item pages)
     --------------------------------------------------------------- */
  (function article() {
    if (!isItem) { return; }
    var postBody = $('#st-article-body');
    if (!postBody) { return; }

    /* 8a. Reading time */
    var words = (postBody.textContent || '').trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / CFG.readingWpm));
    var slot = $('#st-readtime');
    if (slot) { slot.textContent = mins + ' min read'; }

    /* 8b. Featured image: lift the first image of the body into the
       figure above the text so the layout never depends on the author. */
    var figure = $('#st-article-media');
    var firstImg = postBody.querySelector('img');
    if (figure && firstImg) {
      firstImg.removeAttribute('style');
      firstImg.setAttribute('decoding', 'async');
      firstImg.setAttribute('fetchpriority', 'high');
      firstImg.src = upgradeImage(firstImg.getAttribute('src') || '');
      figure.insertBefore(firstImg, figure.firstChild);
      figure.hidden = false;
      var cap = firstImg.getAttribute('alt');
      var capEl = $('.st-article__caption', figure);
      if (cap && capEl) { capEl.textContent = cap; } else if (capEl) { capEl.remove(); }
    } else if (figure) {
      figure.remove();
    }

    /* 8c. Table of contents */
    if (CFG.enableToc) { buildToc(postBody); }

    /* 8d. Code blocks, tables, external links */
    $$('#st-article-body pre').forEach(function (pre) {
      if ($('.st-copybtn', pre)) { return; }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-copybtn';
      btn.textContent = 'Copy';
      on(btn, 'click', function () { copyText(pre.innerText || pre.textContent || '', btn); });
      pre.appendChild(btn);
    });
    $$('#st-article-body table').forEach(function (tbl) {
      if (tbl.parentNode && tbl.parentNode.className === 'st-tablewrap') { return; }
      var wrap = document.createElement('div');
      wrap.className = 'st-tablewrap';
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Scrollable table');
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });
    $$('#st-article-body a[href^="http"]').forEach(function (link) {
      try {
        if (new URL(link.href).host !== window.location.host) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener');
        }
      } catch (err) { /* ignore */ }
    });
    $$('#st-article-body img').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });

    /* 8e. Share links use the live URL, correctly encoded */
    var url = window.location.href;
    var title = (document.title || '').replace(/\s*\|.*$/, '');
    $$('[data-st-share]').forEach(function (a) {
      var net = a.getAttribute('data-st-share');
      var href = shareUrl(net, url, title);
      if (href) { a.setAttribute('href', href); }
    });
    var copyBtn = $('[data-st-share="copy"]');
    if (copyBtn) {
      on(copyBtn, 'click', function (e) { e.preventDefault(); copyText(url, copyBtn); });
    }

    /* 8f. Related posts from Blogger's own feed */
    if (CFG.enableRelated) { related(); }
  }());

  function shareUrl(net, url, title) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);
    switch (net) {
      case 'whatsapp': return 'https://api.whatsapp.com/send?text=' + t + '%20' + u;
      case 'facebook': return 'https://www.facebook.com/sharer/sharer.php?u=' + u;
      case 'x': return 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
      case 'telegram': return 'https://t.me/share/url?url=' + u + '&text=' + t;
      case 'linkedin': return 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;
      default: return null;
    }
  }

  function copyText(text, btn) {
    var done = function () {
      if (!btn) { return; }
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.textContent = 'Copied';
      window.setTimeout(function () { btn.textContent = btn.getAttribute('data-label') || old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* nothing to do */ }
    document.body.removeChild(ta);
  }

  /* ---------------------------------------------------------------
     9. Table of contents — collapsible, keyboard friendly, and it
        never touches the article when there is nothing to list.
     --------------------------------------------------------------- */
  function buildToc(postBody) {
    var heads = $$('#st-article-body h2, #st-article-body h3');
    if (heads.length < CFG.minTocHeadings) { return; }
    var host = $('#st-toc');
    if (!host) { return; }

    var details = document.createElement('details');
    details.className = 'st-toc';
    details.open = !!(mqDesktop && mqDesktop.matches);
    var summary = document.createElement('summary');
    summary.textContent = 'In this article';
    details.appendChild(summary);

    var usedIds = {};
    var rootList = document.createElement('ol');
    var stack = [{ level: 2, list: rootList }];

    heads.forEach(function (h, n) {
      var id = h.id;
      if (!id) {
        id = 'section-' + (n + 1);
        var guard = 1;
        while (usedIds[id] || document.getElementById(id)) { id = 'section-' + (n + 1) + '-' + (++guard); }
        h.id = id;
      }
      usedIds[id] = true;
      var level = h.tagName === 'H3' ? 3 : 2;
      while (stack.length > 1 && stack[stack.length - 1].level > level) { stack.pop(); }
      if (level > stack[stack.length - 1].level) {
        var nested = document.createElement('ol');
        var lastLi = stack[stack.length - 1].list.lastElementChild;
        if (lastLi) { lastLi.appendChild(nested); stack.push({ level: level, list: nested }); }
      }
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = (h.textContent || '').trim();
      a.setAttribute('data-toc-for', h.id);
      li.appendChild(a);
      stack[stack.length - 1].list.appendChild(li);
    });

    details.appendChild(rootList);
    host.appendChild(details);
    host.hidden = false;

    /* Highlight the section currently in view (IntersectionObserver
       only; no scroll polling). */
    if ('IntersectionObserver' in window) {
      var links = {};
      $$('.st-toc a[data-toc-for]').forEach(function (a) { links[a.getAttribute('data-toc-for')] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = links[entry.target.id];
          if (!link) { return; }
          if (entry.isIntersecting) {
            $$('.st-toc a.is-current').forEach(function (x) { x.classList.remove('is-current'); });
            link.classList.add('is-current');
          }
        });
      }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  /* ---------------------------------------------------------------
     10. Same-origin Blogger feed helper
         Used only for the optional "Featured" rail and related
         posts. If the blog's site feed is switched off the sections
         stay hidden — nothing is faked.
     --------------------------------------------------------------- */
  function readFeed(label, max) {
    if (!window.fetch) { return Promise.resolve([]); }
    var base = (body.getAttribute('data-home') || '/') + 'feeds/posts/default';
    var url = label
      ? base + '/-/' + encodeURIComponent(label) + '?alt=json&max-results=' + max
      : base + '?alt=json&max-results=' + max;
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { feed: null }; })
      .then(function (json) {
        var entries = (json && json.feed && json.feed.entry) ? json.feed.entry : [];
        return entries.map(function (e) {
          var href = '';
          (e.link || []).forEach(function (l) { if (l.rel === 'alternate') { href = l.href; } });
          var thumb = e.media$thumbnail ? e.media$thumbnail.url : '';
          var author = (e.author && e.author[0] && e.author[0].name) ? e.author[0].name.$t : '';
          return {
            title: e.title ? e.title.$t : '',
            url: href,
            thumb: thumb ? thumb.replace(/\/s72-c/, '/w320-h240-p-k-no-nu') : '',
            date: e.published ? e.published.$t : '',
            author: author
          };
        }).filter(function (p) { return p.url && p.title; });
      })
      .catch(function () { return []; });
  }

  function fmtDate(iso) {
    if (!iso) { return ''; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ''; }
    var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
    try {
      return d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hcard(post) {
    var img = post.thumb
      ? '<div class="hcard__media"><img alt="" loading="lazy" decoding="async" src="' + esc(post.thumb) + '"></div>'
      : '';
    var when = fmtDate(post.date);
    return '<article class="hcard">' + img +
      '<div class="hcard__body"><h3 class="hcard__title"><a href="' + esc(post.url) + '">' +
      esc(post.title) + '</a></h3>' +
      '<p class="st-meta">' + (when ? '<span>' + esc(when) + '</span>' : '') + '</p></div>' +
      '</article>';
  }

  /* Compact card — used by the optional homepage "Featured" rail */
  function xcard(post) {
    var img = post.thumb
      ? '<div class="xcard__media"><img alt="" loading="lazy" decoding="async" src="' + esc(post.thumb) + '"></div>'
      : '';
    var when = fmtDate(post.date);
    return '<article class="xcard">' + img +
      '<div class="xcard__body"><h3 class="xcard__title"><a href="' + esc(post.url) + '">' +
      esc(post.title) + '</a></h3>' +
      '<p class="st-meta">' + (post.author ? '<span>' + esc(post.author) + '</span>' : '') +
      (when ? '<span aria-hidden="true" class="st-meta__dot">\u00b7</span><span>' + esc(when) + '</span>' : '') +
      '</p></div></article>';
  }

  function related() {
    var host = $('#st-related');
    if (!host) { return; }
    var labelLink = $('.st-labels a[href*="/search/label/"]');
    if (!labelLink) { return; }
    var label = decodeURIComponent((labelLink.getAttribute('href').split('/search/label/')[1] || '').split('?')[0]);
    if (!label) { return; }
    readFeed(label, CFG.relatedCount + 2).then(function (posts) {
      var here = window.location.href.split('?')[0];
      var list = posts.filter(function (p) { return p.url.split('?')[0] !== here; }).slice(0, CFG.relatedCount);
      if (!list.length) { return; }
      var rail = document.createElement('div');
      rail.className = 'st-rail';
      rail.innerHTML = list.map(hcard).join('');
      host.appendChild(rail);
      host.hidden = false;
    });
  }

  /* ---------------------------------------------------------------
     11. Optional homepage "Featured" rail
     --------------------------------------------------------------- */
  (function featured() {
    var host = $('#st-featured');
    if (!host || !CFG.enableFeatured || !CFG.featuredLabel) { return; }
    readFeed(CFG.featuredLabel, CFG.featuredCount).then(function (posts) {
      if (!posts.length) { return; }
      var rail = document.createElement('div');
      rail.className = 'st-rail st-rail--compact';
      rail.innerHTML = posts.map(xcard).join('');
      host.appendChild(rail);
      host.hidden = false;
    });
  }());

  /* ---------------------------------------------------------------
     12. Empty states — if Blogger returned no posts for this
         label/search/archive, say so plainly.
     --------------------------------------------------------------- */
  (function emptyStates() {
    var feed = $('.st-feed');
    if (!feed || feed.querySelector('.pcard')) { return; }
    if ($('.status-msg-wrap')) { return; }
    feed.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'st-empty';
    box.style.gridColumn = '1 / -1';
    box.innerHTML = '<h2>Nothing published here yet</h2>' +
      '<p>This section is empty right now. Try another topic, or head back to the latest articles.</p>' +
      '<p><a class="st-btn st-btn--ghost st-btn--sm" href="' +
      esc(body.getAttribute('data-home') || '/') + '">Go to the homepage</a></p>';
    feed.appendChild(box);
  }());

  /* ---------------------------------------------------------------
     13. Small utilities
     --------------------------------------------------------------- */
  (function misc() {
    var year = $('#st-year');
    if (year) { year.textContent = String(new Date().getFullYear()); }

    var stamp = $('#st-today');
    if (stamp) {
      try {
        var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
        stamp.textContent = new Date().toLocaleDateString(lang, {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
      } catch (e) { /* leave the static text */ }
    }

    /* Lazy-load anything the author left eager, but never the LCP image */
    $$('.st-sidebar img, .st-footer img, #hero-aside img').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (img.getAttribute('src') && img.getAttribute('src').indexOf('/s72-c') > -1) {
        img.src = img.getAttribute('src').replace('/s72-c', '/w320-h240-p-k-no-nu');
      }
    });
  }());

}(window, document));
