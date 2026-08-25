#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the SIDH-style Blogger theme XML + a static HTML preview."""
import os, re, shutil
from xml.sax.saxutils import escape
from xml.dom import minidom

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

css = read(os.path.join(BASE, 'theme.css'))
js = read(os.path.join(BASE, 'theme.js'))
skeleton = read(os.path.join(BASE, 'skeleton.xml'))

# ---------------- Raw widget contents (will be XML-escaped) ----------------
HERO = """<div class="hero-inner">
<div class="hero-text">
<p class="hero-kicker">🇮🇳 Citizen-First Blog Portal • नागरिक-केंद्रित पोर्टल</p>
<h2 class="hero-title">नमस्ते! इस ब्लॉग पर आपका स्वागत है</h2>
<p class="hero-sub">सरकारी योजनाएँ, नई नौकरियाँ, रिजल्ट, एडमिट कार्ड और डिजिटल जानकारी — सब कुछ आसान भाषा में, एक ही जगह। ऊपर दिए टूल से टेक्स्ट साइज़, कंट्रास्ट और भाषा बदल सकते हैं।</p>
<div class="hero-actions">
<a class="btn btn-primary" href="/search">🔍 खोज शुरू करें</a>
<a class="btn btn-outline" href="/p/about.html">ℹ️ हमारे बारे में</a>
</div>
</div>
<div class="hero-cards">
<a class="hero-card" href="/search/label/Jobs"><span class="hc-ico">💼</span><b>नौकरियाँ</b><small>Latest Jobs &amp; Recruitment</small></a>
<a class="hero-card" href="/search/label/Schemes"><span class="hc-ico">📋</span><b>सरकारी योजनाएँ</b><small>Govt. Schemes</small></a>
<a class="hero-card" href="/search/label/Results"><span class="hc-ico">🏆</span><b>रिज़ल्ट</b><small>Results &amp; Cut-off</small></a>
<a class="hero-card" href="/search/label/Admit-Card"><span class="hc-ico">🎫</span><b>एडमिट कार्ड</b><small>Admit Card</small></a>
</div>
</div>"""

ABOUT = """<p>नमस्ते 🙏 हम सरल भाषा में सरकारी योजनाओं, नौकरी, रिजल्ट और डिजिटल सेवाओं की सही जानकारी लाते हैं। अपडेट सबसे पहले पाने के लिए जुड़े रहें!</p>
<div class="follow-btns">
<a class="btn btn-primary btn-sm" href="#">Telegram</a>
<a class="btn btn-outline btn-sm" href="#">WhatsApp</a>
<a class="btn btn-outline btn-sm" href="#">YouTube</a>
</div>"""

FABOUT = """<p>यह ब्लॉग पोर्टल नागरिकों के लिए सरकारी योजनाओं, भर्ती परीक्षा, रिजल्ट और डिजिटल सेवाओं की जानकारी सरल भाषा में उपलब्ध कराता है। सभी सामग्री निःशुल्क है।</p>
<p class="footer-badge">♿ Accessible &nbsp;•&nbsp; 🌐 Multilingual &nbsp;•&nbsp; 📱 Responsive &nbsp;•&nbsp; ⚡ Fast</p>"""

FCONTACT = """<ul class="contact-list">
<li>📧 Email: your-email@example.com</li>
<li>📍 Location: India</li>
<li>🕐 Reply time: 24–48 घंटे</li>
</ul>
<p class="disclaimer"><b>Disclaimer:</b> इस ब्लॉग पर दी गई जानकारी केवल सामान्य उद्देश्य से है। निर्णय से पहले आधिकारिक वेबसाइट से पुष्टि अवश्य करें।</p>"""

# ---------------- Build final XML ----------------
xml_out = skeleton
xml_out = xml_out.replace('@@CSS@@', css.strip())
xml_out = xml_out.replace('@@JS@@', js.strip())
xml_out = xml_out.replace('@@HERO@@', escape(HERO))
xml_out = xml_out.replace('@@ABOUT@@', escape(ABOUT))
xml_out = xml_out.replace('@@FABOUT@@', escape(FABOUT))
xml_out = xml_out.replace('@@FCONTACT@@', escape(FCONTACT))

assert '@@' not in xml_out, 'Unresolved token in XML!'
assert ']]>' not in css and ']]>' not in js, 'CDATA terminator found in CSS/JS!'

final_path = os.path.join(ROOT, 'sidh-style-blogger-theme.xml')
with open(final_path, 'w', encoding='utf-8') as f:
    f.write(xml_out)

# ---------------- Validate ----------------
with open(final_path, 'rb') as f:
    minidom.parse(f)

# Lint checks
import xml.etree.ElementTree as ET
tree = ET.parse(final_path)
root_el = tree.getroot()
NS = '{http://www.google.com/2005/gml/b}'
sections = [s.get('id') for s in root_el.iter(NS + 'section')]
widgets = [w.get('id') for w in root_el.iter(NS + 'widget')]
assert len(sections) == len(set(sections)), 'Duplicate section ids!'
assert len(widgets) == len(set(widgets)), 'Duplicate widget ids!'
types = [w.get('type') for w in root_el.iter(NS + 'widget')]
assert all(t in {'Header', 'Blog', 'LinkList', 'HTML', 'PopularPosts', 'Label', 'BlogArchive', 'Attribution'} for t in types), 'Unknown widget type!'
print('XML OK  | sections:', sections)
print('        | widgets:', widgets)

# ---------------- Build static preview ----------------
prev_dir = os.path.join(ROOT, 'preview')
os.makedirs(prev_dir, exist_ok=True)

VARS = {
    'keycolor': '#14418f',
    'accent.color': '#e8630a',
    'body.text.color': '#1c2433',
    'body.bg.color': '#f3f5f9',
}
prev_css = re.sub(r'\$\(([^)]+)\)', lambda m: VARS.get(m.group(1), '#333'), css)
with open(os.path.join(prev_dir, 'theme.css'), 'w', encoding='utf-8') as f:
    f.write(prev_css)
shutil.copyfile(os.path.join(BASE, 'theme.js'), os.path.join(prev_dir, 'theme.js'))
print('Preview written to', prev_dir)
print('Theme XML size:', os.path.getsize(final_path), 'bytes')
