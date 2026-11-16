import json, urllib.request, urllib.parse, time, os, re, urllib.error, html, sys
UA={'User-Agent':'PosterBuilder/1.0 (educational satire project)'}
def req(url,tries=6):
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30).read()
        except urllib.error.HTTPError as e:
            ra=int(e.headers.get('retry-after') or 10); print('  ',e.code,'wait',ra,flush=True)
            if e.code!=429: return None
            time.sleep(min(ra,30)+2)
    return None
picks=json.load(open('picks.json')); a=json.load(open('cands_all.json'))
thumbs={t:u for v in a.values() for t,u in v}
for k,t in picks.items():
    p=f'dl/full/{k}.jpg'
    if os.path.exists(p) and os.path.getsize(p)>0: continue
    u=thumbs[t].replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/').split('?')[0]
    u=re.sub(r'/\d+px-','/960px-',u)
    b=req(u)
    if b: open(p,'wb').write(b); print(k,'ok',len(b),flush=True)
    else: print(k,'FAILED',u,flush=True)
    time.sleep(1.5)
if 'meta' in sys.argv:
    strip=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>','',s or ''))).strip()
    q=urllib.parse.urlencode(dict(action='query',format='json',titles='|'.join(picks.values()),prop='imageinfo',iiprop='extmetadata',iiextmetadatafilter='Artist|LicenseShortName|ImageDescription'))
    b=req('https://commons.wikimedia.org/w/api.php?'+q,tries=30)
    pages={pg['title']:pg for pg in json.loads(b)['query']['pages'].values()}
    norm={n['from']:n['to'] for n in json.loads(b)['query'].get('normalized',[])}
    meta={}
    for k,t in picks.items():
        em=pages[norm.get(t,t)]['imageinfo'][0]['extmetadata']
        meta[k]=dict(title=t,author=strip(em.get('Artist',{}).get('value'))[:90],license=strip(em.get('LicenseShortName',{}).get('value')),desc=strip(em.get('ImageDescription',{}).get('value'))[:160])
        print(k,meta[k],flush=True)
    json.dump(meta,open('meta.json','w'),indent=1,ensure_ascii=False)
