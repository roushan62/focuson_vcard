# FocusOn Interiors — Digital Business Card (vCard)

Single-page digital business card for **Roushan Gupta** (Project Coordinator, FocusOn Interiors Private Limited).

## Details
- 📞 +91 84483 45714 · +91 62047 82131
- ✉️ roushan@focusoninterior.in · decorators@focusoninterior.in
- 🌐 www.focusoninteriors.com
- 🏢 Head Office: 5th Floor, WeWork Two Horizon Centre, Sector 43, Gurugram, Haryana – 122002
- 🏬 Operational Office: C-19 Second Floor, above SBI Bank, Dilshad Colony, New Delhi – 110095

## Features
- Fully responsive — auto-adjusts on every device (mobile / tablet / desktop)
- Flip ID card (front: profile · back: QR + contact)
- One-tap Save Contact (vCard download), Call, WhatsApp, Email, Website
- Google Maps links for both offices, project gallery, share & QR modals
- Sticky mobile action bar with safe-area (notch) support

## Run locally
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

---

# Blogger themes

This repo also holds two complete, upload-ready Blogger themes.

| File | Description | Docs |
|---|---|---|
| `saarthi-blogger-theme.xml` | **Saarthi** — original light editorial theme: responsive, SEO + JSON-LD, accessible, AdSense-ready, no jQuery, no dark mode | [SAARTHI-THEME-GUIDE.md](SAARTHI-THEME-GUIDE.md) |
| `sidh-style-blogger-theme.xml` | Earlier GIGW-style portal theme (tricolour strip, dark mode, text-size/contrast controls) | [BLOGGER-THEME-GUIDE.md](BLOGGER-THEME-GUIDE.md) |

Upload either file via Blogger → **Theme → ⋮ → Restore → Upload**.

Saarthi is built from source and verified headlessly:

```bash
bash saarthi-src/check.sh
```

That rebuilds `saarthi-blogger-theme.xml`, validates its Blogger structure
(unique section/widget ids, real gadget types, every `b:include` resolving),
audits the CSS for overflow risk and WCAG AA contrast, and executes the real
`theme.js` against a preview generated from the same skeleton (56 runtime
checks).

## Deploy (GitHub Pages)
Push the repo, then: Repository Settings → Pages → Branch: `main`, folder `/ (root)`.
