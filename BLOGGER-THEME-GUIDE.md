# 🇮🇳 SIDH-Style Blogger Theme — पूरी गाइड (हिंदी)

**फ़ाइल:** `sidh-style-blogger-theme.xml` (~54 KB)

Skill India Digital Hub (SIDH) जैसे **GIGW-compliant, Citizen-Centric** सरकारी पोर्टल डिज़ाइन से प्रेरित, Blogger के लिए पूरी तरह तैयार, SEO-optimised और bug-free टेम्पलेट।

---

## 1️⃣ Blogger में अपलोड कैसे करें (2 मिनट)

1. Blogger.com → अपना ब्लॉग खोलें
2. बाएँ मेन्यू से **Theme (थीम)** पर क्लिक करें
3. **CUSTOMIZE** बटन के बगल वाले **▼ (तीर)** पर क्लिक करें → **Restore / Backup**
4. **Upload** पर क्लिक कर `sidh-style-blogger-theme.xml` चुनें
5. बस हो गया! 🎉 वेबसाइट खोलकर देखें

> ⚠️ **ज़रूरी:** Theme → **Mobile Settings (⚙ गियर)** → **Desktop** चुनें, ताकि मोबाइल पर भी यही responsive डिज़ाइन दिखे।

---

## 2️⃣ टेम्पलेट में क्या-क्या मिलेगा

### 🎨 डिज़ाइन (SIDH / UX4G स्टाइल)
- तिरंगा स्ट्रिप + गहरा नीला header + केसरिया (saffron) accent — 'Skill India' ब्रांड रंग
- White background, Card-Based UI, Grid Layout (सारी पोस्ट वर्गाकार कार्ड में)
- फुल Responsive — मोबाइल, टैबलेट, डेस्कटॉप पर अपने-आप फिट
- Hero सेक्शन + Quick Service Cards (जैसे सरकारी पोर्टल में होता है)

### ♿ Accessibility (GIGW टॉप बार)
| कंट्रोल | काम |
|---|---|
| **Skip to Main Content** | कीबोर्ड/स्क्रीन-रीडर यूज़र्स के लिए |
| **A− / A / A+** | फ़ॉन्ट साइज़ बदलें (याद रहता है — localStorage) |
| **◐ Contrast** | हाई-कंट्रास्ट (काला+पीला) मोड |
| **🌙 Dark** | डार्क मोड |
| **Screen Reader Access** | आपकी accessibility पेज का लिंक |
| **भाषा चुनें** | Google Translate से 16+ भारतीय भाषाएँ |

### 🚀 SEO (पूरी तरह optimised)
- Optimised `<title>` हर पेज टाइप के लिए
- Open Graph + Twitter Card (WhatsApp/Facebook पर शानदार preview)
- JSON-LD Schema: `WebSite` + `SearchAction` + `BlogPosting` + `BreadcrumbList`
- Search/Archive/404 पेज पर `noindex` (duplicate content से बचाव)
- Breadcrumbs, proper heading structure, semantic HTML5 (`nav`, `main`, `aside`, `footer`)
- `all-head-content` (canonical URL, feeds — Blogger का official system)

### ⚡ स्पीड
- Zero jQuery — सिर्फ ~5 KB vanilla JS
- Lazy-loaded इमेज, system fonts + Noto Sans (display=swap)
- Blogger की छोटी 72px थंबनेल अपने-आप HD (480px) में बदलती हैं
- कोई heavy slider/animation नहीं — तेज़ लोडिंग

### 🛠️ हर तरह के कंट्रोल (बिना कोड छुए)
- **Layout → मेन्यू** — LinkList गैजेट से मेन्यू items जोड़ें/हटाएँ
- **Layout → Hero** — ऊपर का बैनर HTML गैजेट में editable
- **Layout → Sidebar** — About, Popular Posts, Labels, Archive (+ कुछ भी जोड़ें)
- **Layout → Footer** — 3 कॉलम, सारे editable
- **Theme Designer → Advanced** — 4 कलर variables बदलें (Primary Blue, Saffron, Text, Background)
- **अपने-आप फीचर्स:** टेबल पर horizontal scroll, कोड ब्लॉक पर Copy बटन, पोस्ट पर TOC (विषय-सूची), Reading time, Reading progress bar, Back-to-top, बाहरी लिंक new-tab में

---

## 3️⃣ अपलोड के बाद 10-मिनट की Setup Checklist

### ✅ Settings में:
1. **Settings → Meta → Description** ON करें और ब्लॉग का विवरण लिखें (SEO के लिए बहुत ज़रूरी)
2. **Settings → Language** — अपनी भाषा चुनें (इसी से Blogger गैजेट के strings बदलते हैं)
3. **Settings → Comments → Comment Location = Embedded**
4. **Theme → Mobile Settings → Desktop**

### ✅ Layout में:
1. **Main Menu (LinkList)** — sample links हटाकर अपने लिंक डालें
2. **Hero (HTML1)** — स्वागत-संदेश और quick links अपने हिसाब से बदलें
3. **Sidebar About (HTML2)** — Social links (#) अपने Telegram/WhatsApp/YouTube से बदलें
4. **Footer** — Email/Location अपना डालें

### ✅ ये Pages बनाएँ (Pages → New Page):
| Page | Permalink (slug) |
|---|---|
| हमारे बारे में | `about.html` |
| संपर्क करें | `contact.html` |
| प्राइवेसी पॉलिसी | `privacy-policy.html` |
| डिस्क्लेमर | `disclaimer.html` |
| Screen Reader Access | `screen-reader-access.html` |
| साइटमैप | `sitemap.html` |

> Pages बनाते समय **Options → Permalink → Custom** में ऊपर वाला slug डालें — तभी मेन्यू/फुटर के links सही चलेंगे।

### ✅ Labels (श्रेणियाँ):
Hero cards और मेन्यू इन labels से जुड़े हैं — पोस्ट डालते समय ये labels use करें (या Layout में links बदल दें):
`Jobs`, `Schemes`, `Results`, `Admit-Card`

### ✅ Screen Reader Access पेज के लिए तैयार content:
```
<h2>Screen Reader Access</h2>
<p>यह वेबसाइट GIGW दिशानिर्देशों के अनुसार सुगम्य (accessible) है:</p>
<ul>
<li>टेक्स्ट साइज़ बदलने के लिए ऊपर A− / A / A+ बटन</li>
<li>हाई कंट्रास्ट मोड के लिए ◐ Contrast बटन</li>
<li>पूरी वेबसाइट कीबोर्ड (Tab की) से चलती है</li>
<li>सभी इमेज में Alt text दिया गया है</li>
</ul>
```

---

## 4️⃣ रंग बदलना (Theme Designer से)

**Theme → CUSTOMIZE → Advanced** में 4 रंग मिलेंगे:
- **Primary Color (Blue)** — header, links, buttons
- **Accent Color (Saffron)** — buttons, highlights, underlines
- **Body Text Color** / **Page Background Color**

---

## 5️⃣ सावधानियाँ / ध्यान रखने वाली बातें

1. ⚠️ **सरकारी प्रतीक (राष्ट्रीय प्रतीक/लोगो) का इस्तेमाल न करें** बिना अनुमति — डिज़ाइन सिर्फ *प्रेरणा* है, यह निजी ब्लॉग के लिए है। Footer के Disclaimer में यह साफ़ लिखा है — उसे हटाएँ नहीं।
2. Google Translate पहली बार में 1-2 सेकंड ले सकता है — यह Google का official widget है।
3. अगर कभी कोई गैजेट गलती से delete हो जाए → **Layout → Add a Gadget** से वापस जोड़ें।
4. Theme का backup लेते रहें: **Theme → ▼ → Backup → Download** (हर बड़े बदलाव से पहले)।
5. Blogger गैजेट्स के built-in texts (जैसे "Read more", कमेंट बटन) आपके **ब्लॉग की भाषा setting** के हिसाब से अपने-आप बदलते हैं।

---

## 6️⃣ फाइलें

| फ़ाइल | काम |
|---|---|
| `sidh-style-blogger-theme.xml` | ⭐ **मुख्य टेम्पलेट — इसे Blogger में upload करें** |
| `preview/index.html` | डिज़ाइन का live preview (ब्राउज़र में) |
| `theme-src/` | CSS/JS/skeleton source (भविष्य में बदलाव के लिए) |
