# 04 Website audit: Sri Sri Tattva online shops (as of 2026-11-16)

## 0. What could and could not be tested (read first)

- **Hands-on Playwright test: NOT possible.** This cloud session's network policy allows package registries only. Every target host was refused at the egress proxy (curl: `CONNECT tunnel failed, response 403`; Chromium: `net::ERR_TUNNEL_CONNECTION_FAILED`) for srisritattva.com, www.srisritattva.com, srisritattva.eu, srisritattvausa.com, amazon.com.be, amazon.de, dookan.com, jamoona.com and even example.com. WebFetch was blocked the same way (`ENOTFOUND`). This is our sandbox, not bot-blocking or geo-blocking by Sri Sri Tattva.
- Therefore: **no homepage/product/cart/checkout walk-through, no Belgium country-dropdown check, no shipping quote, no screenshots, no speed or mobile measurements.** Probe script kept at `scratchpad/web/probe.js`.
- Everything below comes from **web search result snippets** (search index of official pages + third parties). Snippet dates vary (some pages cached years ago). Treat prices as indicative and verify live.
- To redo step 2 properly: allow the shop hosts in the environment network settings (srisritattva.com, www.srisritattva.com, www.srisritattva.eu, cdn.shopify.com, checkout.shopify.com, shop.app and similar Shopify hosts, plus amazon domains), or run the same Playwright flow on a local machine.

## 1. Official storefronts found

| Store | Market | Platform (evidence) | Ships to Belgium? |
|---|---|---|---|
| srisritattva.com | India | Shopify (URL pattern `/products/`, `/collections/`, `/pages/shipping-delivery-policy`; "Inclusive of all taxes", INR) | Policy text is written for India only (fee below Rs 2,999 / free delivery banners above Rs 999, dispatch next working day, 3 to 4 working days). No international option found. Not verified at checkout. |
| **srisritattva.eu** (Sri Sri Tattva Europe B.V., KvK 76972631, The Hague NL; German branch Frankfurt HRB 121097) | EU | Shopify with Shopify Markets (locale paths `/en-de/`, `/de-gb/`, `/pages/`, `/collections/`) | **Yes.** Shipping policy headed "(Within Europe only)". Carriers DPD, DHL or UPS. Orders before 14:30 on working days ship same day. Free delivery advertised above EUR 50 (one policy snippet names BE, NL, DE). Per-country rates are in a "Shipping & Delivery" guide on product pages (Belgium rate not visible in snippets). |
| srisritattva.co.uk | UK | Shopify-style | Not confirmed for EU; post-Brexit it would be a non-EU import anyway. Irrelevant for BE. |
| srisritattvausa.com | USA | Shopify (`/pages/shipping-returns-policy`) | US only. Free ground shipping over USD 75 (homepage older snippet says USD 50), 3 to 4 business days. Support: support.usa@srisritattva.com. |
| srisritattva.ca | Canada | Shopify | Canada only, free over CAD 75. |
| srisritattva.us | n/a | No results; probably not in use. |
| Art of Living Bad Antogast (DE) | Physical | On-site Sri Sri Tattva Ayurveda centre shop; page points online buyers to srisritattva.eu. |
| global.artofliving.store | Global (Sri Sri Publications) | Shopify | Ships internationally for select products, USD 30 to 100 shipping, buyer pays import duties. Not an SST channel as such. |

**Amazon presence (search-index evidence):**
- amazon.nl: SST brand grocery listings (Chyawanprash 1 kg, cow ghee, Ojasvita, rock salt), roughly EUR 35 to 122, low stock. These look like third-party importers at heavy markups.
- amazon.com.be: small selection (facial scrub approx. EUR 34, rock salt approx. EUR 40).
- amazon.fr: Shakti Drops 10 ml x2 listing.
- amazon.de: nothing surfaced in search.
- amazon.com: brand store / merchant listing exists (US).
- Also desertcart (DE/PL/HR), eBay.de Indian sellers, Distacart, thedesifood.com: cross-border resellers.

## 2. Checkout walk-through (srisritattva.com)

Not performed (see section 0). Unanswered questions that only a live test can settle:
- Does the country selector at checkout list Belgium, or is it India-locked?
- Do Shopify Markets redirect EU visitors from .com to .eu?
- Payment methods shown (UPI, cards, wallets, COD via Razorpay/PayU?) and whether foreign cards work.

## 3. Shipping, customs, payments for a Belgian buyer

- **From srisritattva.com (India):** no evidence of international shipping. If it ever shipped, the parcel would be a non-EU import: VAT due on every parcel since July 2021 (IOSS lets the seller collect it at checkout for consignments up to EUR 150; otherwise bpost/courier collects VAT plus a handling fee on delivery), **plus since 1 July 2026 the temporary EU flat EUR 3 customs duty per item category on consignments of EUR 150 or less** (Council Regulation (EU) 2026/382, in force until 1 July 2028). Ayurvedic supplements can also be held for food-safety/novel-food checks.
- **From srisritattva.eu:** intra-EU shipment, no customs, EU VAT included in price. Carriers DPD/DHL/UPS; DPD NL to BE is typically 2 days home, 3 days to parcel point. Exact BE shipping fee not confirmed (free above EUR 50 per snippets).
- **Payment methods (.eu):** not confirmed. As a Shopify store it very likely supports cards and Shopify Payments local methods (iDEAL, likely Bancontact), but this was not verified.
- **Returns:** not retrievable (pages blocked). Under EU law a 14-day withdrawal right applies to .eu orders; opened food/health products may be excluded.

## 4. UX assessment (limited)

Could not measure speed, mobile layout, or trust signals directly. From structure only:
- All brand shops are Shopify, so baseline performance, mobile responsiveness and checkout (Shop Pay) are solid by default.
- **Fragmentation is the main friction:** five separate country domains (.com, .eu, .co.uk, .us-store, .ca) with different catalogues, prices and product names (e.g. "Chyawanprash Lehya 250 g" on .eu vs "Chyawanprash 1 kg" on .com). A Belgian Googling "Sri Sri Tattva" lands on the India .com first, which (per its policy) does not ship to them. No evidence of a global country switcher linking the shops.
- .eu has locale paths for German and English (`/en-de/`, `/de-gb/`); no Dutch or French locale seen in search results, which matters for Flanders and Wallonia.
- Several cached product pages showed "sold out" (Ashwagandha on .com and .eu, Shakti Drops 30 ml on .com), suggesting stock gaps.

## 5. Realistic options for a Belgian consumer today

1. **srisritattva.eu (official, recommended).** EU-shipped, VAT included, free shipping above EUR 50. Price examples: Ashwagandha 60 tabs EUR 17.95; Ashwagandhadi 60 tabs EUR 17.95; Chyawanprash Lehya 250 g EUR 17.95.
2. **Bad Antogast shop (Black Forest, DE)** for people attending Art of Living courses.
3. **Amazon.nl / .com.be / .fr marketplace sellers**: available but expensive and stock patchy (e.g. Chyawanprash 1 kg listings in the EUR 35+ range).
4. **Indian grocery webshops delivering to BE**: India Plaza (indiaplaza.eu, NL) lists Sri Sri Tattva as a brand (min order EUR 50). Dookan, Jamoona and spicevillage.eu: no SST listings found (spicevillage carries "Organic Tattva", a different brand). Other BE-delivering grocers (DesiRashan: EUR 7.49 shipping, free from EUR 69.99; Annachi.fr: free from EUR 55 to BE; Indian Mart EU; eKirana NL) did not show confirmed SST stock.
5. **Physical shops in Antwerp/Brussels**: none found stocking SST in search; would need local check.
6. **Cross-border resellers** (desertcart, Distacart, eBay India sellers): possible, but import VAT plus EUR 3 duty per item category plus handling fee apply.

**Price comparison vs India (indicative):**

| Product | India (srisritattva.com) | EU (srisritattva.eu) | Multiple |
|---|---|---|---|
| Ashwagandha 60 tabs 500 mg | Rs 180 (approx. EUR 1.85) | EUR 17.95 | approx. 10x |
| Chyawanprash | 1 kg Rs 410 (approx. EUR 4.20) | 250 g EUR 17.95 (approx. EUR 72/kg) | approx. 17x per kg |
| Shakti Drops | 30 ml Rs 280 to 299; 10 ml Rs 104 to 130 (BigBasket) | not found in .eu snippets; resellers approx. USD 5 to 8 per 10 ml | n/a |

(INR to EUR at roughly 97 INR per EUR; EU snippets may be years old.)

## FLAGS

- No hands-on test was possible: sandbox egress blocks all shop hosts. No screenshots exist.
- India .com policy appears India-only; Belgians must use srisritattva.eu.
- EU prices approx. 10x to 17x India MRP (part import cost, part EU regulatory/VAT, but a big gap).
- No Dutch/French storefront language seen on .eu.
- Sold-out flags on key SKUs in cached pages.
- Amazon BE/NL listings appear to be unofficial third-party sellers at high markups.
- Since 1 July 2026, any parcel from India adds EUR 3 duty per item category on top of import VAT.

## Sources (search results)
- https://www.srisritattva.com/pages/shipping-delivery-policy
- https://www.srisritattva.eu/ , https://www.srisritattva.eu/pages/shipping-policy , https://www.srisritattva.eu/pages/about-us , https://www.srisritattva.eu/products/ashwagandha-tablets , https://www.srisritattva.eu/en-de/products/chyawanprash-paste , https://www.srisritattva.eu/pages/aolnl25special
- https://srisritattvausa.com/pages/shipping-returns-policy ; https://srisritattva.ca/pages/shipping-returns-policy ; https://www.srisritattva.co.uk/
- https://www.northdata.com/Sri%20Sri%20Tattva%20Europe%20B%C2%B7V%C2%B7,%20's-Gravenhage/KVK%2076972631
- https://www.artofliving.org/badantogast/ayurveda ; https://global.artofliving.store/policies/shipping-policy
- https://www.amazon.nl/-/en/Grocery-SRI-TATTVA/s?rh=n:16242078031,p_4:SRI%2BSRI%2BTATTVA ; https://www.amazon.com.be/-/en/Beauty-SRI-TATTVA/s?rh=n:27156023031,p_4:SRI+SRI+TATTVA ; https://www.amazon.fr/Sri-Tattva-Shakti-Lot-gouttes/dp/B07YKXSC8W
- https://srisritattva.com/products/shop-ashwagandha-stress-reliever ; https://www.srisritattva.com/products/chyawanprash-herbal-immunity-booster-1kg ; https://www.srisritattva.com/products/shakti-drops-immunity-booster-30ml ; https://www.bigbasket.com/pd/40014653/sri-sri-tattva-shakti-drops-immunity-booster-10-ml/
- https://www.indiaplaza.eu/ ; https://www.desirashan.com/pages/indian-grocery-store-online-in-belgium ; https://annachi.fr/ ; https://www.spicevillage.eu/products/organic-tattva-toor-tur-arhar-dal-500gm
- https://commission.europa.eu/news-and-media/news/ensuring-fairness-and-safety-eur3-customs-duty-low-value-parcels-2026-06-29_en ; https://www.dpd.com/be/en/sending/
