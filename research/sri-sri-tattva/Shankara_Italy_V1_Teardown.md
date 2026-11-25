# Shankara.it Teardown V1

Subject: https://www.shankara.it (Italy), the shop Camille cited as the model. Date: 25 Nov 2026.
Method: direct HTTPS requests from a research session (robots.txt and the site's own full 404 template were readable). Every normal page sits behind a custom "DDOS protection" CAPTCHA (zhCAPTCHA, browser proof-of-work), which was deliberately not bypassed. The rest comes from search snippets and third-party sites. Detail and URLs: `sources/11` to `sources/13`.

---

## 1. Bottom line

**This is not an independent success story; it is the pattern you feared, already played out.** Shankara.it was built from 2012 by a cooperative of three people (Shankara Italia S.C.). The shop is now operated by **Sri Sri Tattva Italy srl**, and the cooperative is inactive (about EUR 20k revenue and EUR 60k loss in 2024). The co-founder who did the tech, Alessandro Trotta, now runs **Yogateria** in Rio de Janeiro, a yoga-goods shop, not a Sri Sri Tattva distributor, with third-party revenue estimates of 0.5 to 1M (currency unstated). Nothing supports the EUR 3M figure.

**The shop itself is old and runs on community, not search.** CS-Cart 4.9.2 (about 2019), jQuery 1.9, a dead Universal Analytics tag, no sitemap, blog dormant since 2019, Italian only, invisible on page 1 of Google for generic Ayurveda terms and to AI answer engines. What carries it: Art of Living backlinks and community, a Facebook page with about 40,000 followers, about 1,950 Trustpilot reviews (mostly 2013 to 2021), email (Klaviyo), and a therapist/operator category.

**For you:** the model (multi-brand Ayurveda/yoga shop + therapist channel + Art of Living community) is proven to work at modest scale. The ownership outcome is the warning: the founders built it and the brand company ended up operating it. Whatever you build, own the company, domain, customer data and supplier contracts yourself, and agree the exit terms upfront (V3 report, sections 5 and 12).

**Ask Camille:** whether the "Italian in Brazil" is Alessandro Trotta, how the cooperative's business passed to Sri Sri Tattva Italy srl (sold, absorbed, or taken over), and whether the founders were paid.

---

## 2. Who owns and runs it

| Entity | ID | Facts | Status |
|---|---|---|---|
| **Sri Sri Tattva Italy srl** | P.IVA 07293170481 | Named in the live site footer as operator. Registered office Via Brunetto Latini 14, 50133 Firenze; operating site Via del Ponte a Greve 54, 50018 Scandicci (FI). | **Verified operator.** Founding date, owners, directors, revenue not found (registries unreachable). VAT sequence suggests registration around 2022 to 2025 (inference). |
| Shankara Italia S.C. (cooperative) | P.IVA 06230360486 | Same Florence address. Founded Feb 2012 by Jaya Speranza (CEO), Alessandro Trotta (CTO, co-founder), Dario Zagaria (CFO), per the site's own "Chi siamo". 2024: about EUR 20k revenue, about EUR 60k loss; listed inactive. | Predecessor. A natur.it store-locator page with the cooperative in its URL is now titled "Sri Sri Tattva Italy S.r.l.", pointing to a hand-over. |
| Shankara Europe BV | Weert, NL | Named in an Art of Living privacy policy "and its subsidiaries". | Possible parent of the Italian srl. **Unverified.** |
| Firenze Shankara Srl | P.IVA 05767040487 | Gemstone and pearl wholesaler, about EUR 4.1M revenue, 14 staff. | **Unrelated.** Do not attribute its revenue to the shop. |

To settle ownership: a paid Italian company extract (visura camerale) for 07293170481, a few euros at registroimprese.it.

---

## 3. Technology

| Layer | What it uses | Assessment |
|---|---|---|
| Shop platform | **CS-Cart 4.9.2** (PHP, self-hosted; current CS-Cart is 4.18+) | Outdated; security and performance debt |
| Front end | Custom "shankara" theme, jQuery 1.9.1, jQuery UI 1.11.1 (Google CDN), Owl Carousel, Magic Zoom Plus | 2013-era stack |
| Blog | WordPress at /blog/ | No post newer than 2019 found |
| Hosting/edge | Edge "uk2", IP 157.245.40.223 (DigitalOcean range), HTTP/3, HSTS 1 day | Self-managed |
| Bot wall | Custom zhCAPTCHA proof-of-work in front of every page | Stops scrapers; very likely also blocks AI crawlers and may hurt search crawling |
| Analytics | Google Tag Manager GTM-KCCTP4; **Universal Analytics UA-35397994-1 (dead since the 2023/24 sunset)** | Possibly flying blind unless GA4 runs inside GTM |
| Marketing | Meta Pixel 940504482664180, Klaviyo (email), Trustpilot widget, Zopim/Zendesk chat | Sensible set |
| Structured data | Organization + WebSite SearchAction only on the template; no evidence of Product/Offer/Review schema | Weak for rich results and AI answers |
| Sitemap | robots.txt declares /sitemap.xml, which returns 404 | Broken |
| Languages | Italian only, no hreflang | Single-market |
| Leftovers | Subdomain ayurveda.shankara.it still titled "LeadGen..."; duplicate "-it-it" pages and parameter URLs indexed | Index hygiene problems |

---

## 4. Range, pricing and operations

**Range (category tree from the live template):**
- Ayurveda: creams, toothpaste, massage oils, soaps, shampoo; supplements, spices, hair care, accessories; vitamin supplements; consultations; Ayurvedic kits (flu, oral hygiene, joints, weight loss, cold and cough).
- Natural food: Indian food, sweeteners, oils and butters, breakfast, Himalayan salt, Indian spices, superfoods, herbal teas.
- Aromatherapy: essential oils and blends, incense, room fragrance.
- Natural body care: clay cosmetics, natural hair care and dyes, face and body.
- Spiritual objects: copper bracelets, mala, salt lamps.
- **Holistic operator (professionals):** fixed and portable massage tables, massage chairs, shiatsu futons, Ayurvedic massage oils, therapist accessories.
- Yoga shop: clothing, mats, meditation cushions and accessories, Tibetan bowls, incense, guided meditations and MP3s, mantra music and instruments, pilates, books, videos.
- Brands confirmed: Sri Sri Tattva, Argital, Volatile, house massage oils. Seen in the template but unconfirmed as ranges: Vicco, Goloka, Sagrada Madre, Ojas, Allumen. Product count not found.

**Prices:**

| Product | shankara.it | srisritattva.eu | India |
|---|---|---|---|
| Sudanta toothpaste 100 g | EUR 5.70 | EUR 6.95 | about EUR 1 (200 g) |
| Chyawanprash 250 g | EUR 15.90 | not found (Distacart EU EUR 13.08) | about EUR 1 |
| Allumen alum spray | EUR 7.00 | | |
| Solid cornflower shampoo 60 g | EUR 6.50 | | |
| Govinda tongue cleaner | EUR 5.50 | | |

Shankara.it sells Sudanta *below* the brand's own EU shop, a sign of better supply terms or local stock.

**Operations:**
- Shipping: GLS. Free shipping from EUR 69 (live banner; an older policy page says EUR 79). Costs and times outside Italy not found.
- Payments: PayPal, Postepay, cards via Banca Sella, bank transfer (pay within 3 days), cash on delivery (+EUR 2.50). No buy-now-pay-later.
- Returns: written policy 14 days, customer pays return shipping, refund within 7 days.
- Affiliate programme "Guadagna con noi": about 10% commission via a personal code.
- Consultations: Ayurvedic pulse diagnosis sold as cart products (EUR 55 to 65), Ayurvedic doctor tour pages (stale).
- Newsletter incentive: 10% off first order; 5% code "BOT5".
- Customer service: email supporto@shankara.it, two mobile numbers, live chat.

---

## 5. Marketing, SEO, AEO, GEO

**SEO:** pages are indexed and rank for brand-name searches, but for nine generic terms tested (prodotti ayurvedici, olio massaggio ayurvedico, dentifricio ayurvedico, lettino massaggio, incensi indiani, tappetino yoga, chyawanprash, triphala, Sri Sri Tattva in Italia) it was not on page 1. Those results go to macrolibrarsi.it, online pharmacies (1000farmacie, drmax, openfarma), Decathlon, ManoMano, Aroma-Zone, terzaluna, ayurshop.it. Rankings came from a US-based search tool, so treat them as indicative.

**Backlinks:** strong links from Art of Living sites in three locales, plus coupon sites.

**Social and reputation:** Facebook about 40,200 followers (98% recommend, 290 reviews, Facebook Shop tab); Instagram @shankara_it about 2,700 followers, 1,089 posts; X since 2012; YouTube and Pinterest exist. Trustpilot about 1,950 reviews with automatic invitations, score drifting from 4.2 to about 3.9 to 4.0, about 82% five-star, mostly 2013 to 2021. Praise: fast shipping, packaging. Complaints: late or missing orders, unanswered support, prices, a mouldy pump. No own Amazon or eBay store.

**AEO/GEO (answer engines, AI search):** essentially invisible. Even "where to buy Sri Sri Tattva in Italy" did not surface it. Causes: the CAPTCHA wall likely blocks AI crawlers, no sitemap, no Product/Offer/Review schema, dormant blog, name confusion (shankara.com, a Florence jewellery firm, Rome massage businesses).

**Where its customers likely come from:** the Art of Living community and backlinks, Facebook, email, Trustpilot reputation and repeat customers. Not organic search, not AI answers.

---

## 6. Lessons for a Belgian version

**Copy:**
- The professional channel (holistic operator category: massage tables, oils, therapist accessories). Practitioners buy repeatedly and recommend.
- Consultations sold as products in the cart.
- Art of Living community tie-in and backlinks.
- Systematic review collection (automatic Trustpilot invitations).
- Email flows with a first-order discount.
- Affiliate codes at about 10% for teachers and practitioners.
- Multi-category range (Ayurveda + yoga + aromatherapy + spiritual objects) to lift order value above the free-shipping threshold.

**Do better:**
- Modern hosted platform (Shopify) instead of self-hosted CS-Cart; no technical debt from day one.
- **Dutch and French** from launch, with hreflang; German later.
- GA4 with Consent Mode; a working sitemap; full Product/Offer/Review structured data; Google Merchant Center from launch.
- **Open to verified search and AI crawlers** (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot); use the platform's own bot protection instead of a wall in front of every page. Add an llms.txt file.
- Regular question-based content in NL and FR ("what is Triphala", "Ayurvedic oil for vata") so answer engines can cite you.
- One legal entity and one address everywhere (entity consistency matters for search and AI).
- Belgian payment methods (Bancontact), clear EU shipping rates.
- bol.com and Amazon.com.be listings as extra channels once product notifications are in order.

**Most important lesson:** own the business structure. The Italian founders built the audience, the reviews and the systems; today the brand company's srl runs the shop and the founders' cooperative is dormant. Before building a Belgian equivalent, get in writing: who owns the company, domain, customer list and supplier contracts, and what a hand-over would cost the brand.

---

## 7. Flags

1. Shankara.it content seen only through the 404 template and possibly cached search snippets; product and policy pages not read directly.
2. Owners and finances of Sri Sri Tattva Italy srl unknown; parent (Shankara Europe BV, Sriveda Sattva India, or individuals) unverified. Visura needed.
3. The hand-over from cooperative to srl is inferred (shared address, natur.it page title), not documented. Its earlier revenue history is unknown.
4. The identity of "the Italian now in Brazil" as Alessandro Trotta is an inference. Yogateria is not a Sri Sri Tattva distributor; the EUR 3M figure is unsupported (third-party estimate 0.5 to 1M, currency unstated).
5. Free-shipping threshold inconsistent (EUR 69 vs EUR 79); EU shipping costs unknown.
6. Rankings from a US-based search tool, not Google.it; no traffic data (Similarweb/Semrush unavailable).
7. Which bots the CAPTCHA wall lets through is unknown; pages remain indexed, so either the wall is recent or search crawlers are allowed.
8. Return period: 14 days written; "30 days" appears only in a Trustpilot reply.
