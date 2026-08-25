# Saarthi — Blogger theme

**File to upload:** `saarthi-blogger-theme.xml` (single, self-contained, no build step needed)

A light, editorial Blogger theme for a serious publishing or education site.
Original design, no framework, no jQuery, no dark mode, AdSense-ready.

---

## 1. Upload

1. Blogger → **Theme**
2. Arrow next to **Customize** → **Restore** → **Upload** → pick `saarthi-blogger-theme.xml`
3. **Theme → ⋮ → Mobile settings → Desktop** (so this responsive layout is used on phones)

## 2. Five settings worth doing first

| Where | What | Why |
|---|---|---|
| Settings → Meta tags → Description | Switch **ON**, write a description | Blogger emits `<meta name="description">` and the canonical link from this; the theme deliberately does not print them twice |
| Settings → Comments → Location | **Embedded** | The comment list and the "Write a comment" button expect it |
| Settings → Other → Site feed | **Full** or **Until jump break** | The optional Featured and Related rails read Blogger's own feed |
| Pages | Create `about`, `contact`, `privacy-policy`, `disclaimer`, `terms` with those exact slugs | The default menu and footer links point at them |
| Posts | Use **Jump break** on long posts | Also shortens the excerpt shown on homepage cards |

## 3. Customisation

### Colours, width, radius — no code

**Theme → Customize → Advanced** exposes seven working controls:
primary colour, accent colour, page background, body text, link colour,
container width, corner radius.

They are `<Variable>` tags at the top of the `<b:skin>` block. Every derived
tone (darker primary, tints, footer) is produced with `color-mix()` from those
values, so changing the primary recolours the whole theme.

### Everything else — Blogger → Layout

| Gadget | Purpose |
|---|---|
| Utility Links | thin bar, top right |
| Header | site title / description / logo |
| Main Menu | primary navigation |
| Announcement | optional dismissible strip (delete the gadget to remove the bar) |
| Hero | the welcome panel on the homepage |
| Most read | native Popular Posts, restyled as a ranked list |
| Sidebar / About this site | sidebar gadgets |
| Newsletter | paste your email provider's form here |
| Footer about / links / contact | footer columns |
| `ad-header`, `ad-mid`, `ad-article`, `ad-article-end`, `ad-sidebar`, `ad-footer` | six ad slots; add an AdSense or HTML gadget |

**Dropdown menu items:** in *Main Menu*, prefix a link's **text** with `- `
(dash + space) and it nests under the link above it. Works with mouse,
keyboard and tap.

**Social links:** edit the `href="#"` values in the footer block of the XML.
Icons are inline SVG — nothing is loaded from a third party.

### Behaviour — `CFG` at the top of the script

`featuredLabel`, `featuredCount`, `relatedCount`, `readingWpm`, and
`enableFeatured` / `enableRelated` / `enableProgress` / `enableToc` switches.

### Body classes

Add to `<body>` in the template: `st-no-sidebar` (hide the sidebar),
`st-no-ads` (hide every ad slot), `st-sticky-sidebar` (pin the sidebar),
`st-no-progress` (hide the reading bar).

---

## 4. Documented limitations

These are Blogger platform limits, not gaps in the theme. Each is also
commented at the relevant place inside the XML.

- **Related posts and the Featured rail** have no server-side data source in
  Blogger, so they are filled from the blog's own Atom feed (same origin, no
  third party). If site feeds are switched off, both sections stay hidden.
- **Newsletter:** Blogger's Follow-by-Email gadget depended on FeedBurner,
  which Google retired. The theme ships a working RSS subscribe button plus an
  empty, pre-styled slot for your own provider form.
- **Single `<h1>` per page:** the Header gadget always renders the site name in
  an `<h1>`, and overriding it would remove image-logo support. The homepage
  therefore has one `<h1>`; article, static and 404 pages have two (site name +
  page title). Search engines handle this correctly.
- **Post thumbnails:** classic templates have no reliable thumbnail data tag,
  so the first image of each post is lifted into the card/hero slot at runtime.
  The media box has a reserved aspect ratio, so this causes no layout shift.
- **In-article ads:** a `b:section` cannot sit inside a `b:widget`, so the
  in-article slot renders directly above the article body. For a mid-article
  slot, paste AdSense code into the post itself — `.post-body ins` is styled.
- **JSON-LD:** a post title containing a literal double quote would break the
  JSON-LD string. Avoid `"` in titles, or escape it manually.

## 5. Accessibility

Skip link, visible `:focus-visible` rings, keyboard-operable menu / dropdowns /
search overlay with focus return and `Esc`, ARIA on every control, text-size
control, `prefers-reduced-motion` support (animations off, progress bar hidden),
semantic landmarks, and WCAG AA contrast on every palette pairing
(verified by `saarthi-src/audit.py`).

## 6. Development

```bash
bash saarthi-src/check.sh          # build + all headless checks
python3 saarthi-src/build.py       # rebuild XML + preview only
NODE_PATH=<dir with puppeteer> node saarthi-src/layout.js   # real-browser pass
```

| Path | What |
|---|---|
| `saarthi-blogger-theme.xml` | **the deliverable** — upload this |
| `saarthi-src/skeleton.xml` | template markup, widgets, includables |
| `saarthi-src/theme.css` | design system |
| `saarthi-src/theme.js` | behaviour |
| `saarthi-src/build.py` | inlines CSS/JS, validates Blogger structure |
| `saarthi-src/preview.py` | renders the real skeleton to static HTML |
| `saarthi-src/verify.js` | executes the real `theme.js` under jsdom (56 checks) |
| `saarthi-src/audit.py` | layout-risk, XML hygiene, contrast audit |
| `saarthi-src/layout.js` | real-browser overflow/responsive checks |
| `saarthi-preview/` | generated preview, safe to delete |

The preview is **generated from the same skeleton** — it is not a separate
mock-up, so it cannot drift from the shipped theme.
