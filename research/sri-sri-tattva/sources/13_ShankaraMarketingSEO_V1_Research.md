# 12 - Shankara.it: Marketing, SEO, AEO/GEO audit

Date: 2026-11-25. Method: web search snippets (US-based search engine, NOT Google.it), third-party listings. shankara.it itself was not fetched (CAPTCHA wall respected). trustpilot.com and similarweb.com could not be fetched (not on the session's network allowlist), so their figures come from search snippets only.

## FLAGS (read first)

- FLAG-1 (method): No access to real Google Italy SERPs, Semrush, Ahrefs or Similarweb data. "Ranking" below means visibility in the search engine available to this session. Treat it as an indication, not as Google positions. Before relying on it, run a manual check on google.it in incognito mode, or a Semrush/Ahrefs IT export.
- FLAG-2 (visibility): shankara.it is well indexed (hundreds of category, product, blog and even `index.php?dispatch=reviews.view` URLs) but appears **only for brand-qualified queries** ("shankara.it olio massaggio..."). For 9 of 9 generic head terms tested it did not appear on page 1. Macrolibrarsi.it, online pharmacies (1000farmacie, drmax, openfarma, farmacialoreto, topfarmacia), Decathlon, ManoMano and Aroma-Zone took those spots.
- FLAG-3 (AEO): Even for "dove comprare prodotti Sri Sri Tattva in Italia", where Shankara is the natural (likely exclusive) Italian answer, the engine answered "no official Italian reseller found". That is a clear answer-engine failure on the company's own core entity.
- FLAG-4 (crawlability): Because pages are still in the index, the zhCAPTCHA wall is either recent, or it whitelists some crawlers (perhaps Googlebot by UA/IP), or the index is stale. It is unverified which bots get through. Any bot that cannot run JS proof-of-work (GPTBot, ClaudeBot, PerplexityBot, CCBot, most SEO tools) is very likely blocked. Verify with Google Search Console URL Inspection (owner only) or by comparing google.it `cache`/snippet freshness over time.
- FLAG-5 (content freshness): The blog's newest indexed posts date from 2019 (latest seen: Christmas yoga gifts, 11 Dec 2019). The "Tour del Medico Ayurvedico" page was flagged by the engine as about 2,930 days old, from about 2018.
- FLAG-6 (entity confusion): "Shankara" collides with Shankara Naturals (shankara.com, a US Art of Living linked skincare brand), Adi Shankara (philosopher), Firenze Shankara srl (a Florence jewellery company, unrelated) and other Instagram/YouTube accounts. AI engines regularly mix these up. In tests, the engine kept answering about shankara.com instead of shankara.it.
- FLAG-7 (legal entity inconsistency): The site and directories show two entities on the same address: Shankara Italia s.c. (cooperative, Feb 2012, P.IVA 06230360486) and Sri Sri Tattva Italy srl (P.IVA 07293170481). Addresses also vary: Via Brunetto Latini 14 Firenze (registered office), Via del Ponte a Greve 54 Scandicci (operations; Facebook says "Florence"), and Via del Bachiacca 5 Firenze (Trustpilot, which is the Art of Living Florence centre). This weakens entity consistency for Google and LLMs.
- FLAG-8 (Trustpilot score varies by snippet): 4.2 (com, nz), 4.0 and 3.9 (ie) on about 1,952 reviews. The score is drifting down. Reviews carry "Invited" tags, which means automatic invitations are used. One known complaint: mould in an oil pump, and the company replied it is not responsible after 30 days.
- FLAG-9 (unverified items): Meta Ads Library activity, Google Shopping/Merchant Center presence, Amazon.it/eBay seller accounts, WHOIS creation date and Klaviyo list size could NOT be confirmed from snippets. No evidence of an Amazon/eBay store run by Shankara was found.

## 1. SEO visibility

### 1.1 Generic head terms (Italian), session search engine

| Query | shankara.it on page 1? | Who ranks instead |
|---|---|---|
| prodotti ayurvedici (negozio online) | No | macrolibrarsi.it (dominant, many URLs), aroma-zone.com/it, efarma.com, drmax.it, eBay stores |
| olio massaggio ayurvedico | No | aroma-zone, 1000farmacie, macrolibrarsi, drmax, codifa, tuttofarma, openfarma, farmacosmo, informational: css.ch, dilei.it, meer.com |
| dentifricio ayurvedico | No | macrolibrarsi (8+ URLs), 1000farmacie, openfarma, redcare, topfarmacia, soin-et-nature |
| lettino massaggio / lettini da massaggio portatili | No | decathlon.it (marketplace), manomano.it, manor.ch, ilprodottomigliore.it (affiliate), subito/wallapop |
| incensi indiani | No | terzaluna.com, macrolibrarsi, lacasadegliincensi.com, pankaj-boutique.com |
| tappetino yoga | No | decathlon.it, unieuro, mediaworld, macrolibrarsi, liforme, fanpage.it listicle |
| chyawanprash | No | farma2go, drmax, farmacialoreto, openfarma, ayurshop.it, jamoona, desertcart |
| triphala | No | aroma-zone, tuttofarma, macrolibrarsi, farmaciaguacci, trovaprezzi, drmax |
| dove comprare Sri Sri Tattva in Italia | No | eBay third-party sellers, pushmycart, artofliving.org/pl-en |

Pattern: on generic Italian ecommerce queries in this niche, the SERP belongs to (a) **macrolibrarsi.it**, the category killer, (b) online pharmacies and parafarmacie with price-comparison feeds, (c) horizontal marketplaces (Decathlon marketplace, ManoMano, Amazon), and (d) affiliate listicles. Specialist shops such as shankara.it, ayurshop.it and terzaluna only show up on long-tail terms.

### 1.2 Brand-qualified queries (shankara.it + term): well indexed
Examples of indexed URLs (keyword-rich, `.html`):
- https://www.shankara.it/operatore-olistico/massaggio-ayurvedico/oli-massaggio-ayurvedico.html (title "Vendita online olio massaggio ayurvedico indiano")
- https://www.shankara.it/ayurveda/cosmesi-ayurvedica/dentifricio-ayurvedico-it.html (about 32 toothpastes, Dabur, Vicco, Sudanta by Sri Sri Tattva = "best seller")
- https://www.shankara.it/operatore-olistico/lettini-da-massaggio.html , https://www.shankara.it/lettino-massaggio-ayurveda-taoline.html , Oakworks massage chairs
- https://www.shankara.it/chyawanprash-sri-sri-ayurveda-tattva-250-gr.html (EUR 15.90 vs EUR 16.90 on category page vs EUR 15/14 on the review page: inconsistent prices across snippets)
- https://www.shankara.it/ayurveda.html ("Ayurveda in Italia"), https://www.shankara.it/medicina-ayurvedica-sri-sri-ayurveda.html

Technical SEO issues visible in the index:
- Parameter and duplicate URLs are indexed: `?PageSpeed=noscript&sort_by=product&sort_order=asc`, `-page-17.html?items_per_page=24&sort_by=...`, `index.php?dispatch=reviews.view&product_id=966&star_filter=5`. This means crawl budget waste and duplicate content (faceted/sorting URLs are not canonicalised or noindexed).
- Duplicate "it-it" pages: `/chi-siamo.html` and `/chi-siamo-it-it.html`, `/tour-del-medico-ayurvedico.html` and `/tour-del-medico-ayurvedico-it-it.html`. These are leftovers of an old multilingual setup.
- Old CS-Cart breadcrumb-style titles ("Ayurveda :: Cosmesi Ayurvedica :: Olio massaggio Ayurvedico :: ...") are long and low-CTR.
- Satellite domains/subdomains: `ayurveda.shankara.it` serves an unbranded template still titled "LeadGen - Multipurpose Marketing Landing Page Pack with Page Builder" (a leftover template title: bad for brand and SEO). `massaggioayurvedicoshankara.it` appears to be a separate (possibly unrelated Rome/Namaste) massage business; there is also a Facebook page "Massaggio Ayurvedico Shankara" (Rome). This adds name collision.
- Missing /sitemap.xml (404) although robots.txt references it (from the earlier tech audit), and the CAPTCHA wall.

### 1.3 Traffic, authority, domain age
- Similarweb/Semrush/Ahrefs: no snippet data found for shankara.it (only for shankara.com). Not verifiable here. FLAG-1.
- Age signals: X/Twitter @shankarait joined Nov 2012; the Shankara Italia s.c. cooperative was created Feb 2012 (per Chi siamo). The domain is likely registered around 2011-2012 or earlier. WHOIS not retrieved; check https://whois.nic.it.
- Backlinks: strong institutional link. Art of Living has a dedicated page "Art of Living Shop online - shankara.it" in 3 locales: https://www.artofliving.org/it-it/art-living-shop-online-shankarait-0 , /it-en/ and /ch-it/ (high-authority domain). The Art of Living Italy Ayurveda pages list info@shankara.it. The page describes Shankara as the cooperative started in Jan/Feb 2012, alongside the Art of Living Foundation. Coupon sites (weglo, codicicoupon, trustdeals, migliorisconti, hotdeals, super-offerte, advisato) add low-quality but numerous links.
- Rough estimate (judgement, not measured): a store with about 1,950 Trustpilot reviews over about 10 years and a 40K Facebook page is typically in the range of 10k to 40k visits/month, mostly brand/direct plus Art of Living community, newsletter and social. Its organic non-brand share is likely small.

## 2. Content, blog, consultations
- Blog exists on WordPress at https://www.shankara.it/blog/ with sections /blog/ayurveda/ and /blog/yoga/, plus tag archives (e.g. /blog/tag/medicina-ayurvedica/).
- Topics: Chyawanprash for immunity (Sep 2019), Brahmi (Sep 2019), Ashwagandha (Aug 2019), Triphala (Aug 2019), Ayurvedic summer tips (Jul 2019), doshas (2016), purifying your dosha (2015), Ayurvedic diet (2015), yoga for back pain, Pilates breathing, Christmas yoga gifts (Dec 2019).
- Freshness: no post after 2019 was found. The blog is effectively dormant for about 6 to 7 years (FLAG-5). The posts are product-led (well aligned with the product catalogue), but they do not rank for generic queries such as "triphala" or "chyawanprash" in the tested engine.
- Consultations: an "Ayurvedic doctor tour" model with pulse diagnosis. https://www.shankara.it/conferenze-e-consulti.html , https://www.shankara.it/consulenza-on-line.html (online consult sold as a product, EUR 65, "no shipping costs"), https://www.shankara.it/consulenza-ayurvedica-ripetenti.html (first visit EUR 65, follow-up EUR 55, held in English with translation), https://www.shankara.it/tour-del-medico-ayurvedico.html (city contacts Milan/Rome/Florence/Naples-Sorrento; "next dates to be confirmed", stale). Selling a service as a cart product is a smart cross-sell with good AOV logic, but the pages are stale.

## 3. Paid and social
- Facebook: https://www.facebook.com/shankaraitalia (handle @Shankaraitalia), about 40.2K likes/followers (snapshots 40,154 and 40,267), "98% recommend" from 290 reviews, Facebook Shop tab exists (/Shankaraitalia/shop/). This is the biggest owned audience, likely built 2012-2018 through organic reach and the Art of Living community.
- Instagram: https://www.instagram.com/shankara_it/ about 2,659 followers, 2,143 following, 1,089 posts (cached). Small relative to Facebook. The follow/follower ratio suggests follow-back growth tactics. Bio: "online shop for holistic products: Ayurveda, yoga and meditation accessories, incense, superfoods".
- X: https://x.com/shankarait (since Nov 2012), likely inactive.
- YouTube: https://www.youtube.com/@ShankaraItaliascFirenze (exists; subscriber count not retrieved; probably small).
- Pinterest: https://www.pinterest.it/shankaraitalia/ (exists).
- Meta Pixel 940504482664180 is installed. Meta Ads Library activity could not be verified via snippets (FLAG-9). Check: https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=IT&q=shankara.it
- Google Ads/Shopping: GTM is present, but no evidence of Shopping ads or free listings in snippets. With the legacy UA tag dead since 2023-24, measuring Google Ads conversions is questionable unless GA4/Ads tags live inside GTM. Unverified.
- Email: Klaviyo is installed. Coupon aggregators report a 10% first-order discount for newsletter signup and a 5% first-order code "BOT5" (codicicoupon Feb 2025, trustdeals Jul 2025). This suggests an active welcome flow, probably also a bot/pop-up code. See https://www.codicicoupon.it/codici-sconto/shankarait , https://www.trustdeals.it/view/shankara.it , https://www.weglo.it/negozio/shankara.html
- Trustpilot: https://www.trustpilot.com/review/shankara.it about 1,952 reviews, TrustScore 3.9 to 4.2 depending on locale snapshot. Uses automatic invitations ("Invited" tag) and replies to reviews in Italian. This is the strongest third-party trust asset and also feeds Google seller ratings if Google Ads is used. Reviews praise fast shipping; complaints concern product quality and a strict 30-day return stance.
- Marketplaces: no Amazon.it or eBay.it store by Shankara/Sri Sri Tattva Italy was found. Sri Sri Tattva products appear on eBay.it only through third-party sellers at inflated prices (e.g. Sudanta toothpaste EUR 36.26). That is a missed channel, and also a sign that the exclusivity is not being defended online.
- B2B/wholesale: natur.it lists "Sri Sri Tattva Italy S.r.l." as a store/partner (https://www.natur.it/stores/shankara-italia-s-c/).

## 4. AEO / GEO verdict (ChatGPT, Perplexity, Google AI Overviews, Claude)

| Signal | Status | Effect |
|---|---|---|
| Crawl access for AI bots | zhCAPTCHA JS proof-of-work on every page; non-JS bots (GPTBot, ClaudeBot, PerplexityBot, CCBot, OAI-SearchBot, Applebot) very likely see only the challenge | Fatal: live retrieval and fresh training data are blocked |
| Google-Extended / AI Overviews | AI Overviews use Googlebot's index; Shankara pages are in the index (if Googlebot passes the wall) but never rank on generic terms, so they are rarely retrieved | Low |
| Sitemap | robots.txt points to /sitemap.xml, which returns 404 | Discovery hurt for every bot |
| Structured data | Template has Organization + WebSite SearchAction only; no evidence in snippets of Product/Offer/AggregateRating rich results (no stars/price shown as rich data); product review pages exist on CS-Cart (`dispatch=reviews.view`) but are not marked up as far as visible | Weak: answer engines cannot reliably extract price, availability, ratings |
| FAQ / answer-shaped content | Blog dormant since 2019, no FAQ hubs; product copy makes health claims ("antibatterico", "depurativo") that answer engines avoid citing | Weak |
| Entity consistency | Two legal entities, three addresses, a name collision with Shankara Naturals and Adi Shankara, "it-it" duplicate pages, a leftover template subdomain | Weak: LLMs conflate it with shankara.com |
| Third-party mentions | Art of Living pages (strong), Trustpilot (strong), coupon sites (noise), almost no press, listicles or Reddit/forum mentions found | Medium-low |
| Wikipedia/Wikidata | None for Shankara Italia | Absent |

Verdict: **shankara.it is essentially invisible to answer engines today.** ChatGPT/Perplexity/Claude are unlikely to cite it for generic questions ("best Ayurvedic toothpaste Italy", "where to buy chyawanprash in Italy", "lettino per massaggio ayurvedico") because (1) their crawlers most likely hit the PoW CAPTCHA, (2) there is no sitemap and little structured data, (3) non-brand authority sits with Macrolibrarsi and pharmacies, and (4) the brand entity is ambiguous. At best it gets cited on navigational or brand queries (e.g. "Art of Living shop Italy"), through artofliving.org and Trustpilot, not through its own pages. Even the Sri Sri Tattva Italy distributor question failed in testing (FLAG-3).

## 5. Weaknesses and lessons for a Belgian copycat

### Copy (what works)
1. Clear category architecture that combines retail wellness with a **professional vertical** ("operatore olistico": massage tables, 5 L oils, Shirodhara tables, Oakworks chairs). B2B practitioners give high AOV and repeat purchases. Belgian equivalent: "praticien / therapeut" section.
2. **Ecosystem anchor**: an exclusive brand line (Sri Sri Tattva) plus links from the Art of Living national site in several languages. In Belgium, secure the same kind of link from artofliving.org/be-nl and /be-fr, and from yoga schools and Ayurveda trainings.
3. **Services sold as products** (Ayurvedic consult EUR 55-65, doctor tours, online pulse diagnosis) cross-sold with remedies.
4. Keyword-rich, human-readable category slugs in the local language.
5. **Systematic review collection** (Trustpilot auto-invites, about 1,950 reviews) and public replies.
6. Welcome-discount email capture (10% first order) plus Klaviyo flows.

### Do better (what fails at Shankara)
1. **Platform**: Shopify (or Shopify Markets) instead of a 2019 CS-Cart with jQuery 1.9.1. You get native sitemap.xml, canonical tags, Product/Offer JSON-LD, a Google & YouTube channel for free listings and Shopping, Meta catalogue sync, and Shop Pay/Bancontact.
2. **Multilingual from day 1**: NL + FR (+ EN, optionally DE) with hreflang, localised slugs, and separate keyword research per language (e.g. "ayurvedische tandpasta", "dentifrice ayurvédique", "massagetafel", "table de massage"). No leftover "-it-it" duplicates.
3. **Measurement**: GA4 + Consent Mode v2 (Belgian GBA/GDPR), server-side Meta Conversions API, Google Ads enhanced conversions. Shankara's UA tag has collected nothing since 2023-24.
4. **Open to AI crawlers**: no blanket JS proof-of-work wall. Use Cloudflare bot management with verified-bot allowlisting (Googlebot, Bingbot, OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot, Applebot), protect only checkout/login/search, and publish an explicit robots.txt plus an `llms.txt`.
5. **Structured data everywhere**: Product, Offer (price, availability, GTIN), AggregateRating/Review, BreadcrumbList, FAQPage on category pages, Organization with a single legal name, address, VAT number and `sameAs` (Facebook, Instagram, Trustpilot, Art of Living page), LocalBusiness if there is a pickup point.
6. **One entity, one name**: one legal entity, one address and one distinctive brand that does not collide with Shankara Naturals or Adi Shankara. Create a Wikidata item and Google Business Profile, and use consistent NAP across Trustpilot, Facebook and KBO/BCE.
7. **Answer-first content cadence**: 2 to 4 posts or guides per month in NL and FR, built around questions (what is triphala, how to use chyawanprash, how to choose an Ayurvedic massage table) with short direct answers, sources, author bio (an Ayurvedic practitioner for E-E-A-T) and EU-compliant wording (no unauthorised health claims under Reg. 1924/2006; Belgian FOD/SPF rules for supplements). Shankara stopped in 2019.
8. **Faceted navigation hygiene**: canonicalise or noindex sort/page/filter parameters; avoid indexing review subpages separately.
9. **Marketplaces as a channel**: list the exclusive brands on bol.com (the key Belgian/Dutch marketplace) and Amazon.nl/.fr/.de, so third-party resellers do not own those listings.
10. **Google Merchant Center free listings + Shopping** from launch. Price-comparison is where pharmacies beat Shankara.
11. **Social**: invest in Instagram and short video (Reels/TikTok/YouTube Shorts: abhyanga tutorials, tongue scraping, oil pulling) rather than Facebook alone; build UGC from yoga teachers. Run Meta Advantage+ catalogue ads off a clean product feed.
12. **Review hygiene**: keep auto-invites, but also collect Google seller and product reviews (Merchant Center), and use a customer-friendly returns policy. Shankara's "not responsible after 30 days" reply is the kind of thing that pulls its score from 4.2 toward 3.9.
13. **Leftovers**: no template-titled subdomains, no orphaned landing pages, keep event and consultation pages dated and current.

## Sources
- https://www.trustpilot.com/review/shankara.it (snippets; also au/ie/nz/es locales)
- https://www.facebook.com/shankaraitalia , https://www.facebook.com/Shankaraitalia/shop/
- https://www.instagram.com/shankara_it/
- https://x.com/shankarait
- https://www.youtube.com/@ShankaraItaliascFirenze
- https://www.pinterest.it/shankaraitalia/
- https://www.artofliving.org/it-it/art-living-shop-online-shankarait-0 (+ /it-en/, /ch-it/)
- https://www.shankara.it/chi-siamo.html , https://www.shankara.it/chi-siamo-it-it.html
- https://www.shankara.it/blog/ , /blog/ayurveda/ , /blog/yoga/
- https://www.shankara.it/conferenze-e-consulti.html , /consulenza-on-line.html , /consulenza-ayurvedica-ripetenti.html , /tour-del-medico-ayurvedico.html
- https://www.shankara.it/operatore-olistico/lettini-da-massaggio.html
- https://www.shankara.it/ayurveda/cosmesi-ayurvedica/dentifricio-ayurvedico-it.html
- https://www.shankara.it/chyawanprash-sri-sri-ayurveda-tattva-250-gr.html
- http://ayurveda.shankara.it/ (template-titled subdomain)
- https://www.natur.it/stores/shankara-italia-s-c/
- https://www.codicicoupon.it/codici-sconto/shankarait , https://www.trustdeals.it/view/shankara.it , https://www.weglo.it/negozio/shankara.html , https://www.advisato.it/siti/shankara
- Competitor SERP examples: https://www.macrolibrarsi.it/cat/1596/integratori-ayurvedici , https://www.macrolibrarsi.it/cat/592/dentifricio , https://www.aroma-zone.com/it/product/olio-per-massaggio-bio-ayurvedico , https://www.1000farmacie.it/olio-da-massaggio-vata-200-ml.html , https://www.drmax.it/chyawanprash-special-500-g , https://ayurshop.it/prodotto/sattva-chyawanprash , https://www.decathlon.it/tutti-gli-sport/yoga/tappetini-e-borse-yoga , https://www.terzaluna.com/incensi-indiani , https://www.ebay.it/str/aquaticaenterprises
