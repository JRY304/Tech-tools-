import json, urllib.request, time, os, urllib.error
from PIL import Image, ImageDraw
UA={'User-Agent':'PosterBuilder/1.0 (educational satire project)'}
import sys
c=json.load(open(sys.argv[1])); only=sys.argv[2:]
import subprocess
def get(u,p):
    if os.path.exists(p) and os.path.getsize(p)>0: return True
    for i in range(6):
        r=subprocess.run(['curl','-sS','-m','20','-A','PosterBuilder/1.0 (satire poster)','-o',p,'-w','%{http_code}',u],capture_output=True,text=True)
        code=r.stdout.strip(); print('  ',os.path.basename(p),code,flush=True)
        if code=='200': time.sleep(0.5); return True
        if os.path.exists(p): os.remove(p)
        time.sleep(6 if code=='429' else 2)
    return False
os.makedirs('dl/thumbs',exist_ok=True); os.makedirs('sheets',exist_ok=True)
for k,v in c.items():
    if only and k not in only: continue
    if os.path.exists(f'sheets/{k}.jpg'): continue
    v=v[:10]; tiles=[]
    open(f'sheets/{k}.txt','w').write('\n'.join(f'{i} {t}' for i,(t,u) in enumerate(v)))
    for i,(t,u) in enumerate(v):
        p=f'dl/thumbs/{k}_{i}.jpg'
        u=u.replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/').split('?')[0]
        if get(u,p):
            try: im=Image.open(p).convert('RGB'); im.thumbnail((240,240)); tiles.append((i,im))
            except Exception: pass
    W=5; H=(len(tiles)+W-1)//W or 1
    sh=Image.new('RGB',(W*250,H*265),'white'); d=ImageDraw.Draw(sh)
    for n,(i,im) in enumerate(tiles):
        x,y=(n%W)*250,(n//W)*265; sh.paste(im,(x+5,y+5)); d.rectangle([x,y+245,x+40,y+264],fill='red'); d.text((x+4,y+248),str(i),fill='white')
    sh.save(f'sheets/{k}.jpg',quality=80); print(k,len(tiles),flush=True)
